import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

let sqlite: Database.Database | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;
let migrated = false;

function databasePath(): string {
	return env.DATABASE_URL ?? './data/local.db';
}

export function getDb() {
	if (db) return db;

	const url = databasePath();
	mkdirSync(dirname(url), { recursive: true });

	sqlite = new Database(url);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');

	db = drizzle(sqlite, { schema });

	if (!migrated) {
		const migrationsFolder = join(process.cwd(), 'drizzle');
		migrate(db, { migrationsFolder });
		migrated = true;
	}

	return db;
}
