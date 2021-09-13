// Don't import src, use `from 'nextkit';` 😃
import {api, HttpException} from '../src';

export default api({
	// Example of standard use
	async GET() {
		return {
			time: Date.now(),
		};
	},

	// Example of redirecting a request
	async POST() {
		return {
			_redirect: '/',
		};
	},

	// Example of throwing an intentional error (the message gets sent back to the client)
	async DELETE() {
		throw new HttpException(400, 'This endpoint threw a 400!');
	},
});
