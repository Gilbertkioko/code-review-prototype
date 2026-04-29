<script lang="ts">
	import { getContext } from 'svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import { getApp } from '$lib/appState.svelte';

	const app = getApp();
	const auth = getContext<{ sessionUser: SessionUser | null }>(AUTH_SESSION);

	let descriptionOpen = $state(false);

	function goBack() {
		if (typeof window === 'undefined') return;
		if (window.history.length > 1) {
			window.history.back();
			return;
		}
		const fallback = auth.sessionUser?.role === 'reviewer' ? '/' : '/';
		window.location.href = fallback;
	}
</script>

<nav class="flex flex-col gap-1 text-sm">
	<button
		type="button"
		class="w-full rounded-lg px-2 py-2 text-left text-kood-muted transition hover:bg-kood-surface-raised/80 hover:text-kood-text"
		onclick={goBack}
	>
		← Back
	</button>
	<button
		type="button"
		class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-kood-muted transition hover:bg-kood-surface-raised/80 hover:text-kood-text"
		onclick={() => (descriptionOpen = true)}
	>
		<span class="text-kood-muted/80">ⓘ</span> Project description
	</button>
</nav>


<Modal open={descriptionOpen} title="Beachside Racetrack project description 🏁" maxWidth="max-w-xl">
	<p class="text-sm text-kood-muted">
		Beachside Racetrack is a polished review prototype built around a live race control flow. The submitter delivers the finished app, and reviewers verify that the race day experience works smoothly across session management, driver and car assignments, start/finish controls, and real-time track updates.
	</p>
	<p class="mt-3 text-sm text-kood-muted">
		Think of it as a track-side inspection: confirm the key features are safe, clear, and fast, then share focused feedback that helps the team cross the finish line with confidence.
	</p>
	<div class="mt-6 text-right">
		<button
			type="button"
			class="rounded-md bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-accent-foreground"
			onclick={() => (descriptionOpen = false)}
		>
			Close
		</button>
	</div>
</Modal>
