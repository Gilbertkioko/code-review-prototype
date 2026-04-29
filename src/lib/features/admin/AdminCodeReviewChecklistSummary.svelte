<script lang="ts">
	import type { AdminCodeReviewSummary } from '$lib/server/admin-code-review-summary';
	import type { AuditThreadGroup } from '$lib/server/review-audit';
	import AdminThreadConversationFeed from '$lib/features/admin/AdminThreadConversationFeed.svelte';

	let {
		summary,
		reviewerAColumn,
		reviewerBColumn,
		threadGroups = []
	}: {
		summary: AdminCodeReviewSummary;
		reviewerAColumn: string;
		reviewerBColumn: string;
		threadGroups?: AuditThreadGroup[];
	} = $props();

	type OwnerTab = 'jane' | 'joe';
	let activeOwnerTab = $state<OwnerTab>('jane');

	const reviewerARows = $derived(summary.rows.filter((r) => r.assignee === 'jane'));
	const reviewerBRows = $derived(summary.rows.filter((r) => r.assignee === 'joe'));
	const ownerRows = $derived(activeOwnerTab === 'jane' ? reviewerARows : reviewerBRows);
	const ownerCategories = $derived(
		Array.from(new Set(ownerRows.map((r) => r.categoryId))).map((id) => ({
			id,
			title: ownerRows.find((r) => r.categoryId === id)?.categoryTitle ?? id
		}))
	);
	let activeCategoryId = $state<string>('');
	$effect(() => {
		const first = ownerCategories[0]?.id ?? '';
		if (!first) {
			activeCategoryId = '';
			return;
		}
		if (!ownerCategories.some((c) => c.id === activeCategoryId)) activeCategoryId = first;
	});
	const visibleRows = $derived(ownerRows.filter((r) => r.categoryId === activeCategoryId));

	function verdictChip(v: string): string {
		if (v === 'accept') return 'text-emerald-200/90';
		if (v === 'decline') return 'text-red-200/90';
		return 'text-kood-muted';
	}

	function outcomeLabel(o: 'pass' | 'fail' | 'pending'): string {
		if (o === 'pass') return 'Passed';
		if (o === 'fail') return 'Failed';
		return 'Pending';
	}

	function outcomeClass(o: 'pass' | 'fail' | 'pending'): string {
		if (o === 'pass') return 'bg-emerald-500/15 text-emerald-200/95 ring-1 ring-emerald-400/35';
		if (o === 'fail') return 'bg-red-500/15 text-red-200/95 ring-1 ring-red-400/35';
		return 'bg-kood-bg text-kood-muted ring-1 ring-kood-border/70';
	}

	function threadGroupsFor(observationId: string): AuditThreadGroup[] {
		return threadGroups.filter((g) => g.context.includes(` ${observationId} —`) || g.context.includes(` ${observationId} `));
	}
</script>

<section class="w-full rounded-xl border border-kood-border bg-kood-surface p-4 md:p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-kood-text">Code review outcomes</h2>
			<p class="mt-1 text-xs text-kood-muted">
				Assigned-observer verdicts for this project (round {summary.codeReviewRound}).
			</p>
		</div>
	</div>

	<div class="mt-6">
		<div class="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Code review checklist by reviewer">
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {activeOwnerTab === 'jane'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={activeOwnerTab === 'jane'}
				onclick={() => (activeOwnerTab = 'jane')}
			>
				{reviewerAColumn} ({reviewerARows.length})
			</button>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {activeOwnerTab === 'joe'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={activeOwnerTab === 'joe'}
				onclick={() => (activeOwnerTab = 'joe')}
			>
				{reviewerBColumn} ({reviewerBRows.length})
			</button>
		</div>

		{#if ownerCategories.length > 1}
			<div class="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Code review categories">
				{#each ownerCategories as c (c.id)}
					<button
						type="button"
						class="rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors {activeCategoryId === c.id
							? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
							: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
						role="tab"
						aria-selected={activeCategoryId === c.id}
						onclick={() => (activeCategoryId = c.id)}
					>
						{c.title}
					</button>
				{/each}
			</div>
		{/if}

		<div class="space-y-3">
			{#each visibleRows as r (r.compositeId)}
				<details class="overflow-hidden rounded-lg border border-kood-border/70 bg-kood-bg/20">
					<summary class="cursor-pointer list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
						<div class="flex flex-wrap items-center gap-2 text-xs">
							<span class="font-mono text-[10px] text-kood-muted">{r.observationId}</span>
							<span class="text-[10px] text-kood-muted/90">{r.categoryTitle}</span>
							<span class={`font-medium tabular-nums ${verdictChip(r.ownerVerdict)}`}>{r.ownerVerdict}</span>
							<span class={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${outcomeClass(r.outcome)}`}>
								{outcomeLabel(r.outcome)}
							</span>
						</div>
						<p class="mt-1 text-xs text-kood-muted">{r.summary}</p>
						<div class="mt-2 inline-flex items-center gap-2 rounded-md border border-amber-400/35 bg-amber-500/[0.08] px-2.5 py-1">
							<span class="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">Iterations</span>
							<span class="text-[11px] font-medium text-amber-100">
								{r.ownerDeclinesBeforeAccept} decline{r.ownerDeclinesBeforeAccept === 1 ? '' : 's'} before accepted
							</span>
						</div>
					</summary>
					<div class="border-t border-kood-border/50 px-3 py-3">
						<AdminThreadConversationFeed
							groups={threadGroupsFor(r.observationId)}
							emptyLabel="No code review comments saved yet for this observation."
							showContextHeader={false}
						/>
					</div>
				</details>
			{/each}
		</div>
	</div>
</section>
