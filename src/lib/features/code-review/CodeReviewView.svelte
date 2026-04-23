<script lang="ts">
	import { allCategoriesComplete, getPersonaDisplayLabel, trainingBlurbFor } from '$lib/appState.svelte';
	import CodeReview7Day from './CodeReview7Day.svelte';
	import CodeReviewSprintBoard from './CodeReviewSprintBoard.svelte';

	const jName = $derived(getPersonaDisplayLabel('jane'));
	const oName = $derived(getPersonaDisplayLabel('joe'));
	const sandraName = $derived(getPersonaDisplayLabel('sandra'));
</script>

<div class="space-y-6">
	<header class="space-y-3">
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-accent">Code review</p>
		<h2 class="text-2xl font-semibold tracking-tight text-kood-text">The heart of quality feedback</h2>
		<p class="max-w-3xl text-sm leading-relaxed text-kood-muted">
			Code reviews help you spot different ways to solve problems, sharpen reflection, and raise coding quality.
			It is not about right or wrong — it is about leaning into a deep technical discussion.
		</p>
		<div class="flex flex-wrap gap-2 pt-1">
			<span class="rounded-full bg-kood-accent/15 px-2.5 py-0.5 text-xs font-semibold text-kood-accent">+10</span>
			<span class="rounded-full bg-kood-accent/15 px-2.5 py-0.5 text-xs font-semibold text-kood-accent">+10</span>
			<span class="text-xs text-kood-muted">Teamwork XP for active participation in the review call (mock).</span>
		</div>
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5 text-sm text-kood-muted">
		<h3 class="text-sm font-semibold text-kood-text">By participating, you will</h3>
		<ul class="mt-3 list-disc space-y-2 pl-5">
			<li>Refine your skills and reinforce good practices.</li>
			<li>Learn to communicate clearly about technical decisions.</li>
			<li>Keep standards high while collaborating with peers.</li>
		</ul>
	</section>

	<div class="rounded-lg border border-kood-border bg-kood-bg/50 px-4 py-3 text-xs text-kood-muted">
		<strong class="text-kood-text/90">Async sprint:</strong> The board below matches the Testing flow (Accept/Decline,
		threads, {jName} vs {oName} tabs). Scheduling the live call, the on-call discussion order, and takeaways live in
		<strong class="text-kood-text/90">Standup (post-sprint)</strong> once every listed observation is accepted.
	</div>

	<CodeReviewSprintBoard />

	{#if allCategoriesComplete()}
		<p class="text-sm text-kood-accent/90">
			All observations accepted. Open <strong class="text-kood-text">Standup (post-sprint)</strong> for meeting
			details, the discussion checklist, and takeaways.
		</p>
	{/if}

	<CodeReview7Day />

	<details class="rounded-xl border border-kood-border bg-kood-surface p-4 text-sm text-kood-muted">
		<summary class="cursor-pointer text-kood-text/90">
			Reviewer training hints (from {sandraName}'s future ratings)
		</summary>
		<p class="mt-2">{trainingBlurbFor('jane')}</p>
		<p class="mt-1">{trainingBlurbFor('joe')}</p>
	</details>
</div>
