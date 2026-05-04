<script lang="ts">
	let { data } = $props();

	const standup = $derived(data.standupSnapshot);

	const checklistTitles = [
		'Scheduled the ~45 min sync and shared time / voice channel with the team.',
		'Followed the structure: reviewer buckets → cross-review → submitter → shared actions.',
		'Captured takeaways below (what was discussed, key feedback, action items, reflections).',
		'Confirmed everyone had space to speak; notes are specific enough to use later.',
		'Agreed what “done” means for this review before moving to Accept project.'
	] as const;

	function personaRoomLabel(author: 'sandra' | 'jane' | 'joe'): string {
		if (author === 'sandra') return data.submitterName;
		if (author === 'jane') return data.reviewerAName;
		return data.reviewerBName;
	}
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — Standup — Admin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 pb-12">
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

	<h1 class="text-lg font-semibold text-kood-text">Standup</h1>

	{#if !standup}
		<p class="text-sm text-kood-muted">No standup block in the saved workspace yet.</p>
	{:else}
		<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
			<h2 class="text-sm font-semibold text-kood-text">Meeting details</h2>
			<dl class="mt-3 grid gap-3 text-xs sm:grid-cols-2">
				<div class="rounded-lg border border-kood-border/50 bg-kood-bg/20 px-3 py-2">
					<dt class="text-kood-muted">Meeting start</dt>
					<dd class="mt-0.5 text-sm text-kood-text/90">{standup.standupWhen || '—'}</dd>
				</div>
				<div class="rounded-lg border border-kood-border/50 bg-kood-bg/20 px-3 py-2">
					<dt class="text-kood-muted">Voice channel</dt>
					<dd class="mt-0.5 break-all text-sm text-kood-text/90">{standup.standupVoiceChannel || '—'}</dd>
				</div>
			</dl>

			<div class="mt-8 border-t border-kood-border/50 pt-6">
				<h2 class="text-sm font-semibold text-kood-text">Takeaways thread</h2>
				<p class="mt-1 text-xs text-kood-muted">Posts from submitter and reviewers (newest in list order).</p>
				{#if standup.standupTakeawayMessages.length > 0}
					<div class="mt-3 divide-y divide-kood-border/40 rounded-xl border border-kood-border/70 bg-kood-bg/30">
						{#each standup.standupTakeawayMessages as m (m.id)}
							<div class="flex gap-3 px-3 py-3 sm:px-4">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kood-border/70 bg-kood-surface/80 text-[11px] font-semibold text-kood-muted"
									aria-hidden="true"
								>
									{personaRoomLabel(m.author)
										.split(/\s+/)
										.filter(Boolean)
										.slice(0, 2)
										.map((w) => w[0] ?? '')
										.join('')
										.toUpperCase() || '—'}
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
										<span class="text-sm font-semibold text-kood-text">{personaRoomLabel(m.author)}</span>
										<span class="text-[11px] text-kood-muted">{m.at || '—'}</span>
									</div>
									<p class="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-kood-text/95">{m.text}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-3 text-sm text-kood-muted">No thread posts yet.</p>
				{/if}
			</div>

			<div class="mt-8 border-t border-kood-border/50 pt-6">
				<h2 class="text-sm font-semibold text-kood-text">Meeting summary (long form)</h2>
				<p class="mt-1 text-xs text-kood-muted">Submitter’s consolidated notes after the call.</p>
				{#if standup.standupTakeaways.trim()}
					<pre
						class="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-kood-border/70 bg-kood-bg/30 px-4 py-3 text-sm text-kood-text/90"
					>{standup.standupTakeaways}</pre>
				{:else}
					<p class="mt-3 text-sm text-kood-muted">—</p>
				{/if}
			</div>

			<div class="mt-8 border-t border-kood-border/50 pt-6">
				<h2 class="text-sm font-semibold text-kood-text">Submitter checklist</h2>
				<ul class="mt-3 space-y-2 text-xs text-kood-text/90">
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
</div>
