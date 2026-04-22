import { createClient, type Client } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fetch as undiciFetch } from 'undici';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export type AppDatabase = LibSQLDatabase<typeof schema>;

type SqliteGlobal = typeof globalThis & {
	__koodSqlite?: { path: string; sqlite: Database.Database; db: DrizzleDb };
	__koodBuildDb?: DrizzleDb;
};

/** In-memory DB used only while SvelteKit runs static analysis (`vite build`); no migrations, no disk. */
function getBuildPlaceholderDb(): DrizzleDb {
	const g = globalThis as SqliteGlobal;
	if (g.__koodBuildDb) return g.__koodBuildDb;
	const sqlite = new Database(':memory:');
	sqlite.pragma('foreign_keys = ON');
	g.__koodBuildDb = drizzle(sqlite, { schema });
	return g.__koodBuildDb;
}

function databasePath(): string {
	return env.DATABASE_URL ?? './data/local.db';
}

/** Survives Vite SSR HMR so we do not open/close the client on every module reload. */
function getOrCreateFromGlobal(url: string): AppDatabase {
	const g = globalThis as LibsqlGlobal;
	const key = connectionKey(url);
	const prev = g.__koodLibsql;
	if (prev) {
		if (prev.key === key) return prev.db;
		try {
			prev.client.close();
		} catch {
			/* ignore */
		}
		g.__koodLibsql = undefined;
	}

	const client = createLibsqlClient(url);
	const db = drizzle(client, { schema });
	g.__koodLibsql = { key, client, db };
	return db;
}

let moduleClient: Client | undefined;
let moduleDb: AppDatabase | undefined;
let moduleKey: string | undefined;

export function getDb() {
	if (building) {
		return getBuildPlaceholderDb();
	}
	const url = databasePath();
	const useGlobalCache = process.env.NODE_ENV !== 'production';
	if (useGlobalCache) {
		return getOrCreateFromGlobal(url);
	}
	if (moduleDb && moduleKey === key) return moduleDb;
	if (moduleClient) {
		try {
			moduleClient.close();
		} catch {
			/* ignore */
		}
		moduleClient = undefined;
		moduleDb = undefined;
	}
	moduleKey = key;
	moduleClient = createLibsqlClient(url);
	moduleDb = drizzle(moduleClient, { schema });
	return moduleDb;
}

let initOnce: Promise<void> | undefined;

/** Run once per process before handling requests (schema must exist). */
export function initDatabase(): Promise<void> {
	if (!initOnce) {
		initOnce = (async () => {
			const db = getDb();
			const rows = await db.all(
				sql`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user' LIMIT 1`
			);
			if (!rows.length) {
				throw new Error(
					'[db] Database has no tables yet. Apply the schema with `npm run db:push` (Turso) or reset a local file DB, set env, then start again.'
				);
			}
		})();
	}
	return initOnce;
}
