import {createAPI, NextkitException} from '../src';

const api = createAPI({
	getContext: async (req, res) => {
		return {
			time: Date.now(),
			userAgent: req.headers['user-agent'],
			setHeader: res.setHeader,
		};
	},
	onError: async (req, res, err) => ({status: 500, message: err.message}),
});

export default api({
	async POST({context}) {
		return {
			agent: context.userAgent,
		};
	},

	async GET({context}) {
		return context.time;
	},

	async DELETE() {
		throw new NextkitException(400, 'This endpoint threw a 400!');
	},
});
