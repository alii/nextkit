import {api} from '../../server/nextkit';

// We use `api.raw` when we don't want nextkit to handle responses.
// This is useful for sending a PDF or other binary data back down to the client
// rather than a JSON object. Or, when you don't want the object to be in nextkit's
// `APIResponse<T>` type.

// Be warned that using `api.raw` means that you **must** close all connections
// and end all responses otherwise the server will hang.

// Type information is also lost when using `api.raw` so you should only use it
// if you really must and you know what you're doing.

// It's an escape hatch :D

export default api.raw({
	async GET({res}) {
		res.end(Date.now().toString());
	},
});
