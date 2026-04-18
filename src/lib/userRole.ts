export const USER_ROLES = ['admin', 'submitter', 'reviewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles allowed when users self-register (admin is DB-only). */
export const SIGNUP_ROLES = ['submitter', 'reviewer'] as const;
export type SignUpRole = (typeof SIGNUP_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
	return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isSignUpRole(value: unknown): value is SignUpRole {
	return value === 'submitter' || value === 'reviewer';
}
