import {NextApiHandler, NextApiRequest, NextApiResponse} from 'next';

export type Method = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';

export type APIResponse<T> =
	| {success: true; data: T}
	| {success: false; data: null; message: string};

export type Handler<T> = (
	req: NextApiRequest,
	res: NextApiResponse<APIResponse<T>>
) => Promise<T | {_redirect: string}>;

export function api<T>(
	handlers: Partial<Record<Method, Handler<T>>>,
	debugLogs = true
): NextApiHandler<APIResponse<T>> {
	if (debugLogs) {
		console.log('[nextkit] Mounting route');
	}

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
					'[nextkit] Headers have already been sent but we have not had the opportunity to reply with some data.';

				if (process.env.NODE_ENV === 'development') {
					throw new Error(`${message} This error was thrown because NODE_ENV was \`development\`.`);
				} else {
					console.warn(message);
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
			if (debugLogs) {
				console.warn(e);
			}

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

export type InferAPIResponseType<T> = T extends NextApiHandler<APIResponse<infer X>> ? X : never;
