<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import {
		addStandupTakeawayMessage,
		completeStandup,
		exportCodeReviewWorkspaceForPersistence,
		exportTestingStateForPersistence,
		getApp,
		getPersonaDisplayLabel,
		pushToast,
		toggleStandup
	} from '$lib/appState.svelte';
	import { formatShortTimestamp } from '$lib/features/testing/testingUtils';
	import type { StandupTakeawayMessage } from '$lib/types';
	import { saveReviewStateWithPayloads } from '$lib/reviewSyncClient';

	type Proj = { id: string; status: string };

	let { project = null }: { project?: Proj | null } = $props();

	const app = getApp();
	const isSubmitter = $derived(app.role === 'sandra');
	const standupChecklistCount = 5;
	const standupChecklistComplete = $derived(
		app.standupItems.length >= standupChecklistCount &&
			app.standupItems.slice(0, standupChecklistCount).every(Boolean)
	);

	const standupPersistFingerprint = $derived(
		`${app.standupWhen}\0${app.standupVoiceChannel}\0${app.standupTakeaways}\0${JSON.stringify(app.standupItems)}\0${JSON.stringify(
			app.standupTakeawayMessages.map((m) => ({ id: m.id, author: m.author, text: m.text, at: m.at }))
		)}`
	);

	const janeName = $derived(getPersonaDisplayLabel('jane'));
	const joeName = $derived(getPersonaDisplayLabel('joe'));
	const sandraName = $derived(getPersonaDisplayLabel('sandra'));

	const agenda = $derived([
		'Scheduled the ~45 minute sync and shared time / voice channel with the team.',
		`Followed the structure: ${janeName}’s categories → ${joeName}’s → cross-review → ${sandraName} → shared actions.`,
		'Captured takeaways below (what was discussed, key feedback, action items, reflections).',
		'Confirmed everyone had space to speak; notes are specific enough to use later.',
		'Agreed what “done” means for this review before moving to Accept project.'
	]);

	const maxTakeaways = 2000;
	const takeawayThread = $derived(app.standupTakeawayMessages);

	let takeawayDraft = $state('');
	let threadSaving = $state(false);
	let threadScrollEl: HTMLDivElement | undefined = $state();

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

	async function saveReviewStateToServer(opts?: { silent?: boolean }): Promise<boolean> {
		const pid = project?.id;
		if (!pid || !browser) return false;
		const ok = await saveReviewStateWithPayloads(
			pid,
			JSON.stringify(exportTestingStateForPersistence()),
			JSON.stringify(exportCodeReviewWorkspaceForPersistence())
		);
		if (!ok && !opts?.silent) pushToast('Save failed — check you are logged in and try again.');
		return ok;
	}

	let standupAutoSaveTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (!browser || !isSubmitter || !project?.id) return;
		void standupPersistFingerprint;
		if (standupAutoSaveTimer) clearTimeout(standupAutoSaveTimer);
		standupAutoSaveTimer = setTimeout(() => {
			standupAutoSaveTimer = undefined;
			void saveReviewStateToServer({ silent: true });
		}, 1200);
		return () => {
			if (standupAutoSaveTimer) clearTimeout(standupAutoSaveTimer);
		};
	});

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
		const ok = await saveReviewStateToServer({ silent: true });
		threadSaving = false;
		if (ok) pushToast('Posted — visible to everyone on this project.');
		else pushToast('Posted here, but sync failed — try again or use Save in your project batch.');
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
		{#if project?.id}
			<p class="text-[11px] text-kood-muted/90">
				Linked project: notes and thread sync to the server for the team and admin overview.
			</p>
		{/if}
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting details</h3>
		{#if isSubmitter}
			<p class="mt-1 text-xs text-kood-muted">You set the time and voice link for the team; reviewers see this read-only.</p>
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
			<p class="mt-3 text-xs text-kood-muted/80">Use a short-lived project Discord; archive when the project closes.</p>
		{:else}
			<p class="mt-1 text-xs text-kood-muted">Set by the submitter ({sandraName}).</p>
			<dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 px-3 py-2">
					<dt class="text-xs font-medium text-kood-muted">Meeting start</dt>
					<dd class="mt-1 text-kood-text/95">{app.standupWhen || '—'}</dd>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 px-3 py-2">
					<dt class="text-xs font-medium text-kood-muted">Voice channel</dt>
					<dd class="mt-1 break-all text-kood-text/95">{app.standupVoiceChannel || '—'}</dd>
				</div>
			</dl>
		{/if}
	</section>


	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Discussion guide (on the call)</h3>
		<p class="mt-2 text-xs text-kood-muted">
			Facilitator keeps time; everyone else contributes under each block. Use this order so the conversation stays
			fair and complete — it mirrors how work was split in the sprint.
		</p>
		<ol class="mt-4 list-decimal space-y-4 pl-5 text-sm text-kood-text/90">
			<li>
				<strong class="text-kood-text">{janeName} — assigned categories</strong>
				<span class="text-kood-muted"> (Security, Correctness)</span>
				<p class="mt-1 text-kood-muted">
					Walk through main findings, feedback sent to {sandraName}, and what changed since. 
				</p>
			</li>
			<li>
				<strong class="text-kood-text">{joeName} — assigned categories</strong>
				<span class="text-kood-muted"> (Performance, Structure &amp; architecture)</span>
				<p class="mt-1 text-kood-muted">
					Same pattern: outcomes, trade-offs, anything still fuzzy. Keep cross-talk light until step 3.
				</p>
			</li>
			<li>
				<strong class="text-kood-text">Cross-review awareness</strong>
				<p class="mt-1 text-kood-muted">
					How did each reviewer show up in the <em>other</em> person’s themes? 
				</p>
			</li>
			<li>
				<strong class="text-kood-text">{sandraName} (submitter)</strong>
				<p class="mt-1 text-kood-muted">
					How you responded to feedback, what was hard to fix, and what you would still like reviewers to
					sanity-check. Agree on any remaining risk or follow-up demos.
				</p>
			</li>
			<li>
				<strong class="text-kood-text">Everyone — close the loop</strong>
				<p class="mt-1 text-kood-muted">
					Shared action items, academy or docs follow-ups, and a crisp “done for this review” line so the project can
					move to accept / 360° feedback without loose ends.
				</p>
			</li>
		</ol>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Takeaways thread</h3>
		<p class="mt-2 text-xs text-kood-muted">
			Short posts from anyone on the trio. After you post, it syncs to the server so the others see it here (same idea
			as a small group chat). Timestamps come from when each message was saved.
		</p>
		<div
			bind:this={threadScrollEl}
			class="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto rounded-lg border border-kood-border bg-kood-bg/40 px-2 py-3"
		>
			{#if takeawayThread.length === 0}
				<p class="px-2 text-center text-xs text-kood-muted">No messages yet — add the first takeaway below.</p>
			{:else}
				{#each takeawayThread as m (m.id)}
					<div class={`flex ${m.author === app.role ? 'justify-end' : 'justify-start'}`}>
						<div class={bubbleClasses(m)}>
							<p class="text-[10px] font-medium text-kood-muted/90">
								{getPersonaDisplayLabel(m.author)}
								{#if m.at}
									· {formatShortTimestamp(m.at)}
								{/if}
							</p>
							<p class="mt-1 whitespace-pre-wrap text-kood-text/95">{m.text}</p>
						</div>
					</div>
				{/each}
			{/if}
		</div>
		<div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
			<label class="min-w-0 flex-1 text-xs text-kood-muted">
				<span class="mb-1 block font-medium text-kood-text/90">Add takeaway</span>
				<textarea
					bind:value={takeawayDraft}
					rows="2"
					maxlength={maxTakeaways}
					disabled={threadSaving}
					class="mt-1 w-full resize-y rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text placeholder:text-kood-muted/70"
					placeholder="Action item, decision, or reflection…"
				></textarea>
			</label>
			<button
				type="button"
				disabled={threadSaving || !takeawayDraft.trim()}
				class="shrink-0 rounded-lg bg-kood-accent px-4 py-2 text-xs font-bold text-kood-accent-foreground disabled:opacity-40"
				onclick={() => postTakeaway()}>Post</button
			>
		</div>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting summary (long form)</h3>
		<p class="mt-2 text-xs text-kood-muted">
			{#if isSubmitter}
				One place for the fuller write-up after the call (what was decided, follow-ups). The thread above is better for
				short, in-the-moment posts — both save automatically when this project is linked.
			{:else}
				Written by the submitter after the call. You can read it here; reviewers do not edit this block.
			{/if}
		</p>
		<p class="mt-3 text-xs font-medium text-kood-text/90">Free-form notes</p>
		<p class="mt-1 text-[11px] text-kood-muted">
			What was discussed · Key feedback · Action items · Participants’ reflection
		</p>
		<textarea
			readonly={!isSubmitter}
			class={`mt-2 min-h-[140px] w-full resize-y rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text placeholder:text-kood-muted/70 ${!isSubmitter ? 'cursor-default opacity-90' : ''}`}
			maxlength={maxTakeaways}
			placeholder="We discussed the following points in the meeting…"
			bind:value={app.standupTakeaways}
		></textarea>
		{#if isSubmitter}
			<p class="mt-1 text-right text-[11px] text-kood-muted">
				{app.standupTakeaways.length} / {maxTakeaways}
			</p>
		{/if}
	</section>

	<div>
		<h3 class="text-sm font-semibold text-kood-text">Checklist</h3>
		<p class="mt-1 text-xs text-kood-muted">
			{#if isSubmitter}
				Check each item when it is true for this call. Everyone can read it; only you can tick boxes.
			{:else}
				Submitter checklist — read-only for reviewers.
			{/if}
		</p>
		<ul class="mt-4 space-y-3">
			{#each agenda as line, i (i)}
				<li class="flex items-start gap-3 rounded-xl border border-kood-border bg-kood-bg/40 p-4">
					<input
						type="checkbox"
						disabled={!isSubmitter}
						class="mt-1 h-4 w-4 shrink-0 rounded border-kood-border bg-kood-surface-raised text-kood-accent focus:ring-kood-accent disabled:cursor-not-allowed disabled:opacity-60"
						checked={app.standupItems[i]}
						onchange={() => toggleStandup(i)}
					/>
					<span class="text-sm text-kood-text">{line}</span>
				</li>
			{/each}
		</ul>
	</div>

	<div class="space-y-2">
		{#if !isSubmitter}
			<p class="text-xs text-kood-muted">
				You cannot tick the checklist — only {sandraName} can. When every item is checked off for this call, use
				<strong class="text-kood-text/90">Complete standup</strong> here as well, then you will land on
				<strong class="text-kood-text/90">Accept project</strong> and can continue to 360° feedback.
			</p>
		{:else if !standupChecklistComplete}
			<p class="text-xs text-kood-muted">Complete every checklist item above — then this button unlocks.</p>
		{/if}
		<button
			type="button"
			disabled={!standupChecklistComplete}
			class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
			onclick={() => completeStandup()}>Complete standup</button
		>
	</div>
</div>
