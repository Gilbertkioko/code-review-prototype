<script lang="ts">
	import {
		allMandatoryDoubleAccepted,
		getApp,
		getPersonaDisplayLabel,
		goToCodeReview,
		mandatoryItems,
		mandatoryOwnedResolvedCount,
	mandatoryProgressForReviewer
	} from '$lib/appState.svelte';
	import TestingItemCard from './TestingItemCard.svelte';

	type MandatoryFilter = 'jane_owned' | 'joe_owned';

	const app = getApp();
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	const isSandra = $derived(app.role === 'sandra');

	let expanded = $state<Record<string, boolean>>({});

	let mandatoryFilter = $state<MandatoryFilter>(
		app.role === 'joe' ? 'joe_owned' : 'jane_owned'
	);

	$effect(() => {
		const r = app.role;
		if (r === 'jane') mandatoryFilter = 'jane_owned';
		else if (r === 'joe') mandatoryFilter = 'joe_owned';
		else mandatoryFilter = 'jane_owned';
	});

	const mandatoryList = $derived(mandatoryItems());
	const allIds = $derived(mandatoryList.map((i) => i.id));

	const mandatoryFiltered = $derived(
		mandatoryFilter === 'jane_owned'
			? mandatoryList.filter((t) => t.mandatoryOwner === 'jane')
			: mandatoryList.filter((t) => t.mandatoryOwner === 'joe')
	);

	const janeProg = $derived(mandatoryProgressForReviewer('jane'));
	const joeProg = $derived(mandatoryProgressForReviewer('joe'));

	const jName = $derived(getPersonaDisplayLabel('jane'));
	const oName = $derived(getPersonaDisplayLabel('joe'));

	const tabJaneBucketLabel = $derived(app.role === 'jane' ? 'Your checks' : jName);
	const tabJoeBucketLabel = $derived(app.role === 'joe' ? 'Your checks' : oName);
	const mandatorySplitBlurb = $derived(
		app.role === 'jane'
			? `first ${janeProg.owned} yours · ${joeProg.owned} for ${oName}`
			: app.role === 'joe'
				? `${janeProg.owned} for ${jName} · ${joeProg.owned} yours`
				: `${janeProg.owned} for ${jName} · ${joeProg.owned} for ${oName}`
	);

	const janeBucketHeader = $derived(app.role === 'jane' ? 'Your bucket' : `${jName}’s bucket`);
	const joeBucketHeader = $derived(app.role === 'joe' ? 'Your bucket' : `${oName}’s bucket`);

	const janeAcceptPct = $derived(
		janeProg.owned === 0 ? 0 : (janeProg.accepted / janeProg.owned) * 100
	);
	const janeDeclinePct = $derived(
		janeProg.owned === 0 ? 0 : (janeProg.declined / janeProg.owned) * 100
	);
	const joeAcceptPct = $derived(
		joeProg.owned === 0 ? 0 : (joeProg.accepted / joeProg.owned) * 100
	);
	const joeDeclinePct = $derived(
		joeProg.owned === 0 ? 0 : (joeProg.declined / joeProg.owned) * 100
	);

	function isOpen(id: string) {
		return expanded[id] === true;
	}

	function toggle(id: string) {
		expanded = { ...expanded, [id]: !isOpen(id) };
	}

	function expandAll() {
		const next: Record<string, boolean> = { ...expanded };
		for (const id of allIds) next[id] = true;
		expanded = next;
	}

	function collapseAll() {
		expanded = {};
	}

	function setFilter(f: MandatoryFilter) {
		mandatoryFilter = f;
	}
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<header>
		<h2 class="text-2xl font-semibold text-kood-text">Testing</h2>
		<p class="mt-3 text-sm leading-relaxed text-kood-muted">
			Ensures the racetrack system works as expected by validating interfaces and features against the briefing.
			Testing helps catch bugs early, improves reliability, and keeps the review focused on the core race control experience.
		</p>
	</header>

	{#if isReviewer}
		<section class="rounded-lg border border-kood-border bg-kood-surface p-5">
			<h3 class="text-sm font-semibold text-kood-text">How to do testing?</h3>
			<ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-kood-muted">
				<li>Clone the repository, then build and run the submitted code.</li>
				<li>Agree how you and your reviewer split the testing effort before you start.</li>
				<li>Test the required racetrack workflows and verify compliance with the brief.</li>
				<li>Provide feedback in the group chat, request fixes, and repeat until the mandatory checks pass.</li>
			</ol>
		</section>
	{/if}

	<details class="group rounded-lg border border-kood-border bg-kood-surface" aria-label="Mandatory checklist progress">
		<summary
			class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wide text-kood-muted marker:content-none [&::-webkit-details-marker]:hidden"
		>
			<span>Team · mandatory completion</span>
			<svg
				class="size-4 shrink-0 text-kood-muted transition-transform duration-200 ease-out group-open:rotate-180"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
					clip-rule="evenodd"
				/>
			</svg>
		</summary>
		<div class="border-t border-kood-border/60 px-4 py-4">
			<p class="text-sm text-kood-text">
				<strong class="text-kood-text">{mandatoryOwnedResolvedCount()}</strong>
				<span class="text-kood-muted"> / {mandatoryList.length}</span>
				<span class="text-kood-muted"> rows with a verdict (accepted or declined)</span>
			</p>

			<p class="mt-3 text-[11px] text-kood-muted">
				<span class="inline-flex items-center gap-1">
					<span class="inline-block size-2 rounded-sm bg-kood-accent/55 ring-1 ring-kood-accent/50"></span>
					Accepted
				</span>
				<span class="ml-3 inline-flex items-center gap-1">
					<span class="inline-block size-2 rounded-sm bg-red-500/50 ring-1 ring-red-400/45"></span>
					Declined
				</span>
				<span class="ml-3 inline-flex items-center gap-1">
					<span class="inline-block size-2 rounded-sm bg-kood-bg ring-1 ring-kood-border/60"></span>
					Pending
				</span>
			</p>

			<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div>
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-kood-text">{janeBucketHeader}</span>
					<span class="text-kood-muted">{janeProg.resolved}/{janeProg.owned}</span>
				</div>
				<div
					class="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-kood-bg ring-1 ring-kood-border/60"
					role="img"
					aria-label="{janeBucketHeader}: {janeProg.accepted} accepted, {janeProg.declined} declined, {janeProg.owned - janeProg.resolved} pending of {janeProg.owned}"
				>
					<div
						class="h-full bg-kood-accent/55 transition-[width] duration-300"
						style="width: {janeAcceptPct}%"
					></div>
					<div
						class="h-full bg-red-500/50 transition-[width] duration-300"
						style="width: {janeDeclinePct}%"
					></div>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between text-xs">
					<span class="font-medium text-kood-text">{joeBucketHeader}</span>
					<span class="text-kood-muted">{joeProg.resolved}/{joeProg.owned}</span>
				</div>
				<div
					class="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-kood-bg ring-1 ring-kood-border/60"
					role="img"
					aria-label="{joeBucketHeader}: {joeProg.accepted} accepted, {joeProg.declined} declined, {joeProg.owned - joeProg.resolved} pending of {joeProg.owned}"
				>
					<div
						class="h-full bg-kood-accent/55 transition-[width] duration-300"
						style="width: {joeAcceptPct}%"
					></div>
					<div
						class="h-full bg-red-500/50 transition-[width] duration-300"
						style="width: {joeDeclinePct}%"
					></div>
				</div>
			</div>
			</div>

			<p class="mt-4 text-[11px] leading-relaxed text-kood-muted">
				The bars above reflect <strong class="text-kood-text/80">every</strong> mandatory row in each bucket — you can’t
				finish the phase until each owned row is accepted.
			</p>
		</div>
	</details>

	<div class="flex flex-wrap justify-end gap-2">
		<button
			type="button"
			class="rounded-md border border-kood-border px-2.5 py-1 text-xs text-kood-text/90 hover:bg-kood-surface-raised"
			onclick={expandAll}>Expand all</button
		>
		<button
			type="button"
			class="rounded-md border border-kood-border px-2.5 py-1 text-xs text-kood-text/90 hover:bg-kood-surface-raised"
			onclick={collapseAll}>Collapse all</button
		>
	</div>

	{#if isSandra}
		<p class="text-xs text-kood-muted" role="status">
			Verdicts are read-only for you — expand a row for the thread.
		</p>
	{/if}

	<section>
		<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
			<h3 class="text-lg font-semibold text-kood-text">Mandatory</h3>
			<p class="text-xs text-kood-muted">
				{mandatoryList.length} checks · {mandatorySplitBlurb}
			</p>
		</div>

		<div
			class="mb-3 flex flex-wrap gap-2"
			role="tablist"
			aria-label={`${tabJaneBucketLabel} vs ${tabJoeBucketLabel} mandatory checks`}
		>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {mandatoryFilter === 'jane_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={mandatoryFilter === 'jane_owned'}
				onclick={() => setFilter('jane_owned')}>{tabJaneBucketLabel} ({janeProg.owned})</button
			>
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors {mandatoryFilter === 'joe_owned'
					? 'border-kood-accent bg-kood-accent/15 text-kood-accent'
					: 'border-kood-border text-kood-muted hover:bg-kood-surface-raised'}"
				role="tab"
				aria-selected={mandatoryFilter === 'joe_owned'}
				onclick={() => setFilter('joe_owned')}>{tabJoeBucketLabel} ({joeProg.owned})</button
			>
		</div>

		<div class="space-y-2">
			{#each mandatoryFiltered as item (item.id)}
				<TestingItemCard item={item} open={isOpen(item.id)} onToggle={() => toggle(item.id)} />
			{/each}
		</div>
	</section>

	<div class="rounded-lg border border-kood-border bg-kood-surface p-4 text-sm text-kood-muted">
		<p class="text-xs uppercase tracking-wide text-kood-muted/80">Submitted</p>
		<p class="mt-1 text-kood-text/90">4/1/2026, 1:55 PM (mock)</p>
	</div>

	<div class="space-y-2">
		<button
			type="button"
			class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
			disabled={!allMandatoryDoubleAccepted()}
			onclick={() => goToCodeReview()}>Continue to code review sprint</button
		>
		{#if !allMandatoryDoubleAccepted()}
			<p class="text-xs text-amber-400/90">
				Every mandatory row must be <strong class="text-amber-200">Accepted by its owner</strong> ({jName} or {oName}).
				Use both tabs so nothing is missed.
			</p>
		{/if}
	</div>
</div>
