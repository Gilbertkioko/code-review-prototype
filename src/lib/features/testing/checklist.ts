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

/** Trimmed checklist: 3 mandatory rows per reviewer. */
export function createFullTestingItems(): TestingItem[] {
	const raw = [
		row(
			'm1',
			'mandatory',
			'Repository contains complete source code and configuration files.',
			'Your repository contains complete source code and configuration files.',
			'jane'
		),
		row(
			'm2',
			'mandatory',
			'Documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.',
			'Your documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.',
			'jane'
		),
		row(
			'm3',
			'mandatory',
			'The receptionist can see a list of upcoming races',
			'The receptionist can see a list of upcoming races',
			'jane'
		),
		row(
			'm4',
			'mandatory',
			'Race sessions disappear from the front desk when the race starts',
			'Your code removes race sessions from the front desk when the race starts',
			'joe'
		),
		row(
			'm5',
			'mandatory',
			'The safety official has one active button, which starts the race when pressed',
			'The safety official has one active button, which starts the race when pressed',
			'joe'
		),
		row(
			'm6',
			'mandatory',
			'When the lap button is pressed for a car, the leaderboard updates with the correct lap count and fastest lap time',
			'When the lap button is pressed for a car, the leaderboard updates with the correct lap count and fastest lap time',
			'joe'
		)
	];
	return withMandatoryOwners(raw);
}
