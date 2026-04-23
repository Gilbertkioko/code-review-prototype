import { initDatabase } from '$lib/server/db';
import { sseSubscribe } from '$lib/server/sseHub';
import { error, type RequestHandler } from '@sveltejs/kit';

function sseBlock(event: string, data: Record<string, unknown>) {
	const payload = JSON.stringify(data);
	return `event: ${event}\ndata: ${payload}\n\n`;
}

/** Server-Sent Events for review/workspace invalidation (single-process deployments). */
export const GET: RequestHandler = async ({ locals, request, cookies }) => {
	await initDatabase();
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const u = locals.user;
	const channels = [`sse:user:${u.id}`];
	if (u.role === 'admin') {
		channels.push('sse:role:admin');
	}

	const stream = new ReadableStream({
		start(controller) {
			const enc = new TextEncoder();
			const write = (event: string, data: Record<string, unknown>) => {
				try {
					controller.enqueue(enc.encode(sseBlock(event, data)));
				} catch {
					/* stream may be closed */
				}
			};

			write('ready', { channels: channels.length });

			const unsub = sseSubscribe(channels, (sseEvent, data) => {
				write(sseEvent, data);
			});

			const ping = setInterval(() => {
				try {
					controller.enqueue(enc.encode(': ping\n\n'));
				} catch {
					clearInterval(ping);
				}
			}, 25_000);

			const close = () => {
				clearInterval(ping);
				unsub();
				try {
					controller.close();
				} catch {
					/* already closed */
				}
			};

			request.signal.addEventListener('abort', close);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
