# nextkit

nextkit is a toolkit for Next.js apps that lets you generate type-safe, error handled Next.js API routes that conform to a standard response type.

### Basic Usage

```ts
// @filename src/server.ts

const api = createAPI({
	async onError(req, res, error) {
		return {
			status: 500,
			message: error.message,
		};
	},

	async getContext(req, res) {
		return {
			time: Date.now(),
		};
	},
});

// @filename src/pages/api/time.ts
import {api} from '../../server';

export default api({
	async GET({ctx}) {
		return `You requested at ${ctx.time}`;
	},
});
```

### Documentation

I plan to write documentation in the future. For now, you can find examples covering most features on the [GitHub repository](https://github.com/alii/nextkit/tree/main/apps/landing/src/pages/api).
