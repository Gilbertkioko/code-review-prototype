/** @type {import('socket.io').Server | null} */
let ioRef = null;

/**
 * @param {string} projectId
 * @param {string} event
 * @param {unknown} [payload]
 */
export function broadcastToProject(projectId, event, payload = {}) {
	if (!ioRef || typeof projectId !== 'string' || !projectId) return;
	ioRef.to(`project:${projectId}`).emit(event, payload);
}

/**
 * Shared Socket.IO wiring for Vite dev (configureServer) and production `server.js`.
 * @param {import('socket.io').Server} io
 */
export function attachSocketIo(io) {
	ioRef = io;
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
	});
}
