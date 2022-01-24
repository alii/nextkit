import useSWR from 'swr';
import {time} from '../client/client';

export default function Index() {
	const {data} = useSWR('time:get', () => time.get());

	return <div>{data}</div>;
}
