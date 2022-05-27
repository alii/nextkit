import createAPI from 'nextkit';

export const api = createAPI({
	async onError() {
		return {
			status: 500,
			message: 'Something went wrong.',
		};
	},

	async getContext() {
		return {
			time: Date.now(),
		};
	},
});
