import {AppProps} from 'next/app';

import '../main.css';

export default function App({Component, pageProps}: AppProps) {
	return (
		<div className="bg-black text-white">
			<Component {...pageProps} />
		</div>
	);
}
