import { writable } from 'svelte/store';

export const academyModalOpen = writable(false);
export const academyModalCategory = writable('security');