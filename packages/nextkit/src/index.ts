import type {NextApiRequest, NextApiResponse} from 'next';

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
	/** @deprecated Use .ctx instead */
	context: Context;
	ctx: Context;
	req: NextApiRequest;
	res: NextApiResponse<APIResponse<Result>>;
}) => Promise<Result | Redirect>;

export type HandlerInit = Partial<Record<Method, unknown>>;

export interface ConfigWithContext<Context> extends ConfigWithoutContext {
	getContext(req: NextApiRequest, res: NextApiResponse<APIResponse<any>>): Promise<Context>;
}

export class NextkitError extends Error {
	constructor(public readonly code: number, message: string) {
		super(message);
	}
}

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

export function hasProp<Prop extends string | number | symbol>(
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

export default function createAPI<Context = null>(config: Config<Context>) {
	return <
		Init extends HandlerInit,
		Handlers extends HandlersMap<Context, Init> = HandlersMap<Context, Init>
	>(
		handlers: Handlers
	): ExportedHandler<MapHandlerResults<Context, Handlers>> => {
		return async (req, res) => {
			const handler = handlers[req.method as Method];

			try {
				if (!handler) {
					throw new NextkitError(405, `Cannot ${req.method ?? 'n/a'} this route`);
				}

				// Context will be null if no getContext is provided. The type is null when the option is not provided
				// into context, so it's safe to default to null here. We should cast to `never` to make sure
				// that TypeScript doesn't tell us it will be the same as Context at runtime, so never excludes
				// it from the type
				const context =
					'getContext' in config ? await config.getContext(req, res) : (null as never);

				const result = await handler({
					context,
					ctx: context,
					req,
					res: res as NextApiResponse<APIResponse<unknown>>,
				});

				if (hasProp(result, '_redirect')) {
					res.redirect(result._redirect);
					return;
				}

				res.json({
					success: true,
					data: result as MapHandlerResults<Context, Handlers>[keyof Handlers],
					status: 200,
					message: null,
				});
			} catch (error: unknown) {
				// `NextkitError`s are intended to be handled by nextkit and returned by the API without the onError func
				if (error instanceof NextkitError) {
					res.status(error.code).json({
						status: error.code,
						message: error.message,
						data: null,
						success: false,
					});

					return;
				}

				const wrapped = error instanceof Error ? error : new WrappedError(error);

				const result = await config.onError(req, res, wrapped);

				res.status(result.status).json({
					success: false,
					data: null,
					message: result.message,
					status: result.status,
				});
			}
		};
	};
}

export {createAPI};
