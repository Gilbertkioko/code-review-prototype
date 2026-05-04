<script lang="ts">
	import { CATEGORIES } from '$lib/constants';
	import { academyModalOpen, academyModalCategory } from '$lib/stores';
	import {
		acceptReviewerAssignment,
		categoryAssignee,
		getApp,
		getPersonaDisplayLabel
	} from '$lib/appState.svelte';

	const app = getApp();

	const role = $derived(app.role === 'jane' || app.role === 'joe' ? app.role : 'jane');
	const displayName = $derived(getPersonaDisplayLabel(role));
	const peerName = $derived(role === 'jane' ? getPersonaDisplayLabel('joe') : getPersonaDisplayLabel('jane'));
	const submitterName = $derived(getPersonaDisplayLabel('sandra'));

	const myCategories = $derived(CATEGORIES.filter((c) => categoryAssignee(c.id) === role));

	let agreed = $state(false);

	const canContinue = $derived(agreed);

	async function onConfirm() {
		if (!canContinue) return;
		await acceptReviewerAssignment(role);
	}
</script>

<div class="mx-auto w-full max-w-5xl">
	<div class="overflow-hidden rounded-xl border border-kood-border bg-kood-surface">
		<div
			class="flex items-center gap-2 border-b border-kood-accent/25 bg-kood-accent/10 px-4 py-3"
			role="status"
		>
			<span class="h-2 w-2 shrink-0 rounded-full bg-kood-accent ring-2 ring-kood-accent/30"></span>
			<span class="text-sm font-semibold text-kood-text">Assignment · Beachside Racetrack</span>
		</div>

		<div class="space-y-6 p-6">
			<header>
				<p class="text-xs font-semibold uppercase tracking-wide text-kood-accent">Reviewer</p>
				<h2 class="mt-1 text-xl font-semibold text-kood-text">
					{displayName}, you’ve been assigned to review this project
				</h2>
				<p class="mt-2 text-sm text-kood-muted">
					{submitterName} is the submitter on this batch. Below are <strong class="text-kood-text/90">your</strong>
					categories and how to show up for them. {peerName} has a parallel assignment — you’ll each drive different boards
					during the code review sprint.
				</p>
			</header>

			<section>
				<h3 class="text-sm font-semibold text-kood-text">Your categories</h3>
				<p class="mt-1 text-xs text-kood-muted">
					Only you Accept / Decline on these; the other reviewer sees them read-only. Each line links to the matching
					module in Review Academy if you want a refresher.
				</p>
				<ul class="mt-3 space-y-3">
					{#each myCategories as c (c.id)}
						<li class="rounded-lg border border-kood-border bg-kood-bg/50 px-3 py-3 text-sm">
							<p class="font-medium text-kood-text">{c.title}</p>
							<p class="mt-1 text-xs leading-relaxed text-kood-muted">{c.assignmentBlurb}</p>
							<button
								class="mt-2 inline-flex text-xs font-medium text-kood-accent underline-offset-2 hover:underline"
								onclick={() => {
									academyModalCategory.set(c.id);
									academyModalOpen.set(true);
								}}
								>Open in Review Academy →</button
							>
						</li>
					{/each}
				</ul>
				<p class="mt-3 text-xs text-kood-muted">
					Need the whole school, not just one topic?
					<button
						class="font-medium text-kood-accent underline-offset-2 hover:underline"
						onclick={() => {
							academyModalCategory.set('security');
							academyModalOpen.set(true);
						}}
						>Review Academy home</button
					>
				</p>
			</section>

			<section class="rounded-xl border border-kood-accent/20 bg-kood-accent/5 p-4">
				<h3 class="text-sm font-semibold text-kood-text">Feedback tone</h3>
				<p class="mt-2 text-sm leading-relaxed text-kood-muted">
					Comments and verdicts should help {submitterName} ship a better version: name the problem, why it matters, and
					what you’d change. Keep the focus on the implementation, not on judging {submitterName} personally.
				</p>
				<ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-kood-text/90">
					<li>
						<strong class="text-kood-text">Comment on the work.</strong> Describe what you saw in the code and the
						effect it has (behaviour, security, maintainability). 
						
					</li>
					<li>
						<strong class="text-kood-text">Be specific.</strong> Reference files, functions, or flows so
						{submitterName} can find the same spot and know what to fix.
					</li>
					<li>
						<strong class="text-kood-text">Ground it in substance.</strong>Declines and thread notes read as actionable requests, not venting.
					</li>
					<li>
						<strong class="text-kood-text">Pause if you’re under pressure.</strong> Short, factual feedback is easier to
						use than a message sent in a hurry or while frustrated.
					</li>
				</ul>
			</section>

			<section class="rounded-lg border border-kood-border bg-kood-bg/30 p-4 text-sm text-kood-muted">
				<h3 class="text-sm font-semibold text-kood-text">Your responsibilities ({displayName})</h3>
				<ul class="mt-2 list-disc space-y-2 pl-5">
					{#if role === 'jane'}
						<li>Own <strong class="text-kood-text/90">Security</strong> and <strong class="text-kood-text/90">Correctness</strong> boards: fair, evidence-based checks.</li>
						<li>Use <strong class="text-kood-text/90">Decline</strong> plus the thread when something must change—clear, actionable, linked to what you saw.</li>
						<li>In <strong class="text-kood-text/90">testing</strong>, Accept/Decline only on <strong class="text-kood-text/90">your</strong> mandatory rows (split with your peer); comment anywhere.</li>
						<li>In <strong class="text-kood-text/90">standup</strong>, walk through your categories first, then join cross-review with curiosity.</li>
					{:else}
						<li>Own <strong class="text-kood-text/90">Performance</strong> and <strong class="text-kood-text/90">Structure &amp; architecture</strong> boards: scaling and maintainability, not micro-optimisation theatre.</li>
						<li>Use <strong class="text-kood-text/90">Decline</strong> plus the thread when something must change—clear, actionable, linked to what you saw.</li>
						<li>In <strong class="text-kood-text/90">testing</strong>, Accept/Decline only on <strong class="text-kood-text/90">your</strong> mandatory rows (split with your peer); comment anywhere.</li>
						<li>In <strong class="text-kood-text/90">standup</strong>, walk through your categories first, then join cross-review with curiosity.</li>
					{/if}
				</ul>
			</section>


			<div class="border-t border-kood-border pt-4">
				<label class="flex cursor-pointer items-start gap-3 text-sm text-kood-text/90">
					<input
						type="checkbox"
						class="mt-1 h-4 w-4 shrink-0 rounded border-kood-border bg-kood-surface-raised text-kood-accent focus:ring-kood-accent"
						bind:checked={agreed}
					/>
					<span>I understand my assignment and responsibilities, and I will start reviewing.</span>
				</label>
				<button
					type="button"
					class="mt-4 rounded-full bg-kood-accent px-6 py-2.5 text-sm font-bold text-kood-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
					disabled={!canContinue}
					onclick={onConfirm}>Confirm and continue</button
				>
			</div>
		</div>
	</div>
</div>
