/**
 * Production entry: SvelteKit (`adapter-node` → `./build/handler.js`) + Socket.IO on one HTTP server.
 * Fly.io / Docker: `CMD ["node", "server.js"]`. Local: `npm run build && npm start`.
 */
import http from 'node:http';
import process from 'node:process';
import { handler } from './build/handler.js';
import { Server } from 'socket.io';
import { attachSocketIo } from './socket-setup.mjs';

const httpServer = http.createServer((req, res) => {
	handler(req, res, (err) => {
		if (err) {
			res.statusCode = 500;
			res.end('Internal Server Error');
		}
	});
});

const io = new Server(httpServer, {
	cors: { origin: true, credentials: true }
});
attachSocketIo(io);

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST ?? '0.0.0.0';

httpServer.listen(port, host, () => {
	console.log(`Listening on http://${host}:${port}`);
});

function shutdown() {
	httpServer.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
