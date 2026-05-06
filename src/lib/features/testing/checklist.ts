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
			'Application runs successfully on a virtual or physical device with chosen platform (Android/iOS).',
			'Your application runs successfully on a virtual or physical device with your chosen platform (Android/iOS).',
			'jane'
		),
		row(
			'm4',
			'mandatory',
			'User can create an account with email, username and password.',
			'Your application allows users to create an account with email, username and password.',
			'joe'
		),
		row(
			'm5',
			'mandatory',
			'Registration is not allowed if email or username is already in use. User receives proper visual feedback.',
			'Your application prevents registration if email or username is already in use and provides proper visual feedback.',
			'joe'
		),
		row(
			'm6',
			'mandatory',
			'Application checks password strength: >=8 characters, lowercase, uppercase, digit, special character. Registration blocked if weak; user gets visual feedback.',
			'Your application checks password strength (>=8 characters, lowercase, uppercase, digit, special character), blocks weak passwords, and provides visual feedback.',
			'joe'
		)
	];
	return withMandatoryOwners(raw);
}
