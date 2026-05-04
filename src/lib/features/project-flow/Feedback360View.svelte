<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import {
		exportCodeReviewWorkspaceForPersistence,
		exportTestingStateForPersistence,
		getApp,
		getPersonaDisplayLabel,
		patchReviewerRatingDraft,
		patchSandraRatingDraft,
		pushToast,
		setReviewerRating,
		setSandraRating,
		trainingBlurbFor
	} from '$lib/appState.svelte';
	import { CATEGORIES } from '$lib/constants';
	import { saveReviewStateWithPayloads } from '$lib/reviewSyncClient';
	import ScoreSliderWithTicks from './ScoreSliderWithTicks.svelte';

	type Proj = { id: string; status: string };

	let { project = null }: { project?: Proj | null } = $props();

	const app = getApp();
	const sandraName = $derived(getPersonaDisplayLabel('sandra'));
	const peerRole = $derived<'jane' | 'joe'>(app.role === 'joe' ? 'jane' : 'joe');

	const reviewerBlock = $derived(
		app.role === 'jane' || app.role === 'joe' ? app.reviewerRatings[app.role] : null
	);
	const reviewerRole = $derived(app.role === 'jane' || app.role === 'joe' ? app.role : null);

	/** Only the card whose Submit was clicked is busy — never block other categories during sync. */
	let pendingSandraCategoryId = $state<string | null>(null);
	let pendingReviewerKey = $state<'readableCode' | 'codeComments' | 'crossReviewer' | null>(null);

	const feedback360PersistFingerprint = $derived(
		JSON.stringify({
			sandra: app.sandraRatings.map((r) => ({ id: r.categoryId, score: r.score, comment: r.comment, sub: r.submitted })),
			rr: app.reviewerRatings
		})
	);

	let feedbackAutoSaveTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (!browser || !project?.id) return;
		void feedback360PersistFingerprint;
		if (feedbackAutoSaveTimer) clearTimeout(feedbackAutoSaveTimer);
		feedbackAutoSaveTimer = setTimeout(() => {
			feedbackAutoSaveTimer = undefined;
			void (async () => {
				const ok = await saveReviewStateWithPayloads(
					project.id,
					JSON.stringify(exportTestingStateForPersistence()),
					JSON.stringify(exportCodeReviewWorkspaceForPersistence())
				);
				if (!ok) pushToast('360° sync failed — check you are logged in.');
			})();
		}, 1200);
		return () => {
			if (feedbackAutoSaveTimer) clearTimeout(feedbackAutoSaveTimer);
		};
	});

	async function persistToServer() {
		const pid = project?.id;
		if (!pid || !browser) return;
		await tick();
		const ok = await saveReviewStateWithPayloads(
			pid,
			JSON.stringify(exportTestingStateForPersistence()),
			JSON.stringify(exportCodeReviewWorkspaceForPersistence())
		);
		if (ok) pushToast('Synced to server — admins see this on the project overview.');
		else pushToast('Could not sync — use Save in the batch card when you can.');
	}

	async function submitSandra(categoryId: string) {
		if (pendingSandraCategoryId === categoryId) return;
		const r = app.sandraRatings.find((x) => x.categoryId === categoryId);
		if (!r || r.score === null) return;
		pendingSandraCategoryId = categoryId;
		try {
			setSandraRating(categoryId, r.score, r.comment);
			await persistToServer();
		} finally {
			if (pendingSandraCategoryId === categoryId) pendingSandraCategoryId = null;
		}
	}

	async function submitReviewer(reviewer: 'jane' | 'joe', key: 'readableCode' | 'codeComments' | 'crossReviewer') {
		if (pendingReviewerKey === key) return;
		const b = app.reviewerRatings[reviewer][key];
		if (b.score === null) return;
		pendingReviewerKey = key;
		try {
			setReviewerRating(reviewer, key, b.score, b.comment);
			await persistToServer();
		} finally {
			if (pendingReviewerKey === key) pendingReviewerKey = null;
		}
	}
</script>

