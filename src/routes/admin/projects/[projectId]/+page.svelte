<script lang="ts">
	import { CATEGORIES } from '$lib/constants';
	import type { ReviewerRatingSet } from '$lib/types';

	let { data } = $props();

	const started = $derived(
		data.project.createdAt ? new Date(data.project.createdAt).toLocaleString() : '—'
	);

	const standup = $derived(data.standupSnapshot);
	const fb = $derived(data.feedback360Snapshot);

	function personaRoomLabel(author: 'sandra' | 'jane' | 'joe'): string {
		if (author === 'sandra') return data.submitterName;
		if (author === 'jane') return data.reviewerAName;
		return data.reviewerBName;
	}

	const reviewer360Dims: { key: keyof ReviewerRatingSet; title: string }[] = [
		{ key: 'readableCode', title: 'Structure & architecture' },
		{ key: 'codeComments', title: 'Performance' },
		{ key: 'crossReviewer', title: 'Cross-reviewer awareness' }
	];

	const checklistTitles = [
		'Scheduled the ~45 min sync and shared time / voice channel with the team.',
		'Followed the structure: reviewer buckets → cross-review → submitter → shared actions.',
		'Captured takeaways below (what was discussed, key feedback, action items, reflections).',
		'Confirmed everyone had space to speak; notes are specific enough to use later.',
		'Agreed what “done” means for this review before moving to Accept project.'
	] as const;
</script>

<svelte:head>
	<title>Project {data.project.id.slice(0, 8)}… — Admin</title>
</svelte:head>

