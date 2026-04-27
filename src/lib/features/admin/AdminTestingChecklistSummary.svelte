<script lang="ts">
	import type { AdminTestingSummary } from '$lib/server/admin-testing-summary';

	let {
		summary,
		reviewerAColumn,
		reviewerBColumn
	}: {
		summary: AdminTestingSummary;
		reviewerAColumn: string;
		reviewerBColumn: string;
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
	const extraRows = $derived(summary.rows.filter((r) => r.section === 'extra'));
</script>

<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-kood-text">Checklist outcomes</h2>
			<p class="mt-1 text-xs text-kood-muted">
				Verdicts as saved for this project (round {summary.testingRound}). Mandatory rows need an accept from the
				assigned reviewer; extra rows need both reviewers to accept.
			</p>
		</div>
	</div>

	<div class="mt-4 grid gap-3 sm:grid-cols-2">
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
		<div class="rounded-lg border border-kood-border/80 bg-kood-bg/30 px-3 py-3">
			<p class="text-[11px] font-semibold uppercase tracking-wide text-kood-muted">Extra</p>
			<p class="mt-1 text-sm text-kood-text">
				<span class="font-semibold text-emerald-200/90">{summary.extra.pass}</span>
				<span class="text-kood-muted"> passed</span>
				<span class="mx-1.5 text-kood-border/60">·</span>
				<span class="font-semibold text-red-200/90">{summary.extra.fail}</span>
				<span class="text-kood-muted"> failed</span>
				<span class="mx-1.5 text-kood-border/60">·</span>
				<span class="font-semibold text-kood-muted">{summary.extra.pending}</span>
				<span class="text-kood-muted"> pending</span>
			</p>
			<p class="mt-1 text-[11px] text-kood-muted/90">of {summary.extra.total} checks</p>
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

	<div class="mt-6 overflow-x-auto rounded-lg border border-kood-border/70">
		<table class="min-w-full divide-y divide-kood-border/50 text-left text-xs">
			<thead class="bg-kood-bg/50 text-[10px] font-semibold uppercase tracking-wide text-kood-muted">
				<tr>
					<th class="whitespace-nowrap px-3 py-2.5">ID</th>
					<th class="px-3 py-2.5">Section</th>
					<th class="px-3 py-2.5">Owner</th>
					<th class="whitespace-nowrap px-3 py-2.5">{reviewerAColumn}</th>
					<th class="whitespace-nowrap px-3 py-2.5">{reviewerBColumn}</th>
					<th class="whitespace-nowrap px-3 py-2.5">Result</th>
					<th class="min-w-[12rem] px-3 py-2.5">Summary</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-kood-border/40 text-kood-text/90">
				{#each [...mandatoryRows, ...extraRows] as r (r.itemId)}
					<tr class="bg-kood-surface/40 odd:bg-kood-bg/20">
						<td class="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-kood-muted">{r.itemId}</td>
						<td class="px-3 py-2 capitalize text-kood-muted">{r.section}</td>
						<td class="px-3 py-2 text-kood-muted">{r.mandatoryOwner ?? '—'}</td>
						<td class={`whitespace-nowrap px-3 py-2 font-medium tabular-nums ${verdictChip(r.jane)}`}>{r.jane}</td>
						<td class={`whitespace-nowrap px-3 py-2 font-medium tabular-nums ${verdictChip(r.joe)}`}>{r.joe}</td>
						<td class="whitespace-nowrap px-3 py-2">
							<span class={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${outcomeClass(r.outcome)}`}>
								{outcomeLabel(r.outcome)}
							</span>
						</td>
						<td class="max-w-xs px-3 py-2 text-kood-muted">{r.summary}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
