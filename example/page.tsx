// Just an example, we can disable all rules here
/* eslint-disable */
// @ts-nocheck

import type {HandlerResponse} from './hello';
import {APIResponse} from '../dist';

export default function HomePage() {
	const data = useFetch<APIResponse<HandlerResponse>>('/api/hello');
	return <div>hi</div>;
}
