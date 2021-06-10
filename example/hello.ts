import {api} from '../src';

export default api<{time: number}>({
	async GET() {
		return {
			time: Date.now(),
		};
	},

	async POST() {
		return {
			_redirect: '/',
		};
	},
});
