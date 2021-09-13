// Just an example, we can disable all rules here
/* eslint-disable */

import type api from './hello';
import type {InferAPIResponseType} from '../src';
import useSWR from 'swr';

type Data = InferAPIResponseType<typeof api>;

export default function HomePage() {
	const {data} = useSWR<Data>('/api/hello');

	// @ts-expect-error
	return <div>{data.time}</div>;
}
