/** Lowercase trimmed email for storage and lookup. */
export function normalizeEmail(raw: string): string {
	return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
	if (email.length < 3 || email.length > 254) return false;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
