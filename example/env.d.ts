// Pretend that SWR exists for the example
declare module 'swr' {
	function useSWR<T>(path: string): {data: T};
	export = useSWR;
}

declare namespace JSX {
	export interface IntrinsicElements {
		// Pretend that div exists for the example
		div: Record<never, never>;
	}
}
