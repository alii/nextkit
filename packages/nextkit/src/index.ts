import type {NextApiHandler, NextApiRequest, NextApiResponse} from 'next';

export interface BaseAPIResponse {
	status: number;
}

export interface ErroredAPIResponse extends BaseAPIResponse {
	success: false;
	data: null;
	message: string;
}

export type Method = 'POST' | 'DELETE' | 'GET' | 'PATCH' | 'PUT';

export interface SuccessAPIResponse<T> extends BaseAPIResponse {
	success: true;
	data: T;
	message: null;
}

export type APIResponse<T> = SuccessAPIResponse<T> | ErroredAPIResponse;

export type NextkitRequest = NextApiRequest;
export type NextkitResponse<T> = NextApiResponse<T> & {
	throw(status: number, message: string): never;
};

export type NextkitErrorHandler = (
	req: NextApiRequest,
	res: NextApiResponse<ErroredAPIResponse>,
	error: Error
) => Promise<{
	status: number;
	message: string;
}>;

export interface ConfigWithoutContext {
	onError: NextkitErrorHandler;
}

export type Redirect = {_redirect: string};

export type NextkitHandler<Context, Result> = (data: {
	ctx: Context;
	req: NextkitRequest;
	res: NextkitResponse<APIResponse<Result>>;
}) => Promise<Result | Redirect>;

export type NextkitRawHandler<Context> = (data: {
	ctx: Context;
	req: NextkitRequest;
	res: NextkitResponse<unknown>;
}) => Promise<unknown>;

export type HandlerInit = Partial<Record<Method, unknown>>;

export interface ConfigWithContext<Context> extends ConfigWithoutContext {
	getContext(req: NextkitRequest, res: NextkitResponse<APIResponse<any>>): Promise<Context>;
}

export class NextkitError extends Error {
	constructor(public readonly code: number, message: string) {
		super(message);
	}
}

/**
 * This class exists because JavaScript, annoyingly, lets you throw anything.
 *
 * By constructing a WrappedError, we can be sure that all errors that could happen
 * inside of nextkit are always an instance of Error (therefore instanceof checks will work).
 */
export class WrappedError<T> extends Error {
	constructor(public readonly data: T) {
		super(
			'Some data was thrown, but it was not an instance of an Error, so a WrappedError was thrown instead. Access the .data property to read the original data that was thrown'
		);
	}
}

export type Config<Context = null> = ConfigWithContext<Context> | ConfigWithoutContext;

export type HandlersMap<Context, Init> = {
	[Method in keyof Init]: NextkitHandler<Context, Init[Method] | Redirect>;
};

export type ExportedHandler<Handlers extends HandlerInit> = (
	req: NextApiRequest,
	res: NextApiResponse<APIResponse<Handlers[keyof Handlers]>>
) => Promise<void>;

export type MapHandlerResults<Context, Handlers extends HandlersMap<Context, HandlerInit>> = {
	[Method in keyof Handlers]: Handlers[Method] extends NextkitHandler<Context, infer R> ? R : never;
};

export type Then<T> = T extends PromiseLike<infer R> ? Then<R> : T;
export type ThenFn<T> = T extends (...args: any) => PromiseLike<infer R> ? R : T;

export type InferAPIResponses<T> = T extends ExportedHandler<MapHandlerResults<any, infer Handlers>>
	? {[Method in keyof Handlers]: Exclude<ThenFn<Handlers[Method]>, Redirect>}
	: never;

export type InferAPIResponse<T, M extends Method> = InferAPIResponses<T>[M];

export type GetAPIContext<T> = T extends (
	handlers: Record<Method, NextkitHandler<infer Context, unknown>>
) => unknown
	? Context
	: never;

export function hasProp<Prop extends string | number | symbol>(
	value: unknown,
	prop: Prop
): value is Record<Prop, unknown> {
	if (value === null || value === undefined) {
		return false;
	}

	if (typeof value !== 'object') {
		return false;
	}

	return prop in value;
}

export const NO_RESPONSE_SENTINEL = Symbol('NEXTKIT_NO_RESPONSE_SENTINEL');

function detectHeadersSent(res: NextApiResponse): boolean {
	if (res.headersSent) {
		console.warn(
			'[nextkit] Nextkit has possibly detected a bug — headers have been sent but a NO_RESPONSE_SENTINEL was not found as an internal result type. Exiting early to prevent a double-send.'
		);
		return true;
	}
	return false;
}

