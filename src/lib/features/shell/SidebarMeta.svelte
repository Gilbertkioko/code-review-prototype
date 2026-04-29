<script lang="ts">
	import { getApp, getPersonaDisplayLabel } from '$lib/appState.svelte';
	import { MESSENGER_REPO } from '$lib/koodUi';

	const app = getApp();
	const janeLabel = $derived(getPersonaDisplayLabel('jane'));
	const joeLabel = $derived(getPersonaDisplayLabel('joe'));
	const reviewerPairHint = $derived(`${janeLabel} & ${joeLabel}`);
</script>

<div class="space-y-4">

	<div class="rounded-xl border border-kood-border bg-kood-surface p-3 text-xs">
		<p class="font-semibold uppercase tracking-wide text-kood-muted">Repository for this project</p>
		<a class="mt-1 block break-all text-kood-accent hover:underline" href={MESSENGER_REPO}>{MESSENGER_REPO}</a>
	</div>

	{#if app.projectStarted}
		<div class="rounded-xl border border-kood-border bg-kood-surface p-3 text-xs">
			<p class="font-semibold uppercase tracking-wide text-kood-muted">Reviewer assignment</p>
			<p class="mt-2 text-kood-muted">Beachside Racetrack — who has confirmed they will review.</p>
			<ul class="mt-2 space-y-1.5 text-sm">
				<li class="flex items-center justify-between gap-2">
					<span class="text-kood-text/90">You</span>
					<span
						class="rounded-md px-2 py-0.5 text-[11px] font-medium {app.reviewerAssignmentAccepted.jane
							? 'bg-kood-accent/20 text-kood-accent'
							: 'bg-kood-surface-raised text-kood-muted'}">{app.reviewerAssignmentAccepted.jane
							? 'Accepted'
							: 'Pending'}</span
					>
				</li>
				<li class="flex items-center justify-between gap-2">
					<span class="text-kood-text/90">{joeLabel}</span>
					<span
						class="rounded-md px-2 py-0.5 text-[11px] font-medium {app.reviewerAssignmentAccepted.joe
							? 'bg-kood-accent/20 text-kood-accent'
							: 'bg-kood-surface-raised text-kood-muted'}">{app.reviewerAssignmentAccepted.joe
							? 'Accepted'
							: 'Pending'}</span
					>
				</li>
			</ul>
			{#if app.reviewerAssignmentAccepted.jane && app.reviewerAssignmentAccepted.joe}
				<p class="mt-2 text-[11px] text-kood-accent/90">Both reviewers confirmed — good to proceed through testing.</p>
			{/if}
		</div>
	{/if}

	<div class="rounded-xl border border-kood-border bg-kood-surface p-3">
		<p class="text-xs font-semibold uppercase text-kood-muted">Reviews</p>
		<p class="mt-1 text-sm text-kood-muted">
			{app.submittedForReview ? `${reviewerPairHint} assigned.` : 'Submit task to see your reviewer(s).'}
		</p>
	</div>
</div>
