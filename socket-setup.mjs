/** @type {import('socket.io').Server | null} */
let ioRef = null;

/** Vite loads `socket-setup.mjs` twice (plugin vs SvelteKit server bundle) — share the Server on `globalThis`. */
const GLOBAL_IO_KEY = '__koodSocketIoServer';

/** @returns {import('socket.io').Server | null} */
function getIo() {
	const shared = Reflect.get(globalThis, GLOBAL_IO_KEY);
	return ioRef ?? shared ?? null;
}

/**
 * @param {string} projectId
 * @param {string} event
 * @param {unknown} [payload]
 */
export function broadcastToProject(projectId, event, payload = {}) {
	const io = getIo();
	if (!io || typeof projectId !== 'string' || !projectId) {
		return;
	}
	const r = `project:${projectId}`;
	io.to(r).emit(event, payload);
}

/**
 * Notify a single signed-in user (e.g. reviewer before they join a project room).
 * @param {string} userId
 * @param {string} event
 * @param {unknown} [payload]
 */
export function broadcastToUser(userId, event, payload = {}) {
	const io = getIo();
	if (!io || typeof userId !== 'string' || !userId) {
		return;
	}
	const r = `user:${userId}`;
	io.to(r).emit(event, payload ?? {});
}

/**
 * Notify everyone who joined a logical role room (e.g. admins watching the dashboard).
 * @param {string} role
 * @param {string} event
 * @param {unknown} [payload]
 */
export function broadcastToRole(role, event, payload = {}) {
	const io = getIo();
	if (!io || typeof role !== 'string' || !role) {
		return;
	}
	const r = `role:${role}`;
	io.to(r).emit(event, payload ?? {});
}

/**
 * Shared Socket.IO wiring for Vite dev (configureServer) and production `server.js`.
 * @param {import('socket.io').Server} io
 */
export function attachSocketIo(io) {
	ioRef = io;
	Reflect.set(globalThis, GLOBAL_IO_KEY, io);
	io.on('connection', (socket) => {
		socket.emit('server:hello', { t: Date.now(), message: 'Socket connected' });
		socket.on('client:ping', () => {
			socket.emit('server:pong', { t: Date.now() });
		});
		socket.on('joinProject', (projectId) => {
			if (typeof projectId !== 'string' || !projectId) return;
			socket.join(`project:${projectId}`);
		});
		socket.on('leaveProject', (projectId) => {
			if (typeof projectId !== 'string' || !projectId) return;
			socket.leave(`project:${projectId}`);
		});
		socket.on('joinUser', (userId) => {
			if (typeof userId !== 'string' || !userId) return;
			socket.join(`user:${userId}`);
		});
		socket.on('joinRole', (role) => {
			if (typeof role !== 'string' || !role) return;
			socket.join(`role:${role}`);
		});
	});
}
