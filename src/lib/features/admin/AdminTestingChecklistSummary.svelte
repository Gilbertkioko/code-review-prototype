<script lang="ts">
	import type { AdminTestingSummary } from '$lib/server/admin-testing-summary';
	import type { AuditThreadGroup } from '$lib/server/review-audit';
	import AdminThreadConversationFeed from '$lib/features/admin/AdminThreadConversationFeed.svelte';

	let {
		summary,
		reviewerAColumn,
		reviewerBColumn,
		threadGroups = []
	}: {
		summary: AdminTestingSummary;
		reviewerAColumn: string;
		reviewerBColumn: string;
		threadGroups?: AuditThreadGroup[];
	} = $props();

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

	function verdictChip(v: string): string {
		if (v === 'accept') return 'text-emerald-200/90';
		if (v === 'decline') return 'text-red-200/90';
		return 'text-kood-muted';
	}

	const mandatoryRows = $derived(summary.rows.filter((r) => r.section === 'mandatory'));

	function threadGroupsFor(itemId: string): AuditThreadGroup[] {
		return threadGroups.filter((g) => g.context.includes(` ${itemId} —`) || g.context.includes(` ${itemId} `));
	}
</script>

<section class="w-full rounded-xl border border-kood-border bg-kood-surface p-4 md:p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-kood-text">Checklist outcomes</h2>
			<p class="mt-1 text-xs text-kood-muted">
				Verdicts as saved for this project (round {summary.testingRound}). Mandatory rows need an accept from the
				assigned reviewer.
			</p>
		</div>
	</div>

	<div class="mt-4">
		<div class="rounded-lg border border-kood-border/80 bg-kood-bg/30 px-3 py-3">
			<p class="text-[11px] font-semibold uppercase tracking-wide text-kood-muted">Mandatory</p>
			<p class="mt-1 text-sm text-kood-text">
				<span class="font-semibold text-emerald-200/90">{summary.mandatory.pass}</span>
				<span class="text-kood-muted"> passed</span>
				<span class="mx-1.5 text-kood-border/60">·</span>
				<span class="font-semibold text-red-200/90">{summary.mandatory.fail}</span>
				<span class="text-kood-muted"> failed</span>
				<span class="mx-1.5 text-kood-border/60">·</span>
				<span class="font-semibold text-kood-muted">{summary.mandatory.pending}</span>
				<span class="text-kood-muted"> pending</span>
			</p>
			<p class="mt-1 text-[11px] text-kood-muted/90">of {summary.mandatory.total} checks</p>
		</div>
	</div>

	{#if summary.firstFailure}
		<div
			class="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/[0.08] px-3 py-3 text-sm text-kood-text/95"
			role="status"
		>
			<p class="text-[11px] font-semibold uppercase tracking-wide text-amber-200/85">First failing row (checklist order)</p>
			<p class="mt-1 font-mono text-xs text-kood-accent/95">{summary.firstFailure.itemId}</p>
			<p class="mt-1 text-xs text-kood-muted">{summary.firstFailure.summary}</p>
		</div>
	{:else if summary.mandatory.total > 0 && summary.mandatory.fail === 0 && summary.mandatory.pending === 0}
		<p class="mt-4 text-xs text-emerald-200/85">No failed mandatory rows in the current snapshot.</p>
	{/if}

	<div class="mt-6 space-y-3">
		{#each mandatoryRows as r (r.itemId)}
			<details class="overflow-hidden rounded-lg border border-kood-border/70 bg-kood-bg/20">
				<summary class="cursor-pointer list-none px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
					<div class="flex flex-wrap items-center gap-2 text-xs">
						<span class="font-mono text-[10px] text-kood-muted">{r.itemId}</span>
						<span class="text-kood-muted">owner: {r.mandatoryOwner ?? '—'}</span>
						<span class={`font-medium tabular-nums ${verdictChip(r.jane)}`}>{reviewerAColumn}: {r.jane}</span>
						<span class={`font-medium tabular-nums ${verdictChip(r.joe)}`}>{reviewerBColumn}: {r.joe}</span>
						<span class={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${outcomeClass(r.outcome)}`}>
							{outcomeLabel(r.outcome)}
						</span>
					</div>
					<p class="mt-1 text-xs text-kood-muted">{r.summary}</p>
				</summary>
				<div class="border-t border-kood-border/50 px-3 py-3">
					<AdminThreadConversationFeed
						groups={threadGroupsFor(r.itemId)}
						emptyLabel="No testing comments saved yet for this checklist row."
					/>
				</div>
			</details>
		{/each}
	</div>
</section>
