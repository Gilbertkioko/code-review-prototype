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
		row('m1', 'mandatory', 'Repository contains complete source code and configuration files.', 'Your repository contains complete source code and configuration files.'),
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
		row('m4', 'mandatory', 'User can create an account with email, username and password.', 'Your application allows users to create an account with email, username and password.'),
		row(
			'm5',
			'mandatory',
			'Registration is not allowed if email or username is already in use. User receives proper visual feedback.',
			'Your application prevents registration if email or username is already in use and provides proper visual feedback.'
		),
		row(
			'm6',
			'mandatory',
			'Application checks password strength: ≥8 characters, lowercase, uppercase, digit, special character. Registration blocked if weak; user gets visual feedback.',
			'Your application checks password strength (≥8 characters, lowercase, uppercase, digit, special character), blocks weak passwords, and provides visual feedback.'
		),
		row('m7', 'mandatory', 'User receives verification email after creating an account.', 'Your application sends a verification email after account creation.'),
		row('m8', 'mandatory', 'User needs email and password to log in to the messenger.', 'Your application requires email and password for login to the messenger.'),
		row('m9', 'mandatory', 'User can reset their account password.', 'Your application allows users to reset their account password.'),
		row(
			'm10',
			'mandatory',
			'Authentication persistence unless explicit logout or session expiry — verify by closing and reopening the app; user stays logged in.',
			'Your application maintains authentication persistence unless explicitly logged out or session expires, keeping users logged in after closing and reopening.'
		),
		row(
			'm11',
			'mandatory',
			'User has a profile page with at least username, profile picture, and About Me sections.',
			'Your application provides a profile page with username, profile picture, and About Me sections.'
		),
		row('m12', 'mandatory', 'Default profile picture on first login; About Me empty initially.', 'Your application sets a default profile picture on first login and leaves About Me empty initially.'),
		row(
			'm13',
			'mandatory',
			'Profile picture upload supports at least JPEG and PNG (5MB limit per spec).',
			'Your application supports profile picture uploads in JPEG and PNG formats with a 5MB limit.'
		),
		row('m14', 'mandatory', 'User can edit any data in their profile.', 'Your application allows users to edit all data in their profile.'),
		row('m15', 'mandatory', 'User can search for contacts by username or by email.', 'Your application enables searching for contacts by username or email.'),
		row('m16', 'mandatory', 'User can send chat invitations to other users.', 'Your application allows users to send chat invitations to others.'),
		row(
			'm17',
			'mandatory',
			'User can accept or decline invitations; application has a pending invitation section.',
			'Your application lets users accept or decline invitations and includes a pending invitation section.'
		),
		row('m18', 'mandatory', 'Chat list sorted by time of last message received or sent.', 'Your application sorts the chat list by the time of the last message.'),
		row('m19', 'mandatory', 'User can archive and unarchive chats.', 'Your application allows users to archive and unarchive chats.'),
		row('m20', 'mandatory', 'Users can send text messages to each other.', 'Your application enables users to send text messages to each other.'),
		row('m21', 'mandatory', 'Users can send images to each other.', 'Your application enables users to send images to each other.'),
		row('m22', 'mandatory', 'Users can send videos to each other.', 'Your application enables users to send videos to each other.'),
		row(
			'm23',
			'mandatory',
			'Typing indicators show when either user is composing a message in real time.',
			'Your application displays typing indicators in real time when users are composing messages.'
		),
		row('m24', 'mandatory', 'Each message shows sent and delivered state.', 'Your application shows sent and delivered states for each message.'),
		row('m25', 'mandatory', 'On failed delivery, user receives clear visual feedback.', 'Your application provides clear visual feedback when message delivery fails.'),
		row('m26', 'mandatory', 'Each message shows whether it has been read by the recipient.', 'Your application indicates whether each message has been read by the recipient.'),
		row('m27', 'mandatory', 'User can edit and delete their own messages in the chat.', 'Your application allows users to edit and delete their own messages in chats.'),
		row('m28', 'mandatory', 'Data persists after restarting the application.', 'Your application persists data after restarting.'),
		row(
			'm29',
			'mandatory',
			'Messages, media, profile information, and chat list contents are encrypted before reaching the database.',
			'Your application encrypts messages, media, profile information, and chat list contents before storing in the database.'
		),
		row(
			'm30',
			'mandatory',
			'On errors/exceptions, messenger returns to last stable state when possible; user receives visual feedback about the error.',
			'Your application returns to a stable state on errors and provides visual feedback to users.'
		),
		row(
			'e1',
			'extra',
			'Code is properly organized with logical lib structure, consistent naming and formatting.',
			'Your code is properly organized with logical structure, consistent naming, and formatting.'
		),
		row(
			'e2',
			'extra',
			'All tabs share a common theme; interface is intuitive and user-friendly.',
			'Your application has a consistent theme across all tabs with an intuitive and user-friendly interface.'
		),
		row(
			'e3',
			'extra',
			'Easy launch without full Flutter setup: .apk provided with instructions for device, lightweight emulator, and browser-based emulator; backend starts with a single command (Docker allowed).',
			'Your application provides easy launch without full Flutter setup, including .apk, instructions for devices and emulators, and single-command backend start (Docker allowed).'
		),
		row('e4', 'extra', 'Application supports recording and sending audio messages in chat.', 'Your application supports recording and sending audio messages in chats.'),
		row(
			'e5',
			'extra',
			'Push notifications for new messages and invites; user can mute notifications per chat.',
			'Your application sends push notifications for new messages and invites, with per-chat mute options.'
		),
		row(
			'e6',
			'extra',
			'Application uses additional technologies/features beyond core requirements (bonus).',
			'Your application incorporates additional technologies and features beyond the core requirements.'
		)
	];
	return withMandatoryOwners(raw);
}
