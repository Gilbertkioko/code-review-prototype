import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { getActiveCollaboration } from '$lib/collaborationContext';

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
	if (res.ok) await invalidateAll();
	return { ok: res.ok };
}
