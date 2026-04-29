import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { realtimeClientLog } from '$lib/realtimeDebug';

/** Coalesce rapid Socket.IO invalidations (live sends both review + workspace per change). */
const SOCKET_DEBOUNCE_MS = 1600;

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function scheduleDebouncedInvalidateAll(source: string) {
	if (!browser) return;
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		debounceTimer = undefined;
		realtimeClientLog('invalidateAll()', { source: `${source} (debounced)` });
		void invalidateAll().catch(() => {
			// Invalidation can race during HMR/navigation; we don't want to crash the UI.
		});
	}, SOCKET_DEBOUNCE_MS);
}

export function cancelDebouncedInvalidateAll() {
	if (debounceTimer) {
		clearTimeout(debounceTimer);
		debounceTimer = undefined;
	}
}
