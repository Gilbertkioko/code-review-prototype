/**
 * One-off / maintenance: delete a project row and dependent data by URL substring match.
 * Usage: node scripts/delete-project-by-pattern.mjs racetrack
 * Loads .env / .env.local like other scripts (DATABASE_URL, TURSO_*).
 */
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';

const root = process.cwd();
for (const name of ['.env', '.env.local']) {
	const p = resolve(root, name);
	if (existsSync(p)) config({ path: p, override: name === '.env.local' });
}

const pattern = (process.argv[2] ?? '').trim();
if (!pattern) {
	console.error('Usage: node scripts/delete-project-by-pattern.mjs <url-substring>');
	process.exit(1);
}

function resolveKitUrl() {
	const raw = (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? '').trim();
	if (!raw) {
		console.error('Set TURSO_DATABASE_URL or DATABASE_URL in .env');
		process.exit(1);
	}
	if (raw.startsWith('file:') || /^\w+:\/\//.test(raw)) return raw;
	return `file:${raw}`;
}

const url = resolveKitUrl();
const client = createClient({
	url,
	authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined
});

const like = `%${pattern}%`;
const found = await client.execute({
	sql: `SELECT id, gitea_url, status FROM project WHERE gitea_url LIKE ? OR instructions LIKE ?`,
	args: [like, like]
});

if (!found.rows.length) {
	console.log('No project matched:', pattern);
	process.exit(0);
}

for (const row of found.rows) {
	console.log('Deleting project', row);
	const id = String(row.id);

	const stmts = [
		`DELETE FROM review_pair WHERE project_id = ?`,
		`DELETE FROM reviewer_checkin WHERE project_id = ?`,
		`DELETE FROM testing_thread_message WHERE project_id = ?`,
		`DELETE FROM testing_item_progress WHERE project_id = ?`,
		`DELETE FROM testing_verdict_event WHERE project_id = ?`,
		`DELETE FROM code_review_thread_message WHERE project_id = ?`,
		`DELETE FROM code_review_observation_progress WHERE project_id = ?`,
		`DELETE FROM code_review_verdict_event WHERE project_id = ?`,
		`DELETE FROM project_comment WHERE project_id = ?`,
		`DELETE FROM project WHERE id = ?`
	];
	for (const sql of stmts) {
		await client.execute({ sql, args: [id] });
	}
	console.log('Done:', id);
}

client.close();
process.exit(0);
