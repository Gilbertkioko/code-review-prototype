import { config } from 'dotenv';
import { createClient } from '@libsql/client';

config({ path: '.env' });
config({ path: '.env.local', override: true });

const raw = (process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./data/local.db').trim();
const url = raw.startsWith('file:') || /^\w+:\/\//.test(raw) ? raw : `file:${raw}`;

const client = createClient({
	url,
	authToken: process.env.TURSO_AUTH_TOKEN
});

await client.execute(`
CREATE TABLE IF NOT EXISTS reviewer_checkin (
	project_id text NOT NULL,
	reviewer_user_id text NOT NULL,
	persona text NOT NULL,
	accepted_at integer NOT NULL,
	updated_at integer NOT NULL,
	PRIMARY KEY(project_id, reviewer_user_id),
	FOREIGN KEY (project_id) REFERENCES project(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (reviewer_user_id) REFERENCES user(id) ON UPDATE no action ON DELETE no action
);
`);

await client.execute(`
CREATE TABLE IF NOT EXISTS testing_verdict_event (
	id text PRIMARY KEY NOT NULL,
	project_id text NOT NULL,
	item_id text NOT NULL,
	persona text NOT NULL,
	verdict text NOT NULL,
	testing_round integer NOT NULL,
	changed_at integer NOT NULL,
	changed_by_user_id text,
	FOREIGN KEY (project_id) REFERENCES project(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (changed_by_user_id) REFERENCES user(id) ON UPDATE no action ON DELETE no action
);
`);

await client.execute(`
CREATE TABLE IF NOT EXISTS code_review_verdict_event (
	id text PRIMARY KEY NOT NULL,
	project_id text NOT NULL,
	category_id text NOT NULL,
	observation_id text NOT NULL,
	persona text NOT NULL,
	verdict text NOT NULL,
	code_review_round integer NOT NULL,
	changed_at integer NOT NULL,
	changed_by_user_id text,
	FOREIGN KEY (project_id) REFERENCES project(id) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (changed_by_user_id) REFERENCES user(id) ON UPDATE no action ON DELETE no action
);
`);

const rows = await client.execute(`
SELECT name
FROM sqlite_master
WHERE type='table'
  AND name IN ('reviewer_checkin', 'testing_verdict_event', 'code_review_verdict_event')
ORDER BY name;
`);

console.log('Created/verified tables:', rows.rows.map((r) => r.name).join(', '));
client.close();
