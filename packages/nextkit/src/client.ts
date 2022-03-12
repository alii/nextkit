import * as api from 'alistair/api-client';
import type {InferAPIResponse, NextkitError} from '.';

/**
 * Creates the base client instance
 * @param base The base url of the API
 * @param initFetcher A function that returns RequestInit to add to all requests
 * @returns An endpoint factory
 */
export function createAPIClient(base: string, initFetcher?: api.InitFetcher) {
	const client = api.createAPIClient(base, initFetcher);

	function endpoint<Path extends string, Method extends Uppercase<api.Method>, T = unknown>(
		path: Path,
		method: Method
	) {
		const instance = client.endpoint(path, method as api.Method);

		const wrapped = client.as.json(instance).type<InferAPIResponse<T, Method>>();

		return wrapped.run;
	}

	/**
	 * Creates a typed endpoint instance
	 * @returns An endpoint instance
	 */
	function from<T>() {
		return {
			endpoint: <Path extends string, Method extends Uppercase<api.Method>>(
				path: Path,
				method: Method
			) => endpoint<Path, Method, T>(path, method),
		};
	}

	return {endpoint, from};
}

export class NextkitClientError extends Error implements NextkitError {
	constructor(public readonly code: number, message: string) {
		super(message);
	}
}

export default createAPIClient;
