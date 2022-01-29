import useSWR from 'swr';
import {tw} from 'twind';
import {time} from '../client/client';
import {motion, useMotionTemplate, useTransform, useViewportScroll} from 'framer-motion';
import {cubicBezier} from 'popmotion';

const ease = cubicBezier(0.03, 0.84, 0.15, 0.95);

export default function Index() {
	const {data} = useSWR('time:get', async () => time.get());

	const scroll = useViewportScroll();

	const textBlur = useTransform(scroll.scrollYProgress, [0, 0.1], [10, 0]);
	const textBlurTemplate = useMotionTemplate`blur(${textBlur}px)`;

	return (
		<main className={tw`h-[200vh] overflow-hidden`}>
			<div className={tw`flex items-center justify-center h-screen`}>
				<motion.div style={{y: scroll.scrollY}} className={tw`text-center`}>
					<motion.h1
						initial={{y: -100}}
						animate={{y: 0}}
						transition={{duration: 1, ease}}
						style={{
							filter: textBlurTemplate,
							scale: useTransform(scroll.scrollYProgress, [0, 1], [10, 1], {ease}),
							opacity: useTransform(scroll.scrollYProgress, [0, 0.1, 0.5, 1], [0, 1, 1, 0], {ease}),
						}}
						className={tw`font-bold text-4xl`}
					>
						type-safe API Routes for Next.js
					</motion.h1>

					<motion.code
						style={{
							opacity: useTransform(scroll.scrollYProgress, [0, 0.8, 1], [0, 0, 1]),
						}}
						className={tw`text-gray-500`}
					>
						{data}
					</motion.code>
				</motion.div>
			</div>
		</main>
	);
}
