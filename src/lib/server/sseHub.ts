import { EventEmitter } from 'node:events';

/** In-process fan-out (dev, single-node `server.js`). Not shared across Vercel serverless instances — polling remains the cross-invocation fallback. */
const emitter = new EventEmitter();
emitter.setMaxListeners(2000);

export type SseFanoutEvent = 'review' | 'workspace';

type FanoutMessage = { sseEvent: SseFanoutEvent; data: Record<string, unknown> };

function channelUser(userId: string) {
	return `sse:user:${userId}`;
}

function channelRole(role: string) {
	return `sse:role:${role}`;
}

export function ssePublishUser(userId: string, sseEvent: SseFanoutEvent, data: Record<string, unknown>) {
	emitter.emit(channelUser(userId), { sseEvent, data } satisfies FanoutMessage);
}

export function ssePublishRole(role: string, sseEvent: SseFanoutEvent, data: Record<string, unknown>) {
	emitter.emit(channelRole(role), { sseEvent, data } satisfies FanoutMessage);
}

export function sseSubscribe(
	channels: string[],
	onMessage: (sseEvent: SseFanoutEvent, data: Record<string, unknown>) => void
): () => void {
	const handler = (msg: FanoutMessage) => onMessage(msg.sseEvent, msg.data);
	for (const ch of channels) {
		emitter.on(ch, handler);
	}
	return () => {
		for (const ch of channels) {
			emitter.off(ch, handler);
		}
	};
}
