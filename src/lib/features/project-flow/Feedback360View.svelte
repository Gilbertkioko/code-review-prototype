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

	type Proj = { id: string; status: string };

	let { project = null }: { project?: Proj | null } = $props();

	const app = getApp();
	const sandraName = $derived(getPersonaDisplayLabel('sandra'));
	const peerRole = $derived<'jane' | 'joe'>(app.role === 'joe' ? 'jane' : 'joe');

	const reviewerBlock = $derived(
		app.role === 'jane' || app.role === 'joe' ? app.reviewerRatings[app.role] : null
	);
	const reviewerRole = $derived(app.role === 'jane' || app.role === 'joe' ? app.role : null);

	let saving = $state(false);

	function parseScore(v: string): number | null {
		if (v === '') return null;
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}

	async function persistToServer() {
		const pid = project?.id;
		if (!pid || !browser) return;
		await tick();
		saving = true;
		const ok = await saveReviewStateWithPayloads(
			pid,
			JSON.stringify(exportTestingStateForPersistence()),
			JSON.stringify(exportCodeReviewWorkspaceForPersistence())
		);
		saving = false;
		if (ok) pushToast('Synced to server — admins see this on the project overview.');
		else pushToast('Could not sync — use “Server sync” in the workspace strip when you can.');
	}

	async function submitSandra(categoryId: string) {
		const r = app.sandraRatings.find((x) => x.categoryId === categoryId);
		if (!r || r.score === null) return;
		setSandraRating(categoryId, r.score, r.comment);
		await persistToServer();
	}

	async function submitReviewer(reviewer: 'jane' | 'joe', key: 'readableCode' | 'codeComments' | 'crossReviewer') {
		const b = app.reviewerRatings[reviewer][key];
		if (b.score === null) return;
		setReviewerRating(reviewer, key, b.score, b.comment);
		await persistToServer();
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
			Linked project: submissions sync to the server so admins can read them on the dashboard.
		</p>
	{/if}

	{#if app.role === 'sandra'}
		<section class="space-y-4">
			<h3 class="text-lg font-medium text-kood-text">Rate reviewers (1 = Bad, 5 = Good)</h3>
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
							<select
								id="sc-{cat.id}"
								class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
								disabled={rating.submitted || saving}
								value={rating.score === null ? '' : String(rating.score)}
								onchange={(e) =>
									patchSandraRatingDraft(cat.id, {
										score: parseScore((e.currentTarget as HTMLSelectElement).value)
									})}
							>
								<option value="">Choose…</option>
								{#each [1, 2, 3, 4, 5] as n (n)}
									<option value={n}>{n}</option>
								{/each}
							</select>
							<label class="mt-2 block text-xs text-kood-muted" for="tx-{cat.id}">Comment</label>
							<textarea
								id="tx-{cat.id}"
								rows="2"
								class="mt-1 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
								disabled={rating.submitted || saving}
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
									disabled={saving}
									onclick={() => submitSandra(cat.id)}>Submit</button
								>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
			<div class="rounded-xl border border-kood-border bg-kood-surface p-4 text-sm text-kood-muted">
				<p class="font-medium text-kood-text/90">Profile hints (mock)</p>
				<p class="mt-1">{trainingBlurbFor('jane')}</p>
				<p class="mt-1">{trainingBlurbFor('joe')}</p>
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
					<select
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
						disabled={reviewerBlock.readableCode.submitted || saving}
						value={reviewerBlock.readableCode.score === null
							? ''
							: String(reviewerBlock.readableCode.score)}
						onchange={(e) =>
							patchReviewerRatingDraft(reviewerRole, 'readableCode', {
								score: parseScore((e.currentTarget as HTMLSelectElement).value)
							})}
					>
						<option value="">Score…</option>
						{#each [1, 2, 3, 4, 5] as n (n)}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.readableCode.submitted || saving}
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
							disabled={saving}
							onclick={() => submitReviewer(reviewerRole, 'readableCode')}>Submit</button
						>
					{:else}
						<p class="mt-2 text-xs text-kood-accent">Submitted</p>
					{/if}
				</div>

				<div class="rounded-xl border border-kood-border bg-kood-surface p-4">
					<p class="text-sm font-medium text-kood-text">{sandraName} — performance</p>
					<select
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
						disabled={reviewerBlock.codeComments.submitted || saving}
						value={reviewerBlock.codeComments.score === null
							? ''
							: String(reviewerBlock.codeComments.score)}
						onchange={(e) =>
							patchReviewerRatingDraft(reviewerRole, 'codeComments', {
								score: parseScore((e.currentTarget as HTMLSelectElement).value)
							})}
					>
						<option value="">Score…</option>
						{#each [1, 2, 3, 4, 5] as n (n)}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.codeComments.submitted || saving}
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
							disabled={saving}
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
					<select
						class="mt-2 w-full max-w-xs rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text disabled:opacity-50"
						disabled={reviewerBlock.crossReviewer.submitted || saving}
						value={reviewerBlock.crossReviewer.score === null
							? ''
							: String(reviewerBlock.crossReviewer.score)}
						onchange={(e) =>
							patchReviewerRatingDraft(reviewerRole, 'crossReviewer', {
								score: parseScore((e.currentTarget as HTMLSelectElement).value)
							})}
					>
						<option value="">Score…</option>
						{#each [1, 2, 3, 4, 5] as n (n)}
							<option value={n}>{n}</option>
						{/each}
					</select>
					<textarea
						rows="2"
						class="mt-2 w-full rounded-lg border border-kood-border bg-kood-bg px-2 py-2 text-sm text-kood-text"
						disabled={reviewerBlock.crossReviewer.submitted || saving}
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
							disabled={saving}
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
