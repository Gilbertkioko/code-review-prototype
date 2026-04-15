import { lucia } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const usernameRaw = formData.get('username');
		const password = formData.get('password');

		if (
			typeof usernameRaw !== 'string' ||
			usernameRaw.length < 3 ||
			usernameRaw.length > 31 ||
			!/^[a-z0-9_-]+$/.test(usernameRaw)
		) {
			return fail(400, { message: 'Invalid username' });
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, { message: 'Invalid password' });
		}

		const username = usernameRaw.toLowerCase();
		const db = getDb();
		const rows = db.select().from(user).where(eq(user.username, username)).limit(1).all();
		const existingUser = rows[0];
		if (!existingUser) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const validPassword = await verify(existingUser.password_hash, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(302, '/');
	}
};
