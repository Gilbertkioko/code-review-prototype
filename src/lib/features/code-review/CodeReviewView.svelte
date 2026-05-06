<script lang="ts">
	import { allCategoriesComplete, getPersonaDisplayLabel, trainingBlurbFor } from '$lib/appState.svelte';
	import CodeReview7Day from './CodeReview7Day.svelte';
	import CodeReviewSprintBoard from './CodeReviewSprintBoard.svelte';

	const sandraName = $derived(getPersonaDisplayLabel('sandra'));
</script>

<div class="space-y-6">
	<header>
		<h2 class="text-2xl font-semibold text-kood-text">Code review</h2>
		<p class="mt-3 text-sm leading-relaxed text-kood-muted">
			Review the racetrack system for reliability, real-time behavior, route coverage, and role-specific interface flows.
			Focus on whether the frontend and backend work together to keep spectators, drivers, and staff informed at every stage.
		</p>
	</header>

	<CodeReviewSprintBoard />

	{#if allCategoriesComplete()}
		<p class="text-sm text-kood-accent/90">
			All observations accepted. Open <strong class="text-kood-text">Standup (post-sprint)</strong> for meeting
			details, the discussion checklist, and takeaways.
		</p>
	{/if}

	<CodeReview7Day />

</div>
