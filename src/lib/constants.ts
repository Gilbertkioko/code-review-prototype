import type { CategoryDef, CodeReviewObservationRowState } from './types';

export const ACADEMY_BASE = 'https://kood-review-academy-prototype-sxyr.vercel.app/academy';

/**
 * Prototype: sprint board shows at most this many observation rows per category.
 * Sprint completion matches the same cap (see `allCategoriesComplete` / `codeReviewObservationsList`).
 */
export const CODE_REVIEW_OBSERVATIONS_PER_CATEGORY_CAP = 3;

/** Observations included in the async code-review sprint UI and completion rules. */
export function codeReviewObservationsForCategory(c: CategoryDef) {
	return c.observations.slice(0, CODE_REVIEW_OBSERVATIONS_PER_CATEGORY_CAP);
}

/** You (jane): Security + Correctness. Joe: Performance + Structure & architecture. */
export const CATEGORIES: CategoryDef[] = [
	{
		id: 'security',
		title: 'Security',
		assignee: 'jane',
		academyHint: 'cat-security',
		assignmentBlurb:
			'The system should resist abuse, protect sensitive data, enforce access control, and avoid trusting the wrong inputs.',
		observations: [
			{
				id: 's1',
				text: 'Input sanitization — Verify that user input (messages, profile data) is validated or sanitized before being used or sent to backend services'
			},
			{
				id: 's2',
				text: 'Authentication handling — Verify that authentication state is derived from a secure source (e.g., FirebaseAuth, token service) and not from client-controlled flags'
			},
			{
				id: 's3',
				text: 'Authorization checks — Verify that access to chat conversations is restricted based on the authenticated user’s identity'
			},
			{
				id: 's4',
				text: 'Sensitive data protection — No hardcoded secrets or sensitive values in logs; store and handle credentials safely.',
				submitterText: 'Your code protects sensitive data by avoiding hardcoded secrets and safely handling credentials.'
			},
			{
				id: 's5',
				text: 'Dependency vulnerabilities — Third-party libraries are maintained and not knowingly risky or unnecessary.',
				submitterText: 'Your project uses maintained third-party libraries without known vulnerabilities.'
			}
		]
	},
	{
		id: 'correctness',
		title: 'Correctness',
		assignee: 'jane',
		academyHint: 'cat-correctness',
		assignmentBlurb:
			'Does the code do what it is supposed to — requirements, edge cases, validation, data integrity, and plain logic?',
		observations: [
			{
				id: 'cr1',
				text: 'Requirement implementation — Verify that sending a message results in it being persisted and displayed in the chat UI.'
			},
			{
				id: 'cr2',
				text: 'Edge case handling — Verify that the system handles empty message lists without errors.'
			},
			{
				id: 'cr3',
				text: 'Input validation — Verify that message input prevents invalid values (e.g., empty messages or excessively large payloads).'
			},
			{
				id: 'cr4',
				text: 'Data integrity — Updates and transactions keep related data consistent without partial or inconsistent states.',
				submitterText: 'Your code maintains data integrity through consistent updates and transactions.'
			},
			{
				id: 'cr5',
				text: 'Logical correctness — Conditions, operators, algorithms, and loops match the intended behaviour.',
				submitterText: 'Your code\'s logic, including conditions, operators, algorithms, and loops, is correct.'
			}
		]
	},
	{
		id: 'performance',
		title: 'Performance',
		assignee: 'joe',
		academyHint: 'cat-performance',
		assignmentBlurb:
			'Is the solution efficient enough for real-world load — algorithms, data access, memory, I/O, and obvious reuse?',
		observations: [
			{
				id: 'p1',
				text: 'Algorithm complexity — Verify that message lookup or user matching logic does not rely on nested iteration over full collections'
			},
			{
				id: 'p2',
				text: 'Database query efficiency — Verify that database queries are not executed inside loops when fetching chat messages or user data'
			},
			{
				id: 'p3',
				text: 'Memory efficiency — Verify that large message lists are not stored entirely in memory without pagination or streaming'
			},
			{
				id: 'p4',
				text: 'I/O efficiency — Reuse or batch APIs, files, and network calls instead of repeating identical work in tight loops.',
				submitterText: 'Your I/O operations are efficient, reusing and batching where possible.'
			},
			{
				id: 'p5',
				text: 'Caching usage — Do not recompute or refetch the same expensive result when a small cache or reuse is clearly better.',
				submitterText: 'Your code uses caching effectively to avoid recomputing expensive results.'
			}
		]
	},
	{
		id: 'structure_architecture',
		title: 'Structure & architecture',
		assignee: 'joe',
		academyHint: 'cat-structure',
		assignmentBlurb:
			'Is the codebase organized so the system stays understandable, scalable, and maintainable as it grows?',
		observations: [
			{
				id: 'st1',
				text: 'Separation of concerns — Verify that UI components do not contain business logic for message handling or user matching'
			},
			{
				id: 'st2',
				text: 'Module organization — Verify that project structure groups related features logically (e.g., chat, auth, user profiles'
			},
			{
				id: 'st3',
				text: 'Dependency management — Verify that core modules (e.g., services, repositories) do not depend on UI components'
			},
			{
				id: 'st4',
				text: 'Layer boundaries — Logic stays in the layer it belongs to, without leaking DB or transport details upward.',
				submitterText: 'Your code respects layer boundaries, preventing leakage of lower-level details.'
			},
			{
				id: 'st5',
				text: 'Code cohesion — Each module keeps closely related responsibilities instead of unrelated grab-bags.',
				submitterText: 'Your modules have high cohesion, focusing on related responsibilities.'
			}
		]
	}
];

export function emptyCodeReviewObservationRow(): CodeReviewObservationRowState {
	return {
		jane: 'pending',
		joe: 'pending',
		comments: [],
		drafts: {},
		verdictHistory: []
	};
}

export function emptyObservationRowsForCategory(
	categoryId: string
): Record<string, CodeReviewObservationRowState> {
	const cat = CATEGORIES.find((c) => c.id === categoryId);
	const o: Record<string, CodeReviewObservationRowState> = {};
	cat?.observations.forEach((obs) => {
		o[obs.id] = emptyCodeReviewObservationRow();
	});
	return o;
}
