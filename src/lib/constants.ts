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
			'The system should protect race operations data, enforce access control, and prevent incorrect commands from reaching the track screens.',
		observations: [
			{
				id: 's1',
				text: 'Input validation — Verify that race session and driver inputs are validated before being accepted by the server.',
				submitterText: 'Your project validates race session and driver inputs before processing them.'
			},
			{
				id: 's2',
				text: 'Access control — Verify that the Front Desk, Race Control, and Lap-line Tracker require valid access keys before connecting.',
				submitterText: 'Your project requires valid access keys for protected employee interfaces.'
			},
			{
				id: 's3',
				text: 'Mode integrity — Verify that unauthorized clients cannot change race mode or inject flag state updates.',
				submitterText: 'Your system prevents unauthorized clients from changing race mode or flag status.'
			},
			{
				id: 's4',
				text: 'Secret management — Verify that access keys and sensitive settings are not hardcoded in the frontend code or shown in logs.',
				submitterText: 'Your code keeps access keys and sensitive settings out of the frontend and logs.'
			},
			{
				id: 's5',
				text: 'Socket security — Verify that Socket.IO events are only used for real-time updates and not abused for data leakage.',
				submitterText: 'Your Socket.IO implementation only sends legitimate real-time updates and avoids exposing extra data.'
			}
		]
	},
	{
		id: 'correctness',
		title: 'Correctness',
		assignee: 'jane',
		academyHint: 'cat-correctness',
		assignmentBlurb:
			'Does the system behave correctly for races, driver assignments, session transitions, and leaderboard updates?',
		observations: [
			{
				id: 'cr1',
				text: 'Session workflow — Verify the receptionist can create, delete, and update upcoming race sessions correctly.',
				submitterText: 'Your code allows the receptionist to create, delete, and update upcoming race sessions correctly.'
			},
			{
				id: 'cr2',
				text: 'Driver management — Verify driver names are unique within a session and can be added, edited, and removed before the race starts.',
				submitterText: 'Your code enforces unique driver names in a session and supports driver management before the race starts.'
			},
			{
				id: 'cr3',
				text: 'Next Race display — Verify the Next Race screen shows the upcoming session, assigned car numbers, and updates when the current race begins.',
				submitterText: 'Your Next Race screen shows the upcoming session, assigned cars, and moves forward when the race starts.'
			},
			{
				id: 'cr4',
				text: 'Lap tracking — Verify lap button presses update the lap counts and fastest lap times for the corresponding cars.',
				submitterText: 'Your lap tracking updates the correct lap counts and fastest lap times when buttons are pressed.'
			},
			{
				id: 'cr5',
				text: 'Race lifecycle — Verify the race transitions to Safe, Hazard, Danger, and Finish correctly, and Finish locks the session state.',
				submitterText: 'Your race lifecycle transitions correctly and locks the session once the race is finished.'
			}
		]
	},
	{
		id: 'performance',
		title: 'Performance',
		assignee: 'joe',
		academyHint: 'cat-performance',
		assignmentBlurb:
			'Is the real-time system responsive enough for live race updates, timer countdowns, and lap-line tracking?',
		observations: [
			{
				id: 'p1',
				text: 'Real-time responsiveness — Verify that race mode changes and lap updates appear quickly on spectator and driver displays.',
				submitterText: 'Your system updates displays quickly when race mode or lap data changes.'
			},
			{
				id: 'p2',
				text: 'Timer efficiency — Verify the countdown runs at 1 minute in dev mode and 10 minutes in production mode.',
				submitterText: 'Your countdown timer runs at 1 minute in dev mode and 10 minutes in production mode.'
			},
			{
				id: 'p3',
				text: 'Lap-line tracker UX — Verify the lap buttons stay large, responsive, and easy to press on tablet layouts.',
				submitterText: 'Your lap-line tracker UI remains large and responsive across tablet layouts.'
			},
			{
				id: 'p4',
				text: 'Socket traffic — Verify the app does not use polling and only sends real-time events over Socket.IO for state changes.',
				submitterText: 'Your app uses Socket.IO for real-time state changes and does not rely on polling.'
			},
			{
				id: 'p5',
				text: 'State updates — Verify that updates do not duplicate or overwrite unrelated race data when multiple interfaces are active.',
				submitterText: 'Your state updates preserve unrelated race data when multiple interfaces are active.'
			}
		]
	},
	{
		id: 'structure_architecture',
		title: 'Structure & architecture',
		assignee: 'joe',
		academyHint: 'cat-structure',
		assignmentBlurb:
			'Is the codebase organized so the real-time race system stays understandable, maintainable, and easy to extend?',
		observations: [
			{
				id: 'st1',
				text: 'Separation of concerns — Verify that UI components do not contain server-side race control logic.',
				submitterText: 'Your UI components do not contain server-side race control logic.'
			},
			{
				id: 'st2',
				text: 'Module organization — Verify that related features are grouped logically by interface and race flow.',
				submitterText: 'Your project groups related race features logically by interface and flow.'
			},
			{
				id: 'st3',
				text: 'Dependency direction — Verify that core services and Socket.IO logic do not depend on UI components.',
				submitterText: 'Your services and real-time logic do not depend on UI components.'
			},
			{
				id: 'st4',
				text: 'Route structure — Verify that each interface is available at its own top-level route.',
				submitterText: 'Your interfaces are all accessible at top-level routes.'
			},
			{
				id: 'st5',
				text: 'Component cohesion — Verify that each interface handles a single persona and avoids mixing unrelated concerns.',
				submitterText: 'Your interfaces are cohesive and focused on a single persona.'
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
