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
		reviewerCategoriesPossessivePhrase,
		reviewerSlotDisplayLabel,
		submitterDiscussionLabel,
		toggleStandup
	} from '$lib/appState.svelte';
	import { formatShortTimestamp } from '$lib/features/testing/testingUtils';
	import type { StandupTakeawayMessage } from '$lib/types';
	import { saveReviewStateWithPayloads } from '$lib/reviewSyncClient';

	type Proj = { id: string; status: string };

	let { project = null }: { project?: Proj | null } = $props();

	const app = getApp();

	const janeName = $derived(getPersonaDisplayLabel('jane'));
	const joeName = $derived(getPersonaDisplayLabel('joe'));
	const sandraName = $derived(getPersonaDisplayLabel('sandra'));

	const agenda = $derived([
		'Scheduled the ~45 min sync and shared time / voice channel with the team.',
		`Followed the structure: ${janeName}’s categories → ${joeName}’s → cross-review → ${sandraName} → shared actions.`,
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
		return saveReviewStateWithPayloads(
			pid,
			JSON.stringify(exportTestingStateForPersistence()),
			JSON.stringify(exportCodeReviewWorkspaceForPersistence())
		);
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
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting details</h3>
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
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Discussion guide (on the call)</h3>
		<p class="mt-2 text-xs text-kood-muted">
			Facilitator keeps time; everyone else contributes under each block. Same order as on the Code review page.
		</p>
		<ol class="mt-4 list-decimal space-y-3 pl-5 text-sm text-kood-text/90">
			<li>
				<strong class="text-kood-text">You</strong> — Security &amp; correctness: findings, feedback, fixes.
			</li>
			<li>
				<strong class="text-kood-text">Joe</strong> — Performance &amp; structure &amp; architecture: findings, feedback,
				fixes.
			</li>
			<li>
				<strong class="text-kood-text">Cross-review</strong> — How each reviewer engaged with the other’s focus
				areas (concrete examples).
			</li>
			<li>
				<strong class="text-kood-text">{sandraName}</strong> — Submitter perspective: what changed, what is still risky,
				what you need from reviewers before sign-off.
			</li>
			<li>
				<strong class="text-kood-text">Everyone</strong> — Action items, academy follow-ups, and alignment on
				closure.
			</li>
		</ol>
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface p-5">
		<h3 class="text-sm font-semibold text-kood-text">Meeting summary</h3>
		<p class="mt-2 text-xs text-kood-muted">
			Good notes speed up learning and future reviews. Be clear, specific, and actionable.
		</p>
		<p class="mt-3 text-xs font-medium text-kood-text/90">Takeaways from this session</p>
		<p class="mt-1 text-[11px] text-kood-muted">
			What was discussed · Key feedback · Action items · Participants’ reflection
			<span class="block text-kood-muted/70">(Prototype: always editable.)</span>
		</p>
		<textarea
			class="mt-2 min-h-[140px] w-full resize-y rounded-lg border border-kood-border bg-kood-bg px-3 py-2 text-sm text-kood-text placeholder:text-kood-muted/70"
			maxlength={maxTakeaways}
			placeholder="We discussed the following points in the meeting…"
			bind:value={app.standupTakeaways}
		></textarea>
		<p class="mt-1 text-right text-[11px] text-kood-muted">
			{app.standupTakeaways.length} / {maxTakeaways}
		</p>
	</section>

	<div>
		<h3 class="text-sm font-semibold text-kood-text">Checklist</h3>
		<p class="mt-1 text-xs text-kood-muted">Check each item when it is true for this call.</p>
		<ul class="mt-4 space-y-3">
			{#each agenda as line, i (i)}
				<li class="flex items-start gap-3 rounded-xl border border-kood-border bg-kood-bg/40 p-4">
					<input
						type="checkbox"
						class="mt-1 h-4 w-4 shrink-0 rounded border-kood-border bg-kood-surface-raised text-kood-accent focus:ring-kood-accent"
						checked={app.standupItems[i]}
						onchange={() => toggleStandup(i)}
					/>
					<span class="text-sm text-kood-text">{line}</span>
				</li>
			{/each}
		</ul>
	</div>

	<button
		type="button"
		class="rounded-full bg-kood-accent px-5 py-2.5 text-sm font-bold text-kood-accent-foreground"
		onclick={() => completeStandup()}>Complete standup</button
	>
</div>
