import type { TestingItem } from '$lib/types';

function row(
	id: string,
	section: 'mandatory' | 'extra',
	text: string,
	submitterText: string,
	mandatoryOwner?: 'jane' | 'joe'
): TestingItem {
	return {
		id,
		section,
		text,
		submitterText,
		mandatoryOwner: section === 'mandatory' ? mandatoryOwner : undefined,
		jane: 'pending',
		joe: 'pending',
		verdictHistory: [],
		comments: [],
		drafts: {}
	};
}

/**
 * Splits mandatory rows between reviewers in array order: first half → Jane, remainder → Joe.
 */
export function withMandatoryOwners(items: TestingItem[]): TestingItem[] {
	const mandatoryCount = items.filter((t) => t.section === 'mandatory').length;
	const janeCount = Math.ceil(mandatoryCount / 2);
	let mi = 0;
	return items.map((t) => {
		if (t.section !== 'mandatory') return t;
		const owner: 'jane' | 'joe' = mi < janeCount ? 'jane' : 'joe';
		mi += 1;
		return { ...t, mandatoryOwner: owner };
	});
}

/** Trimmed checklist: 2 mandatory rows per reviewer. */
export function createFullTestingItems(): TestingItem[] {
	const raw = [
		row(
			'm1',
			'mandatory',
			'The root README describes how to launch the project and includes a user guide for the core interfaces.',
			'The root README describes how to launch the project and includes a user guide for the core interfaces.'
		),
		row(
			'm2',
			'mandatory',
			'The receptionist can add and remove upcoming race sessions, manage drivers, and prevent duplicate driver names.',
			'The receptionist can add and remove upcoming race sessions, manage drivers, and prevent duplicate driver names.'
		),
		row(
			'm3',
			'mandatory',
			'The Next Race display shows the correct upcoming session, driver names, and assigned car numbers, and updates when a race is started.',
			'The Next Race display shows the correct upcoming session, driver names, and assigned car numbers, and updates when a race is started.'
		),
		row(
			'm4',
			'mandatory',
			'The Safety Official can start the race, change mode flags in real time, and the system uses Socket.IO for live updates instead of polling.',
			'The Safety Official can start the race, change mode flags in real time, and the system uses Socket.IO for live updates instead of polling.'
		)
	];
	return withMandatoryOwners(raw);
}
