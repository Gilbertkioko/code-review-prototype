import { browser } from '$app/environment';
import { io, type Socket } from 'socket.io-client';

export function createAppSocket(): Socket | null {
	if (!browser) return null;
	return io({ path: '/socket.io', autoConnect: true });
}
