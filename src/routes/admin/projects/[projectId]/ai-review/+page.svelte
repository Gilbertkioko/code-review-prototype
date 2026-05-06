<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
import { verdictChipClass, verdictLabel } from '$lib/features/testing/testingUtils';

	let { data } = $props();

	const ai = $derived(data.aiReview);
	const completedAt = $derived(ai?.completedAt ? new Date(ai.completedAt).toLocaleString() : '—');
	const linkedAt = $derived(ai?.linkedAt ? new Date(ai.linkedAt).toLocaleString() : '—');
	const inProgress = $derived(ai?.status === 'queued' || ai?.status === 'running' || ai?.status === 'retrying');

	$effect(() => {
		if (!browser || !inProgress) return;
		const t = setInterval(() => {
			void invalidateAll();
		}, 7000);
		return () => clearInterval(t);
	});
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — AI review — Admin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 pb-12">
	<p class="text-xs text-kood-muted">
		<a href="/admin" class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
			>← Admin</a
		>
		<span class="mx-2 text-kood-border/60">/</span>
		<a
			href="/admin/projects/{data.project.id}"
			class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
			>{data.projectDisplayTitle}</a
		>
	</p>

	<header class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
		<h1 class="text-lg font-semibold text-kood-text">AI code review</h1>
		{#if !ai}
			<p class="mt-2 text-sm text-kood-muted">No AI review is linked to this project yet.</p>
		{:else}
			<div class="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Status</p>
					<p class="mt-1 font-semibold text-kood-text">{ai.status}</p>
					{#if ai.jobAttemptCount && ai.jobMaxAttempts}
						<p class="mt-1 text-[11px] text-kood-muted">Attempt {ai.jobAttemptCount}/{ai.jobMaxAttempts}</p>
					{/if}
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Model</p>
					<p class="mt-1 font-mono text-kood-text/95">{ai.model}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Prompt version</p>
					<p class="mt-1 font-mono text-kood-text/95">{ai.promptVersion}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Completed</p>
					<p class="mt-1 text-kood-text/95">{completedAt}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Linked to project</p>
					<p class="mt-1 text-kood-text/95">{linkedAt}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Cache reuse</p>
					<p class="mt-1 text-kood-text/95">{ai.reusedAcrossProjects ? 'Reused existing review' : 'Fresh review'}</p>
				</div>
			</div>
		{/if}
		{#if data.hasRepoUrl}
			<form
				method="post"
				action="?/reviewAgainFresh"
				class="mt-4"
				onsubmit={(e) => {
					if (
						!confirm(
							data.hasPreviousSuccessfulReview
								? 'A successful review already exists for this repository. Run a fresh review anyway?'
								: 'Run a fresh AI review now? This may call Anthropic if no cache is reusable.'
						)
					) {
						e.preventDefault();
					}
				}}
				use:enhance={() => async ({ update }) => {
					await update();
					await invalidateAll();
				}}
			>
				<input type="hidden" name="confirm" value="1" />
				<button
					type="submit"
					class="rounded-md border border-kood-border px-3 py-1.5 text-xs font-semibold text-kood-text hover:bg-kood-surface-raised"
				>
					Redo AI review (force fresh run)
				</button>
			</form>
		{/if}
	</header>

	{#if ai?.status === 'failed'}
		<section class="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-100">
			<p class="font-semibold">AI review failed</p>
			<p class="mt-2 whitespace-pre-wrap break-words">{ai.jobLastError ?? ai.error ?? 'Unknown error'}</p>
			{#if ai.rawResponse}
				<details class="mt-3 rounded-md border border-red-300/30 bg-black/10 p-2">
					<summary class="cursor-pointer text-xs font-semibold">Show full Claude response</summary>
					<pre class="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed">{ai.rawResponse}</pre>
				</details>
			{/if}

			<form
				method="post"
				action="?/retryAiReview"
				class="mt-3"
				use:enhance={() => async ({ update }) => {
					await update();
					await invalidateAll();
				}}
			>
				<button
					type="submit"
					class="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/20"
				>
					Retry AI review
				</button>
			</form>
		</section>
	{/if}

	{#if ai?.result}
		<section class="space-y-4">
			<details class="overflow-hidden rounded-xl border border-kood-border bg-kood-surface/80" open>
				<summary class="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wide text-kood-muted">
					Overall summary
				</summary>
				<div class="border-t border-kood-border px-5 py-4 md:px-6">
					<p class="whitespace-pre-wrap text-sm leading-relaxed text-kood-text/95">{ai.result.overall_summary}</p>
				</div>
			</details>

			<details class="overflow-hidden rounded-xl border border-kood-border bg-kood-surface/80" open>
				<summary class="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wide text-kood-muted">
					Functional testing responses ({ai.result.functional_testing.length})
				</summary>
				<div class="space-y-3 border-t border-kood-border px-5 py-4 md:px-6">
					{#each ai.result.functional_testing as row (row.question_id)}
						<div class="rounded-lg border border-kood-border/60 bg-kood-bg/25 p-3">
							<div class="flex flex-wrap items-center gap-2">
								<p class="text-xs text-kood-muted">{row.question_id}</p>
								<span class="rounded px-2 py-0.5 text-[11px] font-medium ring-1 {verdictChipClass(row.verdict)}">
									{verdictLabel(row.verdict)}
								</span>
							</div>
							<p class="mt-1 text-sm font-medium text-kood-text">{row.question}</p>
							<p class="mt-2 whitespace-pre-wrap text-sm text-kood-text/90">{row.evidence}</p>
						</div>
					{/each}
				</div>
			</details>

			<details class="overflow-hidden rounded-xl border border-kood-border bg-kood-surface/80" open>
				<summary class="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wide text-kood-muted">
					Code review findings ({ai.result.code_review.length})
				</summary>
				<div class="space-y-3 border-t border-kood-border px-5 py-4 md:px-6">
					{#each ai.result.code_review as row (row.question_id)}
						<div class="rounded-lg border border-kood-border/60 bg-kood-bg/25 p-3">
							<div class="flex flex-wrap items-center gap-2 text-xs text-kood-muted">
								<span>{row.question_id}</span>
								<span class="rounded px-2 py-0.5 text-[11px] font-medium ring-1 {verdictChipClass(row.verdict)}">
									{verdictLabel(row.verdict)}
								</span>
								<span class="rounded px-2 py-0.5 ring-1 ring-kood-border/80">Severity {row.severity}</span>
							</div>
							<p class="mt-1 text-sm font-medium text-kood-text">{row.question}</p>
							<p class="mt-2 text-sm text-kood-text/90"><strong>Finding:</strong> {row.finding}</p>
							<p class="mt-1 whitespace-pre-wrap text-sm text-kood-text/90"><strong>Evidence:</strong> {row.evidence}</p>
							<p class="mt-1 whitespace-pre-wrap text-sm text-kood-text/90"><strong>Recommendation:</strong> {row.recommendation}</p>
						</div>
					{/each}
				</div>
			</details>

			<details class="overflow-hidden rounded-xl border border-kood-border bg-kood-surface/80">
				<summary class="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wide text-kood-muted">
					Key risks and action items
				</summary>
				<div class="grid gap-4 border-t border-kood-border px-5 py-4 md:px-6 lg:grid-cols-2">
					<div class="rounded-lg border border-kood-border/60 bg-kood-bg/25 p-4">
						<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Key risks</h2>
						<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-kood-text/95">
							{#each ai.result.key_risks as risk, i (`risk-${i}`)}
								<li>{risk}</li>
							{/each}
						</ul>
					</div>
					<div class="rounded-lg border border-kood-border/60 bg-kood-bg/25 p-4">
						<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Action items</h2>
						<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-kood-text/95">
							{#each ai.result.action_items as item, i (`action-${i}`)}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				</div>
			</details>
		</section>
	{/if}
</div>
