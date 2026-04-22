import { createClient, type Client } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fetch as undiciFetch } from 'undici';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

/** Hrana calls `fetch(request)` with a `cross-fetch` Request; Undici needs `fetch(url, init)`. */
function fetchForLibsql(input: unknown, init?: RequestInit): Promise<Response> {
	if (
		init === undefined &&
		typeof input === 'object' &&
		input !== null &&
		typeof (input as { url?: unknown }).url === 'string'
	) {
		const r = input as Request;
		const next: RequestInit = {
			method: r.method,
			headers: copyHeadersForUndici(r.headers),
			body: r.body
		};
		const sig = (r as { signal?: AbortSignal }).signal;
		if (sig) next.signal = sig;
		if (next.body !== undefined && next.body !== null && isReadableStream(next.body)) {
			(next as { duplex?: 'half' }).duplex = 'half';
		}
		return undiciFetch(r.url, next as never) as unknown as Promise<Response>;
	}
	return undiciFetch(input as never, init as never) as unknown as Promise<Response>;
}

function isReadableStream(x: unknown): boolean {
	return typeof ReadableStream !== 'undefined' && x instanceof ReadableStream;
}

function copyHeadersForUndici(src: Headers): Headers {
	const dst = new Headers();
	src.forEach((value, key) => {
		dst.append(key, value);
	});
	return dst;
}

export type AppDatabase = LibSQLDatabase<typeof schema>;

type LibsqlGlobal = typeof globalThis & {
	__koodLibsql?: { key: string; client: Client; db: AppDatabase };
	__koodBuildLibsql?: { client: Client; db: AppDatabase };
};

function resolveDatabaseUrl(): string {
	const raw = (env.TURSO_DATABASE_URL ?? env.DATABASE_URL ?? 'file:./data/local.db').trim();
	if (!raw) return 'file:./data/local.db';
	if (raw.startsWith('file:') || /^\w+:\/\//.test(raw)) return raw;
	return `file:${raw}`;
}

function ensureFileDatabaseDirectory(url: string) {
	if (!url.startsWith('file:')) return;
	const pathPart = url.slice('file:'.length);
	if (pathPart.startsWith(':memory:') || pathPart.includes('mode=memory')) return;
	const diskPath = pathPart.split('?')[0];
	if (!diskPath) return;
	const abs = isAbsolute(diskPath) ? diskPath : resolve(process.cwd(), diskPath);
	mkdirSync(dirname(abs), { recursive: true });
}

function connectionKey(url: string): string {
	const token = env.TURSO_AUTH_TOKEN ?? '';
	return `${url}\0${token}`;
}

function usesRemoteLibsql(url: string): boolean {
	const u = url.toLowerCase();
	return (
		u.startsWith('libsql:') ||
		u.startsWith('http:') ||
		u.startsWith('https:') ||
		u.startsWith('ws:') ||
		u.startsWith('wss:')
	);
}

function createLibsqlClient(url: string): Client {
	ensureFileDatabaseDirectory(url);
	return createClient({
		url,
		authToken: env.TURSO_AUTH_TOKEN || undefined,
		...(usesRemoteLibsql(url) ? { fetch: fetchForLibsql as Function } : {})
	});
}

/** In-memory libsql used during `vite build` / prerender analysis so module-scope `getDb()` does not touch disk or env. */
function getBuildPlaceholderDb(): AppDatabase {
	const g = globalThis as LibsqlGlobal;
	if (g.__koodBuildLibsql) return g.__koodBuildLibsql.db;
	const client = createClient({ url: 'file::memory:?cache=shared' });
	const db = drizzle(client, { schema });
	g.__koodBuildLibsql = { client, db };
	return db;
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

export function getDb(): AppDatabase {
	if (building) {
		return getBuildPlaceholderDb();
	}
	const url = resolveDatabaseUrl();
	const key = connectionKey(url);
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
	if (building) {
		return Promise.resolve();
	}
	if (!initOnce) {
		initOnce = (async () => {
			const url = resolveDatabaseUrl();
			const db = getDb();
			const rows = await db.all(
				sql`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user' LIMIT 1`
			);
			if (!rows.length) {
				const hint = url.startsWith('file:/data/')
					? ' On Fly.io with a mounted volume, open a shell on the machine and run: `cd /app && DATABASE_URL=/data/app.db npx drizzle-kit push` (release VMs do not see your volume).'
					: '';
				throw new Error(
					`[db] Database has no tables yet. Run \`npm run db:push\` for this DATABASE_URL (local file or Turso), then restart.${hint}`
				);
			}
		})();
	}
	return initOnce;
}
