<script lang="ts">
	import { getPersonaDisplayLabel } from '$lib/appState.svelte';

	type SubmitterWorkspace = {
		kind: 'submitter';
		project: { status: string };
		reviewRoom?: { reviewerAUsername: string; reviewerBUsername: string } | null;
		reviewerCheckin?: { jane: boolean; joe: boolean };
	};

	let { workspace }: { workspace: SubmitterWorkspace | { kind: string } } = $props();

	const submitter = $derived(workspace.kind === 'submitter' ? (workspace as SubmitterWorkspace) : null);
	const status = $derived(submitter?.project.status ?? '');
	const reviewerAName = $derived(submitter?.reviewRoom?.reviewerAUsername ?? getPersonaDisplayLabel('jane'));
	const reviewerBName = $derived(submitter?.reviewRoom?.reviewerBUsername ?? getPersonaDisplayLabel('joe'));
	const reviewerAAccepted = $derived(Boolean(submitter?.reviewerCheckin?.jane));
	const reviewerBAccepted = $derived(Boolean(submitter?.reviewerCheckin?.joe));
	const acceptedCount = $derived(Number(reviewerAAccepted) + Number(reviewerBAccepted));
</script>

<div class="max-w-xl space-y-4">
	<h2 class="text-xl font-semibold text-kood-text">Project completion · Mobile Messenger</h2>

	{#if !submitter}
		<p class="text-sm text-kood-muted">This step is for the submitter account.</p>
	{:else if status === 'awaiting_link'}
		<p class="text-sm text-kood-muted">
			Finish the Flutter messenger per the brief, then add your Gitea repository URL in
			<strong class="text-kood-text/90">Your project batch</strong> at the top of the page. The next phase opens
			only after that link is saved and reviewers have been assigned.
		</p>
	{:else if status === 'repo_submitted'}
		<p class="text-sm text-kood-muted">
			Your repository link has been received. Please wait while an administrator assigns reviewers to your project.
			The testing phase will appear here automatically when reviewers are paired and the review begins.
		</p>
	{:else if status === 'review_active'}
		<div class="space-y-4 rounded-xl border border-kood-border/60 bg-kood-surface/70 p-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<p class="text-sm text-kood-text/90">Reviewer check-in status</p>
				<span class="rounded-full border border-kood-border/70 bg-kood-bg/40 px-2.5 py-1 text-[11px] font-medium text-kood-muted">
					{acceptedCount}/2 accepted
				</span>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between rounded-lg border border-kood-border/50 bg-kood-bg/30 px-3 py-2">
					<span class="text-sm text-kood-text/95">{reviewerAName}</span>
					<span
						class={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
							reviewerAAccepted
								? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
								: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30'
						}`}
					>
						{reviewerAAccepted ? 'Accepted' : 'Pending'}
					</span>
				</div>

				<div class="flex items-center justify-between rounded-lg border border-kood-border/50 bg-kood-bg/30 px-3 py-2">
					<span class="text-sm text-kood-text/95">{reviewerBName}</span>
					<span
						class={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
							reviewerBAccepted
								? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
								: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30'
						}`}
					>
						{reviewerBAccepted ? 'Accepted' : 'Pending'}
					</span>
				</div>
			</div>

			<p class="text-xs text-kood-muted">
				Testing starts automatically once both reviewers confirm assignment.
			</p>
		</div>
	{:else if status === 'completed'}
		<p class="text-sm text-kood-muted">Project review is completed.</p>
	{:else}
		<p class="text-sm text-kood-muted">Please wait…</p>
	{/if}
</div>
