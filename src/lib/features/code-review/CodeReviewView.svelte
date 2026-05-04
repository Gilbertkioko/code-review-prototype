<script lang="ts">
	import { allCategoriesComplete, getPersonaDisplayLabel, trainingBlurbFor } from '$lib/appState.svelte';
	import CodeReview7Day from './CodeReview7Day.svelte';
	import CodeReviewSprintBoard from './CodeReviewSprintBoard.svelte';

	const sandraName = $derived(getPersonaDisplayLabel('sandra'));
</script>

<div class="space-y-6">


	<CodeReviewSprintBoard />

	{#if allCategoriesComplete()}
		<p class="text-sm text-kood-accent/90">
			All observations accepted. Open <strong class="text-kood-text">Standup (post-sprint)</strong> for meeting
			details, the discussion checklist, and takeaways.
		</p>
	{/if}

	<CodeReview7Day />

</div>
