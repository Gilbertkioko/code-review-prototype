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
 * Normalizes mandatory owners from raw payloads and preserves explicit owner assignment.
 */
export function withMandatoryOwners(items: TestingItem[]): TestingItem[] {
	return items.map((t) => {
		if (t.section !== 'mandatory') return { ...t, mandatoryOwner: undefined };
		const owner = t.mandatoryOwner === 'joe' ? 'joe' : 'jane';
		return { ...t, mandatoryOwner: owner };
	});
}

/** Trimmed checklist: 3 mandatory rows total. */
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
			'The Safety Official can start the race, change mode flags in real time, and the system uses Socket.IO for live updates instead of polling.',
			'The Safety Official can start the race, change mode flags in real time, and the system uses Socket.IO for live updates instead of polling.'
		)
	];
	return withMandatoryOwners(raw);
}
