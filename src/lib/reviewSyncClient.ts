import { browser } from '$app/environment';
import { invalidate, invalidateAll } from '$app/navigation';
import { getActiveCollaboration } from '$lib/collaborationContext';
import { WORKSPACE_PAGE_LOAD } from '$lib/workspaceLoadDependency';

export async function postFormReviewAction(
	action: string,
	fields: Record<string, string>
): Promise<{ ok: boolean }> {
	if (!browser) return { ok: false };
	const c = getActiveCollaboration();
	if (!c?.projectId) return { ok: false };
	const fd = new FormData();
	fd.set('projectId', c.projectId);
	for (const [k, v] of Object.entries(fields)) fd.set(k, v);
	const res = await fetch(`?/${action}`, { method: 'POST', body: fd, credentials: 'include' });
	if (res.ok) {
		await invalidate(WORKSPACE_PAGE_LOAD);
	}
	return { ok: res.ok };
}

/** Persist testing + code review JSON (includes standup + 360° feedback blocks) for a known project. */
export async function saveReviewStateWithPayloads(
	projectId: string,
	testingPayload: string,
	codeReviewPayload: string
): Promise<boolean> {
	if (!browser) return false;
	const fd = new FormData();
	fd.set('projectId', projectId);
	fd.set('testingPayload', testingPayload);
	fd.set('codeReviewPayload', codeReviewPayload);
	try {
		const res = await fetch('?/saveReviewState', { method: 'POST', body: fd, credentials: 'include' });
		if (res.ok) {
			await invalidate(WORKSPACE_PAGE_LOAD);
		}
		return res.ok;
	} catch {
		return false;
	}
}
