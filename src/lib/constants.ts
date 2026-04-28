import type { CategoryDef, CodeReviewObservationRowState } from './types';

export const ACADEMY_BASE = 'https://kood-review-academy-prototype-sxyr.vercel.app/academy';

/**
 * Prototype: sprint board shows at most this many observation rows per category.
 * Sprint completion matches the same cap (see `allCategoriesComplete` / `codeReviewObservationsList`).
 */
export const CODE_REVIEW_OBSERVATIONS_PER_CATEGORY_CAP = 2;

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
				text: 'Input sanitization — Treat external input as untrusted; validate and escape before it drives queries or behaviour.',
				submitterText: 'Your code properly sanitizes and validates all external inputs to prevent security risks.'
			},
			{
				id: 's2',
				text: 'Authentication handling — Verify that a user is who they claim to be with proper mechanisms, not client-only flags.',
				submitterText: 'Your authentication mechanisms correctly verify user identities without relying on client-side flags.'
			},
			{
				id: 's3',
				text: 'Authorization checks — Users only reach what they should; watch missing permission checks and access-by-ID gaps.',
				submitterText: 'Your code includes proper authorization checks to ensure users can only access permitted resources.'
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
				text: 'Requirement implementation — Behaviour matches the task; required features exist and nothing central is missing or wrong.',
				submitterText: 'Your code fully implements all required features and matches the specified behavior.'
			},
			{
				id: 'cr2',
				text: 'Edge case handling — Unusual inputs (empty, zero, large, null, boundaries) do not break important flows.',
				submitterText: 'Your code handles edge cases like empty, zero, large, null, and boundary inputs without breaking.'
			},
			{
				id: 'cr3',
				text: 'Input validation — External inputs are checked for type, range, format, and missing values where it matters.',
				submitterText: 'Your code validates external inputs for type, range, format, and completeness.'
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
				text: 'Algorithm complexity — How work grows with input size; avoid accidental heavy nested scans where indexes or maps fit.',
				submitterText: 'Your algorithms are efficient, avoiding unnecessary complexity as input size grows.'
			},
			{
				id: 'p2',
				text: 'Database query efficiency — Watch N+1 patterns, over-fetching, and many tiny queries where one batch would do.',
				submitterText: 'Your database queries are efficient, avoiding N+1 patterns and over-fetching.'
			},
			{
				id: 'p3',
				text: 'Memory efficiency — Avoid loading huge datasets into memory when pagination, streaming, or filtering is enough.',
				submitterText: 'Your code uses memory efficiently, avoiding unnecessary loading of large datasets.'
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
				text: 'Separation of concerns — Business logic, UI, data access, and infrastructure are not mixed in one place.',
				submitterText: 'Your code separates concerns properly, keeping business logic, UI, data access, and infrastructure distinct.'
			},
			{
				id: 'st2',
				text: 'Module organization — Folders and files group related concerns so the layout is predictable for newcomers.',
				submitterText: 'Your project is well-organized with modules and files grouped logically.'
			},
			{
				id: 'st3',
				text: 'Dependency management — Coupling, import fan-in, and circular dependencies stay under control.',
				submitterText: 'Your code manages dependencies well, controlling coupling and avoiding circular dependencies.'
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
