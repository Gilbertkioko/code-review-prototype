import type { TestingItem } from '$lib/types';

function row(
	id: string,
	section: 'mandatory' | 'extra',
	text: string,
	mandatoryOwner?: 'jane' | 'joe'
): TestingItem {
	return {
		id,
		section,
		text,
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
 * With 10 mandatory rows you get 5 + 5.
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

/** Full Mobile Messenger testing checklist: 5 mandatory rows per reviewer (10 total) + extra. */
export function createFullTestingItems(): TestingItem[] {
	const raw = [
		row('m1', 'mandatory', 'Repository contains complete source code and configuration files.'),
		row(
			'm2',
			'mandatory',
			'Documentation (README) includes all required sections: project overview, complete setup instructions, usage guide.'
		),
		row(
			'm3',
			'mandatory',
			'Application runs successfully on a virtual or physical device with chosen platform (Android/iOS).'
		),
		row('m4', 'mandatory', 'User can create an account with email, username and password.'),
		row(
			'm5',
			'mandatory',
			'Registration is not allowed if email or username is already in use. User receives proper visual feedback.'
		),
		row('m19', 'mandatory', 'User can archive and unarchive chats.'),
		row('m20', 'mandatory', 'Users can send text messages to each other.'),
		row('m21', 'mandatory', 'Users can send images to each other.'),
		row('m22', 'mandatory', 'Users can send videos to each other.'),
		row(
			'm23',
			'mandatory',
			'Typing indicators show when either user is composing a message in real time.'
		),
		row(
			'e1',
			'extra',
			'Code is properly organized with logical lib structure, consistent naming and formatting.'
		),
		row(
			'e2',
			'extra',
			'All tabs share a common theme; interface is intuitive and user-friendly.'
		),
		row(
			'e3',
			'extra',
			'Easy launch without full Flutter setup: .apk provided with instructions for device, lightweight emulator, and browser-based emulator; backend starts with a single command (Docker allowed).'
		),
		row('e4', 'extra', 'Application supports recording and sending audio messages in chat.'),
		row(
			'e5',
			'extra',
			'Push notifications for new messages and invites; user can mute notifications per chat.'
		),
		row(
			'e6',
			'extra',
			'Application uses additional technologies/features beyond core requirements (bonus).'
		)
	];
	return withMandatoryOwners(raw);
}
