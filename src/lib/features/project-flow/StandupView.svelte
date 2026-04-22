<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { tick } from 'svelte';
	import {
		addStandupTakeawayMessage,
		completeStandup,
		exportCodeReviewWorkspaceForPersistence,
		exportTestingStateForPersistence,
		getApp,
		getPersonaDisplayLabel,
		pushToast,
		reviewerCategoriesPossessivePhrase,
		reviewerSlotDisplayLabel,
		submitterDiscussionLabel,
		toggleStandup
	} from '$lib/appState.svelte';
	import { formatShortTimestamp } from '$lib/features/testing/testingUtils';
	import type { StandupTakeawayMessage } from '$lib/types';

	type Proj = { id: string; status: string };

	let { project = null }: { project?: Proj | null } = $props();

	const app = getApp();

	const isSubmitter = $derived(app.role === 'sandra');
	const isReviewer = $derived(app.role === 'jane' || app.role === 'joe');
	/** Submitter + both reviewers can post takeaway bubbles and publish the thread. */
	const canEditTakeaways = $derived(isSubmitter || isReviewer);

	const takeawayThread = $derived(
		[...app.standupTakeawayMessages].sort((a, b) => a.at.localeCompare(b.at))
	);

	/** Any linked project row — do not gate on status (standup can run while status still matches review flow). */
	const canPublishToServer = $derived(Boolean(project?.id));

	const slotJane = $derived(reviewerSlotDisplayLabel('jane'));
	const slotJoe = $derived(reviewerSlotDisplayLabel('joe'));
	const submitterName = $derived(submitterDiscussionLabel());

	const agenda = $derived([
		'Scheduled the ~45 min sync and shared time / voice channel with the team.',
		`Followed the structure: ${reviewerCategoriesPossessivePhrase('jane')} → ${reviewerCategoriesPossessivePhrase('joe')} → cross-review → ${submitterName} → shared actions.`,
		'Captured takeaways below (what was discussed, key feedback, action items, reflections).',
		'Confirmed everyone had space to speak; notes are specific enough to use later.',
		'Agreed what “done” means for this review before moving to Accept project.'
	]);

	const maxTakeawayChars = 2000;

	let takeawayDraft = $state('');
	let threadSaving = $state(false);
	let threadScrollEl: HTMLDivElement | undefined = $state();

	function dayKey(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	}

	function dayChipLabel(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '—';
		const today = new Date();
		const sameDay = (x: Date, y: Date) =>
			x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
		if (sameDay(d, today)) return 'Today';
		const y = new Date(today);
		y.setDate(y.getDate() - 1);
		if (sameDay(d, y)) return 'Yesterday';
		return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
	}

	function bubbleClasses(m: StandupTakeawayMessage): string {
		const own = m.author === app.role;
		const base =
			'max-w-[min(100%,20rem)] rounded-2xl px-3 py-2 text-sm shadow-sm ' +
			(own ? 'rounded-br-md ' : 'rounded-bl-md ');
		if (own) {
			return `${base} bg-kood-accent/25 text-kood-text ring-1 ring-kood-accent/35`;
		}
		if (m.author === 'sandra') {
			return `${base} bg-amber-500/[0.12] text-kood-text/95 ring-1 ring-amber-400/40`;
		}
		if (m.author === 'jane') {
			return `${base} bg-kood-accent/[0.12] text-kood-text/95 ring-1 ring-kood-accent/35`;
		}
		return `${base} bg-violet-500/[0.1] text-kood-text/95 ring-1 ring-violet-400/40`;
	}

	async function saveReviewStateToServer(): Promise<boolean> {
		const pid = project?.id;
		if (!pid || !browser) return false;
		const fd = new FormData();
		fd.set('projectId', pid);
		fd.set('testingPayload', JSON.stringify(exportTestingStateForPersistence()));
		fd.set('codeReviewPayload', JSON.stringify(exportCodeReviewWorkspaceForPersistence()));
		try {
			const res = await fetch('?/saveReviewState', { method: 'POST', body: fd, credentials: 'include' });
			if (res.ok) await invalidateAll();
			return res.ok;
		} catch {
			return false;
		}
	}

	async function submitStandupToServer() {
		await tick();
		if (!project?.id) {
			pushToast('No project linked — open this screen from your assigned review (signed-in submitter or reviewer).');
			return;
		}
		threadSaving = true;
		const ok = await saveReviewStateToServer();
		threadSaving = false;
		if (ok) pushToast('Saved to server — everyone sees this after refresh.');
		else pushToast('Save failed — check you are logged in and try again.');
	}

	async function postTakeaway() {
		if (!takeawayDraft.trim()) return;
		const draft = takeawayDraft;
		addStandupTakeawayMessage(draft);
		takeawayDraft = '';
		await tick();
		if (!project?.id) {
			pushToast('Posted in this browser only — open from a linked project to save for the team.');
			return;
		}
		if (!browser) return;
		threadSaving = true;
		const ok = await saveReviewStateToServer();
		threadSaving = false;
		if (ok) pushToast('Posted — synced for everyone.');
		else pushToast('Posted here, but sync failed — try “Sync to server” below.');
	}

	$effect(() => {
		takeawayThread.length;
		queueMicrotask(() => {
			const el = threadScrollEl;
			if (!el) return;
			el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
		});
	});
