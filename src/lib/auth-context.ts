import type { UserRole } from '$lib/userRole';

export const AUTH_SESSION = Symbol('auth:session');

export type SessionUser = { id: string; username: string; email: string; role: UserRole };
