import {NextApiHandler, NextApiRequest, NextApiResponse} from 'next';

export type Method = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';

export type SuccessfulAPIResponse<T> = {
	success: true;
	data: T;
};

export type ErroredAPIResponse = {
	success: false;
	data: null;
	message: string;
};

export type NextkitErrorHandler = (
	req: NextApiRequest,
	res: NextApiResponse<ErroredAPIResponse>,
	err: Error
) => unknown;

export type APIResponse<T> = SuccessfulAPIResponse<T> | ErroredAPIResponse;

// Never record is to not allow any keys even in a generic that might extend.
// this limits any value passed as a generic to be strictly _redirect.
export type REDIRECT = {_redirect: string} & Record<never, never>;

export type NextkitHandler<T> = (
	req: NextApiRequest,
	res: NextApiResponse<APIResponse<T>>
) => Promise<T | REDIRECT>;

export function createAPIWithHandledErrors(handler: NextkitErrorHandler) {
	return <T>(handlers: Partial<Record<Method, NextkitHandler<T>>>) => api(handlers, handler);
}

export function api<T>(
	handlers: Partial<Record<Method, NextkitHandler<T>>>,
	errorHandler?: NextkitErrorHandler
): NextApiHandler<APIResponse<T>> {
	return async function (req, res) {
		const handler = handlers[req.method as Method];

		if (!handler) {
			res.status(405).json({
				success: false,
				data: null,
				message: `Cannot ${req.method ?? 'n/a'} this endpoint!`,
			});

			return;
		}

		try {
			const result = await handler(req, res);

			if (typeof result === 'object' && '_redirect' in result) {
				res.redirect(result._redirect);
				return;
			}

			res.json({
				success: true,
				data: result,
			});
		} catch (e: unknown) {
			if (!(e instanceof Error)) {
				res.status(500).json({
					success: false,
					data: null,
					message: 'Something went wrong.',
				});

				return;
			}

			const code = e instanceof HttpException ? e.code : 500;
			const message = e instanceof HttpException ? e.message : 'Something went wrong';

			// We don't want to handle HttpExceptions.
			// That is the whole point of using them.
			if (!(e instanceof HttpException) && errorHandler) {
				errorHandler(req, res, e);
				return;
			}

			res.status(code).json({
				success: false,
				data: null,
				message,
			});
		}
	};
}

export class HttpException extends Error {
	constructor(public readonly code: number, message: string) {
		super(message);
	}
}

export type RemoveRedirects<T> = T extends REDIRECT ? never : T;
export type InferAPIResponseType<T> = RemoveRedirects<
	T extends NextApiHandler<APIResponse<infer X>> ? X : T
>;