</script>

<div class="max-w-2xl space-y-8">
	<header class="space-y-2">
		<p class="text-xs font-semibold uppercase tracking-wide text-kood-accent">Post-sprint</p>
		<h2 class="text-xl font-semibold text-kood-text">Standup · review call (≈45 minutes)</h2>
		<p class="text-sm text-kood-muted">
			This phase is the <strong class="text-kood-text/90">live</strong> debrief after the async sprint. Staff or
			experts may drop in occasionally — keep the channel name and time visible for everyone.
		</p>
		{#if !isSubmitter}
			<p class="text-xs text-amber-400/90">
				Meeting logistics and the checklist are entered by the <strong class="text-kood-text/90">submitter</strong> (call
				lead). What they save to the server appears here for reviewers.
			</p>
		{/if}
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting details</h3>
		{#if isSubmitter}
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<label class="block text-xs text-kood-muted">
					<span class="mb-1 block font-medium text-kood-text/90">Meeting start</span>
					<input
						type="datetime-local"
						class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text"
						bind:value={app.standupWhen}
					/>
				</label>
				<label class="block text-xs text-kood-muted">
					<span class="mb-1 block font-medium text-kood-text/90">Voice channel</span>
					<input
						type="text"
						class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text placeholder:text-kood-muted"
						placeholder="Discord voice channel name"
						bind:value={app.standupVoiceChannel}
					/>
				</label>
			</div>
			<p class="mt-3 text-xs text-kood-muted/80">
				Use a short-lived project Discord; archive when the project closes.
			</p>
			{#if canPublishToServer}
				<button
					type="button"
					class="mt-3 rounded-lg bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-accent-foreground hover:opacity-95 disabled:opacity-40"
					disabled={threadSaving}
					onclick={() => submitStandupToServer()}>Publish meeting details</button
				>
				<p class="mt-2 text-[11px] text-kood-muted/85">
					Saves time and voice channel to the server (with your current testing &amp; code review snapshot) so
					reviewers see them after refresh.
				</p>
			{/if}
		{:else}
			<dl class="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
				<div>
					<dt class="text-xs font-medium text-kood-muted">Meeting start</dt>
					<dd class="mt-1 text-kood-text">{app.standupWhen.trim() ? app.standupWhen : '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium text-kood-muted">Voice channel</dt>
					<dd class="mt-1 break-words text-kood-text">{app.standupVoiceChannel.trim() ? app.standupVoiceChannel : '—'}</dd>
				</div>
			</dl>
		{/if}
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<details class="group" open={isSubmitter}>
			<summary
				class="cursor-pointer list-none text-sm font-semibold text-kood-text [&::-webkit-details-marker]:hidden"
			>
				<span class="inline-flex items-center gap-2">
					Discussion guide (on the call)
					{#if !isSubmitter}
						<span class="text-xs font-normal text-kood-muted">— tap to expand the full agenda</span>
					{/if}
				</span>
			</summary>
			<p class="mt-3 text-xs text-kood-muted">
				Facilitator keeps time; everyone else contributes under each block. Same order as on the Code review page.
			</p>
			<ol class="mt-4 list-decimal space-y-3 pl-5 text-sm text-kood-text/90">
				<li>
					<strong class="text-kood-text">{slotJane}</strong> — Security &amp; correctness: findings, feedback, fixes.
				</li>
				<li>
					<strong class="text-kood-text">{slotJoe}</strong> — Performance &amp; structure &amp; architecture: findings,
					feedback, fixes.
				</li>
				<li>
					<strong class="text-kood-text">Cross-review</strong> — How each reviewer engaged with the other’s focus
					areas (concrete examples).
				</li>
				<li>
					<strong class="text-kood-text">{submitterName}</strong> — Submitter perspective: what changed, what is still
					risky, what you need from reviewers before sign-off.
				</li>
				<li>
					<strong class="text-kood-text">Everyone</strong> — Action items, academy follow-ups, and alignment on
					closure.
				</li>
			</ol>
		</details>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting summary</h3>
		<p class="mt-2 text-xs text-kood-muted">
			Good notes speed up learning and future reviews. Be clear, specific, and actionable.
		</p>

		<div
			class="mt-4 overflow-hidden rounded-2xl border border-kood-border bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,transparent_12rem)] ring-1 ring-kood-border/60"
		>
			<div class="border-b border-kood-border/80 bg-kood-bg/50 px-4 py-2.5">
				<p class="text-xs font-semibold text-kood-text/90">Team takeaways</p>
				<p class="mt-0.5 text-[11px] leading-snug text-kood-muted">
					{#if canPublishToServer}
						Messages save to the project automatically after you send (same as testing / code review sync). Everyone
						sees the same thread after refresh.
					{:else}
						Each person posts their own bubble. Open this flow from a linked project while signed in so posts sync
						for the team.
					{/if}
				</p>
				<p class="mt-2 flex flex-wrap gap-3 text-[10px] text-kood-muted">
					<span class="inline-flex items-center gap-1.5"
						><span class="inline-block h-2.5 w-2.5 rounded-full bg-amber-400/85" aria-hidden="true"></span>
						{getPersonaDisplayLabel('sandra')}</span
					>
					<span class="inline-flex items-center gap-1.5"
						><span class="inline-block h-2.5 w-2.5 rounded-full bg-kood-accent" aria-hidden="true"></span>
						{getPersonaDisplayLabel('jane')}</span
					>
					<span class="inline-flex items-center gap-1.5"
						><span class="inline-block h-2.5 w-2.5 rounded-full bg-violet-400/85" aria-hidden="true"></span>
						{getPersonaDisplayLabel('joe')}</span
					>
				</p>
			</div>

			<div
				bind:this={threadScrollEl}
				class="max-h-[min(22rem,55vh)] space-y-2 overflow-y-auto bg-kood-bg/35 px-3 py-3"
				role="log"
				aria-label="Standup takeaway messages"
				aria-live="polite"
			>
				{#if takeawayThread.length === 0}
					<div class="flex min-h-[11rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
						<p class="text-sm text-kood-muted/90">No messages yet</p>
						<p class="max-w-xs text-[11px] text-kood-muted/80">
							Start the thread — when you’re on a linked project, each send is stored for reviewers and submitter
							alike.
						</p>
					</div>
				{:else}
					{#each takeawayThread as m, i (m.id)}
						{#if i === 0 || dayKey(m.at) !== dayKey(takeawayThread[i - 1].at)}
							<div class="flex justify-center py-1">
								<span
									class="rounded-full bg-kood-surface-raised/90 px-3 py-0.5 text-[10px] font-medium uppercase tracking-wide text-kood-muted ring-1 ring-kood-border/70"
								>
									{dayChipLabel(m.at)}
								</span>
							</div>
						{/if}
						<div class="flex w-full flex-col gap-0.5 {m.author === app.role ? 'items-end' : 'items-start'}">
							<div class="max-w-[min(92%,22rem)] px-1 text-[10px] text-kood-muted/90">
								<span class="font-semibold text-kood-text/75">{getPersonaDisplayLabel(m.author)}</span>
								{#if m.author === app.role}
									<span class="text-kood-accent"> · You</span>
								{/if}
							</div>
							<div class="flex {m.author === app.role ? 'justify-end' : 'justify-start'} w-full">
								<div class={bubbleClasses(m)}>
									<p class="whitespace-pre-wrap text-[13px] leading-relaxed">{m.text}</p>
									<p class="mt-1.5 text-right text-[10px] tabular-nums text-kood-muted/85">
										{m.at ? formatShortTimestamp(m.at) : '—'}
									</p>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			{#if canEditTakeaways}
				<div class="border-t border-kood-border/80 bg-kood-surface/90 p-3">
					<label class="sr-only" for="standup-takeaway-draft">Your takeaway message</label>
					<div class="flex flex-col gap-2 sm:flex-row sm:items-end">
						<textarea
							id="standup-takeaway-draft"
							rows="2"
							class="min-h-[2.75rem] flex-1 resize-y rounded-xl border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text placeholder:text-kood-muted/55 focus:outline-none focus:ring-2 focus:ring-kood-accent/40"
							maxlength={maxTakeawayChars}
							placeholder="Type a takeaway…"
							bind:value={takeawayDraft}
						></textarea>
						<button
							type="button"
							class="shrink-0 rounded-xl bg-kood-accent px-4 py-2.5 text-sm font-semibold text-kood-accent-foreground hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!takeawayDraft.trim() || threadSaving}
							onclick={() => postTakeaway()}>{threadSaving ? 'Saving…' : 'Send'}</button
						>
					</div>
					<div class="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-kood-muted">
						<span>{takeawayDraft.length} / {maxTakeawayChars}</span>
						{#if canPublishToServer}
							<button
								type="button"
								class="text-kood-accent underline decoration-dotted underline-offset-2 hover:opacity-90 disabled:opacity-40"
								disabled={threadSaving}
								onclick={() => submitStandupToServer()}>Sync meeting details &amp; checklist now</button
							>
						{/if}
					</div>
				</div>
			{:else}
				<div class="border-t border-kood-border/80 bg-kood-bg/25 px-4 py-3">
					<p class="text-xs text-kood-muted/90">Read-only: only the submitter and paired reviewers can post here.</p>
				</div>
			{/if}
		</div>
	</section>

	<div>
		<h3 class="text-sm font-semibold text-kood-text">Checklist</h3>
		{#if isSubmitter}
			<p class="mt-1 text-xs text-kood-muted">You lead the call — check each item when it is true for this meeting.</p>
			<ul class="mt-4 space-y-3">
				{#each agenda as line, i (i)}
					<li class="flex items-start gap-3 rounded-xl border border-kood-border bg-kood-bg/40 p-4">
						<input
							type="checkbox"
							class="mt-1 h-4 w-4 shrink-0 rounded border border-kood-border bg-kood-surface-raised text-kood-accent focus:ring-kood-accent"
							checked={app.standupItems[i]}
							onchange={() => toggleStandup(i)}
						/>
						<span class="text-sm text-kood-text">{line}</span>
					</li>
				{/each}
			</ul>
			{#if canPublishToServer}
				<button
					type="button"
					class="mt-4 rounded-lg border border-kood-border bg-kood-bg px-4 py-2 text-sm font-medium text-kood-text hover:bg-kood-surface-raised disabled:opacity-40"
					disabled={threadSaving}
					onclick={() => submitStandupToServer()}>Publish checklist progress</button
				>
				<p class="mt-2 text-[11px] text-kood-muted/85">
					Saves checklist state with your sprint snapshot so reviewers can follow along.
				</p>
			{/if}
		{:else}
			<p class="mt-1 text-xs text-kood-muted">Submitter progress (read-only)</p>
			<ul class="mt-4 space-y-3">
				{#each agenda as line, i (i)}
					<li class="flex items-start gap-3 rounded-xl border border-kood-border bg-kood-bg/40 p-4">
						<span
							class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-kood-border text-[11px] text-kood-muted"
							aria-hidden="true">{app.standupItems[i] ? '✓' : ''}</span>
						<span class="text-sm text-kood-text">{line}</span>
					</li>
				{/each}
			</ul>
	{/if}
</div>

	{#if isSubmitter}
		<button
			type="button"
			class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground"
			onclick={() => completeStandup()}>Complete standup</button
		>
	{/if}
</div>
