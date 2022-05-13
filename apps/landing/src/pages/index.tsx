import {tw} from 'twind';

export default function Index() {
	return (
		<main className={tw`flex items-center justify-center h-screen w-screen flex-wrap`}>
			<div className={tw`text-center mx-12 mx-auto`}>
				<h1 className={tw`font-bold text-8xl`}>type-safe API Routes for Next.js</h1>

				<a
					href="https://github.com/alii/nextkit"
					target="_blank"
					rel="noopener noreferrer"
					className={tw`text-gray-500 font-mono text-sm`}
				>
					github.com/alii/nextkit
				</a>
			</div>
		</main>
	);
}
