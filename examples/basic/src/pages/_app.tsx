import withTwindApp from '@twind/next/app';
import {AppProps} from 'next/app';
import {tw} from 'twind';

import '../main.css';

function App({Component, pageProps}: AppProps) {
	return (
		<div className={tw`bg-black text-white`}>
			<Component {...pageProps} />
		</div>
	);
}

export default withTwindApp(App);
