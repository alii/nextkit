import {NextkitException} from 'nextkit';
import {api} from '../../server/nextkit';

export default api({
	async GET() {
		return Date.now();
	},

	async POST() {
		return 'ok, nice post buddy!' as const;
	},

	async DELETE() {
		throw new NextkitException(400, "silly, you can't delete time!");
	},

	async PUT({req}) {
		return {
			query: req.query,
			message: 'here, have your query string back!',
		};
	},
});
