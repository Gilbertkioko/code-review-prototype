import { Server } from 'socket.io';
import { attachSocketIo } from './socket-setup.mjs';

/** @returns {import('vite').Plugin} */
export function socketIoDevPlugin() {
	return {
		name: 'socket.io-dev',
		configureServer(server) {
			const httpServer = server.httpServer;
			if (!httpServer) return;

			const io = new Server(httpServer, {
				cors: { origin: true, credentials: true }
			});
			attachSocketIo(io);
		}
	};
}
