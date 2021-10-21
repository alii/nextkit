import {NextApiRequest, NextApiResponse} from 'next';

export type Method = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';

// eslint-disable-next-line @typescript-eslint/ban-types
export type NextkitApiRequest<M extends Method> = Omit<NextApiRequest, 'method'> & {
	method: M;
};

export interface SuccessfulAPIResponse<T> {
	success: true;
	data: T;
}

export interface ErroredAPIResponse {
	success: false;
	data: null;
	message: string;
}

export type NextkitErrorHandler = (
	req: NextApiRequest,
	res: NextApiResponse<ErroredAPIResponse>,
	err: Error
) => unknown;

export type APIResponse<T> = SuccessfulAPIResponse<T> | ErroredAPIResponse;

// Never record is to not allow any keys even in a generic that might extend.
// this limits any value passed as a generic to be strictly _redirect.
// pg: https://www.typescriptlang.org/play?#code/C4TwDgpgBAdg9sAFgSxgcygXigbxgQwFsIAuKAZ2ACdU0BfKAMigCUIBjOKgEwB4YIANwhUANLCEiAfAFgAUPIBmAVxjtgyODCjB8AawjkAcghToAFAW74y8JLQCUueVCgB6N-Lrz5ug8dNaczwiUigAInDxfDQwgCY6BwBueSA
export type REDIRECT = {_redirect: string} & Record<never, never>;

/**
 * Handler for a nextkit route. T is the response type
 */
export type NextkitHandler<M extends Method, T> = (
	req: NextkitApiRequest<M>,
	res: NextApiResponse<APIResponse<T>>
) => Promise<T | REDIRECT>;

type ExportedHandler<Handlers> = (
	req: NextkitApiRequest<Method>,
	res: NextApiResponse<APIResponse<Handlers[keyof Handlers]>>
) => Promise<void>;

export type HandlersInit = Partial<{
	[M in Method]: NextkitHandler<M, unknown>;
}>;

export type PullHandlerResponses<T extends HandlersInit> = {
	[Key in keyof T]: NonNullable<T[Key]> extends NextkitHandler<Method, infer Y> ? Y : never;
};

export function createAPIWithHandledErrors(errHandler: NextkitErrorHandler) {
	return <Handlers extends HandlersInit>(handlers: Handlers) => api(handlers, errHandler);
}

function hasProp<Prop extends string | number | symbol>(
	value: unknown,
	prop: Prop
): value is Record<Prop, unknown> {
	if (typeof value !== 'object') {
		return false;
	}

	if (!value) {
		return false;
	}

	return prop in value;
}

/**
 * Create a type-safe api route
 * @param handlers The object of handlers to run for this route
 * @param errorHandler An optional error handler. Preferred usage is with the createAPIWithHandledErrors function
 * @returns A NextApiHandler
 */
export function api<Handlers extends HandlersInit>(
	handlers: Handlers,
	errorHandler?: NextkitErrorHandler
): ExportedHandler<PullHandlerResponses<Handlers>> {
	return async (req, res) => {
		const handler = handlers[req.method];

		if (!handler) {
			res.status(409).json({
				success: false,
				data: null,
				message: `Cannot ${req.method} this route.`,
			});

			return;
		}

		try {
			// Bruh req as never ?!?!?!
			// reading: https://discord.com/channels/508357248330760243/746364189710483546/900762016443150446
			const result = await handler(req as never, res as NextApiResponse<APIResponse<unknown>>);

			if (hasProp(result, '_redirect')) {
				res.redirect(result._redirect as string);
				return;
			}

			res.json({
				success: true,
				data: result as PullHandlerResponses<Handlers>[keyof Handlers],
			});
		} catch (error: unknown) {
			if (!(error instanceof Error)) {
				res.status(500).json({
					success: false,
					data: null,
					message: 'Something went wrong.',
				});

				return;
			}

			// We don't want to handle HttpExceptions.
			// That is the whole point of using them.
			if (!(error instanceof HttpException) && errorHandler) {
				errorHandler(req, res, error);
				return;
			}

			const code = error instanceof HttpException ? error.code : 500;
			const message = error instanceof HttpException ? error.message : 'Something went wrong';

			res.status(code).json({
				success: false,
				data: null,
				message,
			});
		}
	};
}

/**
 * Class that represents an error thrown on the server.
 */
export class HttpException extends Error {
	/**
	 * Constructor for HttpException
	 * @constructor
	 * @param code The HTTP code to reply with
	 * @param message A message shipped back in the response json
	 */
	constructor(public readonly code = 500, message = 'Something went wrong!') {
		super(message);
	}
}

export type RemoveRedirects<T> = Exclude<T, REDIRECT>;

// I have to use any here for some reason, unknown[] doesn't unwrap
export type UnwrapHandlerResponse<T> = T extends (...args: any[]) => Promise<infer Res>
	? Res
	: never;
export type InferAPIResponseType<T, M extends Method> = RemoveRedirects<
	T extends ExportedHandler<PullHandlerResponses<infer X>> ? UnwrapHandlerResponse<X[M]> : never
>;

export default api;

// Testing area
// const h = api({
// 	async GET(req, res) {
// 		return true;
// 	},

// 	async POST(req, res) {
// 		return false;
// 	},

// 	async DELETE() {
// 		return 0;
// 	},
// });

// type Y = InferAPIResponseType<typeof h, 'GET'>;