export default function createAPI<Context = null>(config: Config<Context>) {
	/**
	 * @return {typeof NO_RESPONSE_SENTINEL} if request has been fully handled
	 * @return {unknown} the value to response with
	 * @throws {WrappedError | Error | NextkitError} if something wrong
	 */
	const getResult = async <
		H extends Partial<Record<Method, NextkitHandler<Context, unknown> | NextkitRawHandler<Context>>>
	>(
		handlers: H,
		_req: NextApiRequest,
		_res: NextApiResponse
	): Promise<unknown | typeof NO_RESPONSE_SENTINEL> => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const req = _req as NextkitRequest;
		const res = _res as NextkitResponse<unknown>;

		res.throw = function (status, message) {
			throw new NextkitError(status, message);
		};

		const handler = handlers[req.method as Method];

		try {
			if (!handler) {
				throw new NextkitError(405, `Cannot ${req.method ?? 'n/a'} this route`);
			}

			// Context will be null if no getContext is provided. The type is null when the option is not provided
			// into context, so it's safe to default to null here. We should cast to `never` to make sure
			// that TypeScript doesn't tell us it will be the same as Context at runtime, so never excludes
			// it from the type
			const ctx = 'getContext' in config ? await config.getContext(req, res) : (null as never);

			const result = await handler({ctx, req, res});

			if (hasProp(result, '_redirect') && typeof result._redirect === 'string') {
				res.redirect(result._redirect);
				return NO_RESPONSE_SENTINEL;
			}

			return result;
		} catch (error: unknown) {
			throw error instanceof Error ? error : new WrappedError(error);
		}
	};

	const handler =
		<
			Init extends HandlerInit,
			Handlers extends HandlersMap<Context, Init> = HandlersMap<Context, Init>
		>(
			handlers: Handlers
		): ExportedHandler<MapHandlerResults<Context, Handlers>> =>
		async (req, res) => {
			/**
			 * default response convention:
			 * - response with {@name SuccessAPIResponse} when handler returns non-redirect value
			 * - response with {@name ErroredAPIResponse} when handler throws
			 */
			try {
				const result = await getResult(handlers, req, res);

				// Hacky, but we have already sent a response,
				// so don't do it again!
				if (result === NO_RESPONSE_SENTINEL) {
					return;
				} else if (detectHeadersSent(res)) {
					return;
				}
				res.json({
					success: true,
					data: result as MapHandlerResults<Context, Handlers>[keyof Handlers],
					status: 200,
					message: null,
				});
			} catch (error: unknown) {
				if (error instanceof NextkitError) {
					// `NextkitError`s are intended to be handled by nextkit and returned by the API without the onError func
					res.status(error.code).json({
						status: error.code,
						message: error.message,
						data: null,
						success: false,
					});
				} else if (error instanceof Error) {
					const {status, message} = await config.onError(req, res, error);

					res.status(status).json({
						success: false,
						data: null,
						message,
						status,
					});
				}
			}
		};

	handler.raw = (handlers: {
		[Method in keyof HandlerInit]: NextkitRawHandler<Context>;
	}): NextApiHandler => {
		return (req, res) => getResult(handlers, req, res);
	};

	handler.bare = (handlers: {
		[Method in keyof HandlerInit]: NextkitRawHandler<Context>;
	}): NextApiHandler => {
		return async (req, res) => {
			/**
			 * "bare" response convention:
			 * - response with what {@name handlers} returns (except redirection)
			 * - response with a JSON string ("message") if {@name NextkitError} is thrown
			 * - response with what {@name Config.onError} returns when error happens
			 */

			try {
				const result = await getResult(handlers, req, res);

				// Hacky, but we have already sent a response,
				// so don't do it again!
				if (result === NO_RESPONSE_SENTINEL) {
					return;
				} else if (detectHeadersSent(res)) {
					return;
				}
				res.json(result);
			} catch (error: unknown) {
				if (error instanceof NextkitError) {
					// `NextkitError`s are intended to be handled by nextkit and returned by the API without the onError func
					res.status(error.code).json(error.message);
				} else if (error instanceof Error) {
					const {status, message} = await config.onError(req, res, error);
					res.status(status).json(message);
				}
			}
		};
	};

	return handler;
}

export {createAPI};
