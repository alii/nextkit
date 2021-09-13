import {blue} from 'colorette';
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

export type NextkitLogger = boolean | ((...args: unknown[]) => unknown);

export type APIResponse<T> = SuccessfulAPIResponse<T> | ErroredAPIResponse;

// Never record is to not allow any keys even in a generic that might extend.
// this limits any value passed as a generic to be strictly _redirect.
export type REDIRECT = {_redirect: string} & Record<never, never>;

export type NextkitHandler<T> = (
	req: NextApiRequest,
	res: NextApiResponse<APIResponse<T>>
) => Promise<T | REDIRECT>;

function getLogger(logger: NextkitLogger) {
	if (typeof logger === 'function') {
		return logger;
	}

	if (logger) {
		return function (...args: unknown[]) {
			console.log(`${blue('nextkit')} –`, ...args);
		};
	}

	return null;
}

export function api<T>(
	handlers: Partial<Record<Method, NextkitHandler<T>>>,
	logfn: NextkitLogger = process.env.NODE_ENV === 'development'
): NextApiHandler<APIResponse<T>> {
	const logger = getLogger(logfn);
	logger?.('Mounting route');

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

			if (res.headersSent) {
				const message =
					'Headers have already been sent but we have not had the opportunity to reply with some data.';

				if (process.env.NODE_ENV === 'development') {
					throw new Error(`${message} This error was thrown because NODE_ENV was \`development\`.`);
				} else {
					logger?.(message);
				}

				return;
			}

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

			if (code === 500) {
				logger?.(e);
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
