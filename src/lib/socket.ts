import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { io, type Socket } from 'socket.io-client';

let singleton: Socket | null = null;
let connectErrorStreak = 0;
/** After repeated handshake failures, do not recreate the client until a full reload (avoids a create↔404 loop). */
let gaveUpUntilReload = false;

/** Stop xhr polling /socket.io after this many failed handshakes (e.g. Vercel 404 — no Node Socket.IO server). */
const CONNECT_ERRORS_BEFORE_DISABLE = 4;

function realtimeDisabledByEnv(): boolean {
	const v = env.PUBLIC_REALTIME_SOCKET;
	return v === '0' || v === 'false';
}

function tearDownSingleton() {
	if (!singleton) return;
	singleton.io.reconnection(false);
	singleton.disconnect();
	singleton.removeAllListeners();
	singleton = null;
	connectErrorStreak = 0;
}

/**
 * Socket.IO when a Node server attaches it (`vite` plugin / `node server.js`).
 * On Vercel serverless there is no `/socket.io` — set `PUBLIC_REALTIME_SOCKET=0` to skip the client entirely,
 * or the client disables itself after repeated connect failures to avoid 404 spam.
 */
export function getRealtimeSocket(): Socket | null {
	if (!browser) return null;
	if (realtimeDisabledByEnv()) {
		gaveUpUntilReload = false;
		tearDownSingleton();
		return null;
	}
	if (gaveUpUntilReload) return null;
	if (!singleton) {
		singleton = io({
			path: '/socket.io',
			withCredentials: true,
			autoConnect: true,
			reconnectionAttempts: 12,
			reconnectionDelay: 1500,
			reconnectionDelayMax: 12000,
			timeout: 20000
		});
		singleton.on('connect', () => {
			connectErrorStreak = 0;
		});
		singleton.on('connect_error', () => {
			connectErrorStreak += 1;
			if (connectErrorStreak >= CONNECT_ERRORS_BEFORE_DISABLE) {
				gaveUpUntilReload = true;
				tearDownSingleton();
			}
		});
	}
	return singleton;
}

/** @deprecated Use {@link getRealtimeSocket} */
export function createAppSocket(): Socket | null {
	return getRealtimeSocket();
}
