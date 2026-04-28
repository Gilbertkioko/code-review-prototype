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

/** Trimmed checklist: 3 mandatory rows per reviewer. */
export function createFullTestingItems(): TestingItem[] {
	const raw = [
		row(
			'm1',
			'mandatory',
			'Repository contains complete source code and configuration files.',
			'Your repository contains complete source code and configuration files.'
		),
		row(
			'm2',
			'mandatory',
			'Documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.',
			'Your documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.'
		),
		row(
			'm3',
			'mandatory',
			'Application runs successfully on a virtual or physical device with chosen platform (Android/iOS).',
			'Your application runs successfully on a virtual or physical device with your chosen platform (Android/iOS).'
		),
		row(
			'm4',
			'mandatory',
			'User can create an account with email, username and password.',
			'Your application allows users to create an account with email, username and password.'
		),
		row(
			'm5',
			'mandatory',
			'Registration is not allowed if email or username is already in use. User receives proper visual feedback.',
			'Your application prevents registration if email or username is already in use and provides proper visual feedback.'
		),
		row(
			'm6',
			'mandatory',
			'Application checks password strength: >=8 characters, lowercase, uppercase, digit, special character. Registration blocked if weak; user gets visual feedback.',
			'Your application checks password strength (>=8 characters, lowercase, uppercase, digit, special character), blocks weak passwords, and provides visual feedback.'
		)
	];
	return withMandatoryOwners(raw);
}
