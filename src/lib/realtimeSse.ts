import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { realtimeClientLog } from '$lib/realtimeDebug';

/** In production, SSE is opt-in (`PUBLIC_REALTIME_SSE=1`) because in-process fan-out does not cross Vercel instances. Dev defaults to on unless set to `0`. */
export function isRealtimeSseEnabled(): boolean {
	const v = env.PUBLIC_REALTIME_SSE;
	if (v === '0' || v === 'false') return false;
	if (v === '1' || v === 'true') return true;
	return Boolean(import.meta.env.DEV);
}

/**
 * Same-origin EventSource for `/api/realtime` (cookies sent automatically).
 * Coexists with Socket.IO when both run in one Node process; use without Socket.IO on Vercel only if you add shared pub/sub later.
 */
export function connectRealtimeSse(onInvalidate: (source: string) => void): { close: () => void } | null {
	if (!browser || typeof EventSource === 'undefined') return null;
	const es = new EventSource('/api/realtime');
	const bump =
		(source: string) =>
		() => {
			onInvalidate(source);
		};
	es.addEventListener('review', bump('sse:review'));
	es.addEventListener('workspace', bump('sse:workspace'));
	es.addEventListener('ready', () => {
		realtimeClientLog('sse connected');
	});
	es.onerror = () => {
		realtimeClientLog('sse error / reconnecting');
	};
	return {
		close: () => {
			es.close();
			realtimeClientLog('sse closed');
		}
	};
}