<PrototypePageShell variant="admin">
	<div class="mx-auto max-w-3xl space-y-8">
		<header class="rounded-xl border border-kood-accent/30 bg-kood-surface/80 p-5 lg:p-6">
			<p class="text-xs text-kood-muted">
				<a href="/admin" class="text-kood-accent underline">← Admin</a>
			</p>
			<h1 class="mt-4 font-mono text-xl font-semibold tracking-tight text-kood-text">Project audit</h1>
			<p class="mt-2 text-sm text-kood-muted">
				Status: <span class="text-kood-accent">{data.project.status}</span>
			</p>
			{#if data.project.giteaUrl}
				<p class="mt-2 break-all text-sm">
					<a class="text-kood-accent underline" href={data.project.giteaUrl} target="_blank" rel="noreferrer"
						>{data.project.giteaUrl}</a
					>
				</p>
			{/if}

			{#if data.pair}
				<p class="mt-4 text-sm text-kood-muted">
					Pair reviewers (IDs): <span class="font-mono text-xs text-kood-text">{data.pair.reviewerAId}</span> ·
					<span class="font-mono text-xs text-kood-text">{data.pair.reviewerBId}</span>
				</p>
			{/if}
		</header>

		{#if data.testingItemProgress.length > 0}
			<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Testing · verdict progress (SQL)</h2>
				<p class="mt-1 text-xs text-kood-muted">
					Latest accept/decline/pending per checklist row (same ids as the prototype).
				</p>
				<div class="mt-3 overflow-x-auto rounded-lg border border-kood-border bg-kood-bg/40">
					<table class="w-full min-w-[640px] border-collapse text-left text-xs">
						<thead>
							<tr class="border-b border-kood-border bg-kood-surface-raised/50 text-kood-muted">
								<th class="px-3 py-2">Item</th>
								<th class="px-3 py-2">Section</th>
								<th class="px-3 py-2">Owner</th>
								<th class="px-3 py-2">Reviewer 1</th>
								<th class="px-3 py-2">Reviewer 2</th>
								<th class="px-3 py-2">Round</th>
							</tr>
						</thead>
						<tbody>
							{#each data.testingItemProgress as row (row.itemId)}
								<tr class="border-b border-kood-border/50">
									<td class="px-3 py-2 font-mono text-[11px]">{row.itemId}</td>
									<td class="px-3 py-2">{row.section}</td>
									<td class="px-3 py-2">{row.mandatoryOwner ?? '—'}</td>
									<td class="px-3 py-2">{row.janeVerdict}</td>
									<td class="px-3 py-2">{row.joeVerdict}</td>
									<td class="px-3 py-2">{row.testingRound}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}

		{#if data.codeReviewObservationProgress.length > 0}
			<section class="rounded-xl border border-kood-border bg-kood-surface p-4 md:p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review · verdict progress (SQL)</h2>
				<p class="mt-1 text-xs text-kood-muted">Per observation row — matches the sprint board.</p>
				<div class="mt-3 overflow-x-auto rounded-lg border border-kood-border bg-kood-bg/40">
					<table class="w-full min-w-[560px] border-collapse text-left text-xs">
						<thead>
							<tr class="border-b border-kood-border bg-kood-surface-raised/50 text-kood-muted">
								<th class="px-3 py-2">Category</th>
								<th class="px-3 py-2">Observation</th>
								<th class="px-3 py-2">Reviewer 1</th>
								<th class="px-3 py-2">Reviewer 2</th>
								<th class="px-3 py-2">Round</th>
							</tr>
						</thead>
						<tbody>
							{#each data.codeReviewObservationProgress as row (`${row.categoryId}-${row.observationId}`)}
								<tr class="border-b border-kood-border/50">
									<td class="px-3 py-2">{row.categoryId}</td>
									<td class="px-3 py-2 font-mono text-[11px]">{row.observationId}</td>
									<td class="px-3 py-2">{row.janeVerdict}</td>
									<td class="px-3 py-2">{row.joeVerdict}</td>
									<td class="px-3 py-2">{row.codeReviewRound}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</dl>
			<div class="mt-4">
				<p class="text-xs font-medium text-kood-muted">Takeaways thread</p>
				{#if standup.standupTakeawayMessages.length > 0}
					<ul class="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-kood-border bg-kood-surface px-3 py-2 text-xs">
						{#each standup.standupTakeawayMessages as m (m.id)}
							<li class="rounded-md bg-kood-bg/50 px-2 py-1.5">
								<span class="font-medium text-kood-accent">{personaRoomLabel(m.author)}</span>
								<span class="text-kood-muted"> · {m.at || '—'}</span>
								<p class="mt-0.5 whitespace-pre-wrap text-kood-text/90">{m.text}</p>
							</li>
						{/each}
					</ul>
				{:else if standup.standupTakeaways.trim()}
					<pre
						class="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-kood-border bg-kood-surface px-3 py-2 text-xs text-kood-text/90"
					>{standup.standupTakeaways}</pre>
				{:else}
					<p class="mt-1 text-xs text-kood-muted">—</p>
				{/if}
			</div>
			<div class="mt-4">
				<p class="text-xs font-medium text-kood-muted">Submitter checklist</p>
				<ul class="mt-2 space-y-2 text-xs text-kood-text/90">
					{#each checklistTitles as title, i (i)}
						<li class="flex gap-2 rounded-md border border-kood-border/60 bg-kood-surface/50 px-2 py-1.5">
							<span class="shrink-0 text-kood-muted" aria-hidden="true">{standup.standupItems[i] ? '✓' : '·'}</span>
							<span>{title}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	{#if fb}
		<div class="mt-8 rounded-xl border border-kood-border/80 bg-kood-bg/30 p-5">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">360° feedback (saved)</h2>
			<p class="mt-1 text-xs text-kood-muted/90">
				Submitter ratings per category and each reviewer’s scores live in <code class="font-mono text-[10px]"
					>code_review_json.feedback360</code
				> after participants submit and sync.
			</p>

			<div class="mt-5 space-y-3">
				<p class="text-xs font-medium text-kood-muted">Submitter → reviewers (by category)</p>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each CATEGORIES as cat (cat.id)}
						{@const row = fb.sandraRatings.find((r) => r.categoryId === cat.id)}
						{#if row}
							<div class="rounded-lg border border-kood-border/70 bg-kood-surface/80 px-3 py-2 text-xs">
								<p class="font-medium text-kood-text/90">{cat.title}</p>
								<p class="mt-0.5 text-kood-muted">
									Reviewer: {cat.assignee === 'jane' ? data.reviewerAName : data.reviewerBName}
								</p>
								<p class="mt-1 text-kood-text/90">
									Score: <span class="font-mono">{row.score ?? '—'}</span>
									{#if row.submitted}
										<span class="ml-2 text-kood-accent">Submitted</span>
									{/if}
								</p>
								{#if row.comment.trim()}
									<p class="mt-1 whitespace-pre-wrap text-kood-muted">{row.comment}</p>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<div class="mt-6 grid gap-6 md:grid-cols-2">
				<div class="space-y-3">
					<p class="text-xs font-medium text-kood-muted">Reviewer A ({data.reviewerAName})</p>
					{#each reviewer360Dims as dim (`jane-${dim.key}`)}
						{@const block = fb.reviewerRatings.jane[dim.key]}
						<div class="rounded-lg border border-kood-border/70 bg-kood-surface/80 px-3 py-2 text-xs">
							<p class="font-medium text-kood-text/90">{dim.title}</p>
							<p class="mt-0.5 text-kood-text/90">
								Score: <span class="font-mono">{block.score ?? '—'}</span>
								{#if block.submitted}<span class="ml-2 text-kood-accent">Submitted</span>{/if}
							</p>
							{#if block.comment.trim()}
								<p class="mt-1 whitespace-pre-wrap text-kood-muted">{block.comment}</p>
							{/if}
						</div>
					{/each}
				</div>
				<div class="space-y-3">
					<p class="text-xs font-medium text-kood-muted">Reviewer B ({data.reviewerBName})</p>
					{#each reviewer360Dims as dim (`joe-${dim.key}`)}
						{@const block = fb.reviewerRatings.joe[dim.key]}
						<div class="rounded-lg border border-kood-border/70 bg-kood-surface/80 px-3 py-2 text-xs">
							<p class="font-medium text-kood-text/90">{dim.title}</p>
							<p class="mt-0.5 text-kood-text/90">
								Score: <span class="font-mono">{block.score ?? '—'}</span>
								{#if block.submitted}<span class="ml-2 text-kood-accent">Submitted</span>{/if}
							</p>
							{#if block.comment.trim()}
								<p class="mt-1 whitespace-pre-wrap text-kood-muted">{block.comment}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</header>
