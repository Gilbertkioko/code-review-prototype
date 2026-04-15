/**
 * Shared Socket.IO wiring for Vite dev (configureServer) and production `server.js`.
 * @param {import('socket.io').Server} io
 */
export function attachSocketIo(io) {
	io.on('connection', (socket) => {
		socket.emit('server:hello', { t: Date.now(), message: 'Socket connected' });
		socket.on('client:ping', () => {
			socket.emit('server:pong', { t: Date.now() });
		});
	});
}