<div class="space-y-10">
	<h2 class="text-xl font-semibold text-kood-text">360° feedback</h2>
	<p class="text-sm text-kood-muted">
		{sandraName} rates reviewers on the categories they owned. Reviewers rate {sandraName}'s code traits and
		cross-review awareness. Scores are mocked into profiles, XP, and training nudges.
	</p>
	{#if project?.id}
		<p class="text-[11px] text-kood-muted/90">
			Linked project: scores and comments save automatically within a second or two. Use <strong class="text-kood-text/80"
				>Submit</strong
			> on each card when you are finished — that locks the row. Admins see synced drafts and submitted rows.
		</p>
	{/if}

	{#if app.role === 'sandra'}
		<section class="space-y-4">
			<h3 class="text-lg font-medium text-kood-text">Rate reviewers (1 = low, 5 = high)</h3>
			<p class="text-xs text-kood-muted">
				Drag the bar or tap <strong class="font-medium text-kood-text/90">0–5</strong> under it —
				<strong class="font-medium text-kood-text/90">0</strong> is unset. Drafts stay visible while autosave
				runs; 1–5 are saved to the project.
			</p>
			<div class="grid gap-4 md:grid-cols-2">
				{#each CATEGORIES as cat (cat.id)}
					{@const rating = app.sandraRatings.find((x) => x.categoryId === cat.id)}
					{#if rating}
						<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
							<p class="text-sm font-medium text-kood-text">{cat.title}</p>
							<p class="text-xs text-kood-muted">
								Reviewer: {getPersonaDisplayLabel(cat.assignee === 'jane' ? 'jane' : 'joe')}
							</p>
							<label class="mt-3 block text-xs text-kood-muted" for="sc-{cat.id}">Score</label>
							<ScoreSliderWithTicks
								class="mt-2"
								id="sc-{cat.id}"
								disabled={rating.submitted}
								score={rating.score}
								onChange={(next) => patchSandraRatingDraft(cat.id, { score: next })}
							/>
							<p class="mt-1 text-[10px] text-kood-muted">0 = unset · 1–5 = rubric score</p>
							<label class="mt-2 block text-xs text-kood-muted" for="tx-{cat.id}">Comment (optional)</label>
							<textarea
								id="tx-{cat.id}"
								rows="2"
								class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
								disabled={rating.submitted}
								value={rating.comment}
								oninput={(e) =>
									patchSandraRatingDraft(cat.id, {
										comment: (e.currentTarget as HTMLTextAreaElement).value
									})}
							></textarea>
							{#if rating.submitted}
								<p class="mt-2 text-xs text-kood-accent">Submitted</p>
							{:else}
								<button
									type="button"
									class="mt-3 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground disabled:opacity-40"
									disabled={pendingSandraCategoryId === cat.id}
									onclick={() => submitSandra(cat.id)}>Submit</button
								>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</section>
	{:else if reviewerBlock && reviewerRole}
		<section class="space-y-4">
			<h3 class="text-lg font-medium text-kood-text">
				{getPersonaDisplayLabel(reviewerRole)} — rate {sandraName} & cross-reviewer
			</h3>
			<p class="text-sm text-kood-muted">
				Scale for cross input: 1 = No cross input · 3 = Minor · 5 = Constructive cross input on areas you did
				not own.
			</p>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
					<p class="text-sm font-medium text-kood-text">{sandraName} — structure &amp; architecture</p>
					<ScoreSliderWithTicks
						class="mt-2"
						disabled={reviewerBlock.readableCode.submitted}
						score={reviewerBlock.readableCode.score}
						onChange={(next) =>
							patchReviewerRatingDraft(reviewerRole, 'readableCode', { score: next })}
					/>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.readableCode.submitted}
						value={reviewerBlock.readableCode.comment}
						oninput={(e) =>
							patchReviewerRatingDraft(reviewerRole, 'readableCode', {
								comment: (e.currentTarget as HTMLTextAreaElement).value
							})}
					></textarea>
					{#if !reviewerBlock.readableCode.submitted}
						<button
							type="button"
							class="mt-2 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground disabled:opacity-40"
							disabled={pendingReviewerKey === 'readableCode'}
							onclick={() => submitReviewer(reviewerRole, 'readableCode')}>Submit</button
						>
					{:else}
						<p class="mt-2 text-xs text-kood-accent">Submitted</p>
					{/if}
				</div>

				<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
					<p class="text-sm font-medium text-kood-text">{sandraName} — performance</p>
					<ScoreSliderWithTicks
						class="mt-2"
						disabled={reviewerBlock.codeComments.submitted}
						score={reviewerBlock.codeComments.score}
						onChange={(next) =>
							patchReviewerRatingDraft(reviewerRole, 'codeComments', { score: next })}
					/>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.codeComments.submitted}
						value={reviewerBlock.codeComments.comment}
						oninput={(e) =>
							patchReviewerRatingDraft(reviewerRole, 'codeComments', {
								comment: (e.currentTarget as HTMLTextAreaElement).value
							})}
					></textarea>
					{#if !reviewerBlock.codeComments.submitted}
						<button
							type="button"
							class="mt-2 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground disabled:opacity-40"
							disabled={pendingReviewerKey === 'codeComments'}
							onclick={() => submitReviewer(reviewerRole, 'codeComments')}>Submit</button
						>
					{:else}
						<p class="mt-2 text-xs text-kood-accent">Submitted</p>
					{/if}
				</div>

				<div class="rounded-xl border border-kood-border bg-kood-surface p-4 md:col-span-2">
					<p class="text-sm font-medium text-kood-text">
						Cross reviewer ({getPersonaDisplayLabel(peerRole)}) — awareness in your categories
					</p>
					<p class="text-xs text-kood-muted">
						{app.role === 'joe'
							? `Did ${getPersonaDisplayLabel('jane')} raise relevant questions in security / correctness?`
							: `Did ${getPersonaDisplayLabel('joe')} raise relevant questions in performance / structure & architecture?`}
					</p>
					<ScoreSliderWithTicks
						class="mt-2 max-w-md"
						disabled={reviewerBlock.crossReviewer.submitted}
						score={reviewerBlock.crossReviewer.score}
						onChange={(next) =>
							patchReviewerRatingDraft(reviewerRole, 'crossReviewer', { score: next })}
					/>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.crossReviewer.submitted}
						value={reviewerBlock.crossReviewer.comment}
						oninput={(e) =>
							patchReviewerRatingDraft(reviewerRole, 'crossReviewer', {
								comment: (e.currentTarget as HTMLTextAreaElement).value
							})}
					></textarea>
					{#if !reviewerBlock.crossReviewer.submitted}
						<button
							type="button"
							class="mt-2 rounded-lg bg-kood-accent px-3 py-1.5 text-xs font-bold text-kood-accent-foreground disabled:opacity-40"
							disabled={pendingReviewerKey === 'crossReviewer'}
							onclick={() => submitReviewer(reviewerRole, 'crossReviewer')}>Submit</button
						>
					{:else}
						<p class="mt-2 text-xs text-kood-accent">Submitted</p>
					{/if}
				</div>
			</div>

			<p class="text-xs text-kood-muted">{app.leaderboardNote} Current mock XP: {app.xpMock}</p>
		</section>
	{/if}
</div>
