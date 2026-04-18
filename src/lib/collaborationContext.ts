export type ActiveCollaboration = { projectId: string; userId: string };

let active: ActiveCollaboration | null = null;

export function setActiveCollaboration(next: ActiveCollaboration | null) {
	active = next;
}

export function getActiveCollaboration(): ActiveCollaboration | null {
	return active;
}
