<script lang="ts">
	import { CATEGORIES } from '$lib/constants';
	import type { ReviewerRatingSet } from '$lib/types';

	let { data } = $props();

	const started = $derived(
		data.project.createdAt ? new Date(data.project.createdAt).toLocaleString() : '—'
	);

	const standup = $derived(data.standupSnapshot);
	const fb = $derived(data.feedback360Snapshot);

	const navLinks = $derived(
		[
			{ href: '#audit-overview', label: 'Overview' },
			data.testingItemProgress.length > 0 ? { href: '#audit-sql-testing', label: 'Testing (SQL)' } : null,
			data.codeReviewObservationProgress.length > 0 ? { href: '#audit-sql-code', label: 'Code review (SQL)' } : null,
			standup ? { href: '#audit-standup', label: 'Standup' } : null,
			fb ? { href: '#audit-360', label: '360° feedback' } : null,
			{ href: '#audit-threads-testing', label: 'Testing threads' },
			{ href: '#audit-threads-code', label: 'Code threads' }
		].filter(Boolean) as { href: string; label: string }[]
	);

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
	<title>{data.projectDisplayTitle} — Admin</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8 pb-12">
	<p class="text-xs text-kood-muted">
		<a href="/admin" class="text-kood-accent underline underline-offset-2">← Admin dashboard</a>
	</p>

	<nav
		class="sticky top-0 z-20 -mx-1 flex flex-wrap gap-1.5 border-b border-kood-border/60 bg-kood-bg/90 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-kood-bg/75"
		aria-label="On this page"
	>
		{#each navLinks as link (link.href)}
			<a
				href={link.href}
				class="rounded-full border border-kood-border/50 bg-kood-surface/80 px-3 py-1 text-[11px] font-medium text-kood-muted transition hover:border-kood-accent/40 hover:text-kood-text"
				>{link.label}</a
			>
		{/each}
	</nav>

	<header
		id="audit-overview"
		class="scroll-mt-24 rounded-2xl border border-kood-accent/25 bg-gradient-to-br from-kood-surface/90 to-kood-bg/30 p-5 md:p-6"
	>
		<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-kood-muted/90">Project</p>
		<h1 class="mt-1 text-xl font-semibold tracking-tight text-kood-text md:text-2xl">
			{data.projectDisplayTitle}
		</h1>
		<p class="mt-2 text-sm text-kood-muted">
			<span class="font-semibold text-kood-muted/80">Submitter</span>
			<span class="ml-1 font-mono text-kood-text/95">{data.submitterName}</span>
			<span class="mx-2 text-kood-border">·</span>
			Created <span class="text-kood-text/90">{started}</span>
			<span class="mx-2 text-kood-border">·</span>
			Status <span class="font-medium text-kood-accent">{data.project.status}</span>
		</p>
		{#if data.project.giteaUrl}
			<p class="mt-3 break-all text-sm">
				<a class="text-kood-accent underline" href={data.project.giteaUrl} target="_blank" rel="noreferrer"
					>{data.project.giteaUrl}</a
				>
			</p>
		{/if}

		<div
			class="mt-5 grid gap-3 rounded-xl border border-kood-border/60 bg-kood-bg/30 p-4 text-sm sm:grid-cols-3"
		>
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wide text-kood-muted">Submitter</p>
				<p class="mt-1 font-medium text-kood-text">{data.submitterName}</p>
			</div>
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wide text-kood-muted">Reviewer A (slot 1)</p>
				<p class="mt-1 font-medium text-kood-text">{data.reviewerAName}</p>
			</div>
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wide text-kood-muted">Reviewer B (slot 2)</p>
				<p class="mt-1 font-medium text-kood-text">{data.reviewerBName}</p>
			</div>
		</div>

		{#if data.pair}
			<p class="mt-4 text-xs text-kood-muted">
				Pair row · reviewer IDs
				<span class="ml-1 font-mono text-[10px] text-kood-text/80">{data.pair.reviewerAId}</span>
				·
				<span class="font-mono text-[10px] text-kood-text/80">{data.pair.reviewerBId}</span>
			</p>
		{/if}
	</header>

	{#if data.testingItemProgress.length > 0}
		<section id="audit-sql-testing" class="scroll-mt-24 rounded-2xl border border-kood-border bg-kood-surface/80 p-4 md:p-5">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Testing · verdict progress (SQL)</h2>
			<p class="mt-1 text-xs text-kood-muted">
				Latest accept/decline/pending per checklist row (same ids as the prototype).
			</p>
			<div class="mt-3 overflow-x-auto rounded-xl border border-kood-border/80 bg-kood-bg/30">
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
		<section id="audit-sql-code" class="scroll-mt-24 rounded-2xl border border-kood-border bg-kood-surface/80 p-4 md:p-5">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review · verdict progress (SQL)</h2>
			<p class="mt-1 text-xs text-kood-muted">Per observation row — matches the sprint board.</p>
			<div class="mt-3 overflow-x-auto rounded-xl border border-kood-border/80 bg-kood-bg/30">
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
		</section>
	{/if}

	{#if standup}
		<section id="audit-standup" class="scroll-mt-24 rounded-2xl border border-kood-border bg-kood-surface/80 p-4 md:p-5">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Standup (saved)</h2>
			<p class="mt-1 text-xs text-kood-muted">
				From <code class="rounded bg-kood-bg px-1 font-mono text-[10px]">code_review_json.standup</code> after sync.
			</p>
			<dl class="mt-3 grid gap-2 text-xs sm:grid-cols-2">
				<div>
					<dt class="text-kood-muted">Meeting start</dt>
					<dd class="mt-0.5 text-kood-text/90">{standup.standupWhen || '—'}</dd>
				</div>
				<div>
					<dt class="text-kood-muted">Voice channel</dt>
					<dd class="mt-0.5 text-kood-text/90">{standup.standupVoiceChannel || '—'}</dd>
				</div>
			</dl>
			<div class="mt-4">
				<p class="text-xs font-medium text-kood-muted">Takeaways thread</p>
				{#if standup.standupTakeawayMessages.length > 0}
					<ul
						class="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-kood-border/80 bg-kood-bg/25 px-3 py-2 text-xs"
					>
						{#each standup.standupTakeawayMessages as m (m.id)}
							<li class="rounded-lg bg-kood-surface/60 px-2 py-1.5">
								<span class="font-medium text-kood-accent">{personaRoomLabel(m.author)}</span>
								<span class="text-kood-muted"> · {m.at || '—'}</span>
								<p class="mt-0.5 whitespace-pre-wrap text-kood-text/90">{m.text}</p>
							</li>
						{/each}
					</ul>
				{:else if standup.standupTakeaways.trim()}
					<pre
						class="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-kood-border/80 bg-kood-bg/25 px-3 py-2 text-xs text-kood-text/90"
					>{standup.standupTakeaways}</pre>
				{:else}
					<p class="mt-1 text-xs text-kood-muted">—</p>
				{/if}
			</div>
			<div class="mt-4">
				<p class="text-xs font-medium text-kood-muted">Submitter checklist</p>
				<ul class="mt-2 space-y-2 text-xs text-kood-text/90">
					{#each checklistTitles as title, i (i)}
						<li class="flex gap-2 rounded-lg border border-kood-border/50 bg-kood-bg/20 px-2 py-1.5">
							<span class="shrink-0 text-kood-muted" aria-hidden="true">{standup.standupItems[i] ? '✓' : '·'}</span>
							<span>{title}</span>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}

	{#if fb}
		<section id="audit-360" class="scroll-mt-24 rounded-2xl border border-kood-border/80 bg-kood-bg/25 p-5 md:p-6">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">360° feedback (saved)</h2>
			<p class="mt-1 text-xs text-kood-muted/90">
				Submitter ratings per category and each reviewer’s scores in <code class="rounded bg-kood-surface px-1 font-mono text-[10px]"
					>code_review_json.feedback360</code
				>.
			</p>

			<div class="mt-5 space-y-3">
				<p class="text-xs font-medium text-kood-muted">Submitter → reviewers (by category)</p>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each CATEGORIES as cat (cat.id)}
						{@const row = fb.sandraRatings.find((r) => r.categoryId === cat.id)}
						{#if row}
							<div class="rounded-xl border border-kood-border/60 bg-kood-surface/80 px-3 py-2 text-xs">
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
						<div class="rounded-xl border border-kood-border/60 bg-kood-surface/80 px-3 py-2 text-xs">
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
						<div class="rounded-xl border border-kood-border/60 bg-kood-surface/80 px-3 py-2 text-xs">
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
		</section>
	{/if}

	<section id="audit-threads-testing" class="scroll-mt-24 rounded-2xl border border-kood-border bg-kood-surface/80 p-4 md:p-5">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Testing · conversation threads</h2>
		<p class="mt-1 text-xs text-kood-muted">
			Reviewer ↔ submitter messages (SQL after sync, otherwise saved JSON).
		</p>
		{#if data.testingThreadGroups.length === 0}
			<p class="mt-2 text-sm text-kood-muted">No testing comments saved yet.</p>
		{:else}
			<ul class="mt-3 space-y-4 text-sm">
				{#each data.testingThreadGroups as g (g.context)}
					<li class="rounded-xl border border-kood-border/70 bg-kood-bg/25 p-3">
						<p class="text-xs text-kood-muted">{g.context}</p>
						<ul class="mt-2 space-y-2">
							{#each g.entries as t (t.at + t.text.slice(0, 24))}
								<li class="border-l-2 border-kood-accent/40 pl-2 text-xs">
									<p class="text-kood-muted">
										<span class="font-semibold text-kood-text">{t.authorLabel}</span>
										{#if t.round != null}
											· round {t.round}
										{/if}
										· {t.at ? new Date(t.at).toLocaleString() : '—'}
									</p>
									<p class="mt-1 whitespace-pre-wrap text-kood-text/90">{t.text}</p>
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section id="audit-threads-code" class="scroll-mt-24 rounded-2xl border border-kood-border bg-kood-surface/80 p-4 md:p-5">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review · conversation threads</h2>
		<p class="mt-1 text-xs text-kood-muted">
			Messages on each observation row (SQL after sync, otherwise saved JSON).
		</p>
		{#if data.codeReviewThreadGroups.length === 0}
			<p class="mt-2 text-sm text-kood-muted">No code review comments saved yet.</p>
		{:else}
			<ul class="mt-3 space-y-4 text-sm">
				{#each data.codeReviewThreadGroups as g (g.context)}
					<li class="rounded-xl border border-kood-border/70 bg-kood-bg/25 p-3">
						<p class="text-xs text-kood-muted">{g.context}</p>
						<ul class="mt-2 space-y-2">
							{#each g.entries as t (t.at + t.text.slice(0, 24))}
								<li class="border-l-2 border-kood-accent/40 pl-2 text-xs">
									<p class="text-kood-muted">
										<span class="font-semibold text-kood-text">{t.authorLabel}</span>
										{#if t.round != null}
											· round {t.round}
										{/if}
										· {t.at ? new Date(t.at).toLocaleString() : '—'}
									</p>
									<p class="mt-1 whitespace-pre-wrap text-kood-text/90">{t.text}</p>
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
