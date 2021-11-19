// Just an example, we can disable all rules here
/* eslint-disable */
// @ts-nocheck

import type api from './hello';
import type {InferAPIResponse} from '../src';
import useSWR from 'swr';

type Data = InferAPIResponse<typeof api, 'GET'>;

export default function HomePage() {
	const {data} = useSWR<Data>('/api/hello');
	return <div>{data}</div>;
}
