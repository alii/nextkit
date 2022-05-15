import {api} from '../../server/nextkit';

export default api({
	async GET() {
		return Date.now();
	},

	async POST() {
		return 'ok, nice post buddy!' as const;
	},

	async DELETE({res}) {
		// Previously this would have been `throw new NextkitError(400, message);`
		// but I added the `res.throw` method in `3.4.0`
		res.throw(400, "silly, you can't delete time!");
	},

	async PUT({req}) {
		return {
			query: req.query,
			message: 'here, have your query string back!',
		};
	},
});
