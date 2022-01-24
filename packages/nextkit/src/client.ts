import type {
	APIResponse,
	InferAPIResponses,
	InferAPIResponse,
	Method,
	NextkitException,
	SuccessAPIResponse,
} from '.';
import urlcat, {ParamMap} from 'urlcat';

export function wasSuccess<T>(req: Response, json: APIResponse<T>): json is SuccessAPIResponse<T> {
	return req.status < 400 && req.status >= 200 && json.success;
}

export class NextkitClientException extends Error implements NextkitException {
	constructor(public readonly code: number, message: string) {
		super(message);
	}
}

export default function createAPIClient(base: string) {
	function define<T>(endpoint: string, definitionInit?: RequestInit) {
		const method =
			<M extends Method>(method: M) =>
			async (querystring: ParamMap = {}, methodInit: Omit<RequestInit, 'method'> = {}) => {
				const url = urlcat(base, endpoint, querystring);

				const request = await fetch(url, {
					...definitionInit,
					...methodInit,
					method,
				});

				const json = (await request.json()) as APIResponse<InferAPIResponse<T, M>>;

				if (!wasSuccess(request, json)) {
					throw new NextkitClientException(request.status, json.message);
				}

				return json.data;
			};

		const handlers = {
			get: method('GET'),
			post: method('POST'),
			delete: method('DELETE'),
			patch: method('PATCH'),
			put: method('PUT'),
		};

		type ValidMethods = Lowercase<keyof InferAPIResponses<T> & string>;

		return handlers as Pick<typeof handlers, Extract<ValidMethods, keyof typeof handlers>>;
	}

	return {define};
}

export {createAPIClient};
