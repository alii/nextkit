# nextkit - [demo app](https://github.com/alii/nextkit-demo)

nextkit is a toolkit for Next.js apps that lets you generate type-safe, error handled Next.js API routes that conform to a standard response type.

### example

My recommended pattern can be found in the `example` folder. This file exports a _type_ that can be ambiently imported in the frontend to have a guaranteed type for the API (plus, you can wrap it with the type `APIResponse<T>` to have the actual json typed from the HTTP response).

- **demo app**: [`github.com/alii/nextkit-demo`](https://github.com/alii/nextkit-demo)
- **demo with [vercel/swr](https://github.com/vercel/swr)**: [`github.com/prequist/next-boilerplate`](https://github.com/prequist/next-boilerplate)

### docs

honestly the examples folder is good enough and it demonstrates all the features. i have no motivation to write docs yet 🚀🚀
