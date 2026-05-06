import { browser } from '$app/environment';
import { invalidate, invalidateAll } from '$app/navigation';
import { WORKSPACE_PAGE_LOAD } from '$lib/workspaceLoadDependency';

/** Coalesce rapid admin / no-payload invalidations (full tree). */
const ADMIN_DEBOUNCE_MS = 550;

/** Project-scoped Socket.IO events: refetch only the home workspace load (faster than `invalidateAll`). */
const WORKSPACE_DEBOUNCE_MS = 320;

let adminDebounceTimer: ReturnType<typeof setTimeout> | undefined;
let workspaceDebounceTimer: ReturnType<typeof setTimeout> | undefined;

export function scheduleDebouncedInvalidateAll(source: string) {
	if (!browser) return;
	if (adminDebounceTimer) clearTimeout(adminDebounceTimer);
	adminDebounceTimer = setTimeout(() => {
		adminDebounceTimer = undefined;
		void invalidateAll().catch(() => {
			// Invalidation can race during HMR/navigation; we don't want to crash the UI.
		});
	}, ADMIN_DEBOUNCE_MS);
}

/** After saves or `workspace:invalidate` with a `projectId` (trio members). */
export function scheduleDebouncedWorkspaceReload(source: string) {
	if (!browser) return;
	if (workspaceDebounceTimer) clearTimeout(workspaceDebounceTimer);
	workspaceDebounceTimer = setTimeout(() => {
		workspaceDebounceTimer = undefined;
		void invalidate(WORKSPACE_PAGE_LOAD).catch(() => {
			/* ignore */
		});
	}, WORKSPACE_DEBOUNCE_MS);
}

export function cancelDebouncedInvalidateAll() {
	if (adminDebounceTimer) {
		clearTimeout(adminDebounceTimer);
		adminDebounceTimer = undefined;
	}
	if (workspaceDebounceTimer) {
		clearTimeout(workspaceDebounceTimer);
		workspaceDebounceTimer = undefined;
	}
}
