import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

type SqliteGlobal = typeof globalThis & {
	__koodSqlite?: { path: string; sqlite: Database.Database; db: DrizzleDb };
};

function databasePath(): string {
	return env.DATABASE_URL ?? './data/local.db';
}

/** Survives Vite SSR HMR so we do not open/close the native driver on every module reload. */
function getOrCreateFromGlobal(url: string): DrizzleDb {
	const g = globalThis as SqliteGlobal;
	const prev = g.__koodSqlite;
	if (prev) {
		if (prev.path === url) return prev.db;
		try {
			prev.sqlite.close();
		} catch {
			/* ignore */
		}
		g.__koodSqlite = undefined;
	}

	mkdirSync(dirname(url), { recursive: true });

	const sqlite = new Database(url);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');

	const db = drizzle(sqlite, { schema });

	const hasUserTable = sqlite
		.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user' LIMIT 1`)
		.get();
	if (!hasUserTable) {
		try {
			sqlite.close();
		} catch {
			/* ignore */
		}
		g.__koodSqlite = undefined;
		throw new Error(
			'[db] SQLite has no tables yet. Apply the schema with `npm run db:push` (or reset with `npm run db:nuke`), then start the app again.'
		);
	}

	g.__koodSqlite = { path: url, sqlite, db };
	return db;
}

let moduleDb: DrizzleDb | undefined;

export function getDb() {
	const url = databasePath();
	/** Avoid `$app/environment` here so this module stays safe for any server entry. */
	const useGlobalCache = process.env.NODE_ENV !== 'production';
	if (useGlobalCache) {
		return getOrCreateFromGlobal(url);
	}
	if (moduleDb) return moduleDb;

	mkdirSync(dirname(url), { recursive: true });
	const sqlite = new Database(url);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	moduleDb = drizzle(sqlite, { schema });
	const hasUserTable = sqlite
		.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user' LIMIT 1`)
		.get();
	if (!hasUserTable) {
		try {
			sqlite.close();
		} catch {
			/* ignore */
		}
		moduleDb = undefined;
		throw new Error(
			'[db] SQLite has no tables yet. Apply the schema with `npm run db:push` (or reset with `npm run db:nuke`), then start the app again.'
		);
	}
	return moduleDb;
}
