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
<<<<<<< ft/ui-polish
			'Repository contains complete source code and configuration files.',
			'Your repository contains complete source code and configuration files.',
			'jane'
=======
			'The root README describes how to launch the project and includes a user guide for the core interfaces.',
			'The root README describes how to launch the project and includes a user guide for the core interfaces.'
>>>>>>> main
		),
		row(
			'm2',
			'mandatory',
<<<<<<< ft/ui-polish
			'Documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.',
			'Your documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.',
			'jane'
=======
			'The receptionist can add and remove upcoming race sessions, manage drivers, and prevent duplicate driver names.',
			'The receptionist can add and remove upcoming race sessions, manage drivers, and prevent duplicate driver names.'
>>>>>>> main
		),
		row(
			'm3',
			'mandatory',
<<<<<<< ft/ui-polish
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
=======
			'The Safety Official can start the race, change mode flags in real time, and the system uses Socket.IO for live updates instead of polling.',
			'The Safety Official can start the race, change mode flags in real time, and the system uses Socket.IO for live updates instead of polling.'
>>>>>>> main
		)
	];
	return withMandatoryOwners(raw);
}
