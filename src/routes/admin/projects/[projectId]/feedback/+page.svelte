<script lang="ts">
	import { CATEGORIES } from '$lib/constants';
	import type { ReviewerRatingSet } from '$lib/types';

	let { data } = $props();

	const fb = $derived(data.feedback360Snapshot);

	const reviewer360Dims: { key: keyof ReviewerRatingSet; title: string }[] = [
		{ key: 'readableCode', title: 'Structure & architecture' },
		{ key: 'codeComments', title: 'Performance' },
		{ key: 'crossReviewer', title: 'Cross-reviewer awareness' }
	];
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — 360° — Admin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 pb-12">
	<p class="text-xs text-kood-muted">
		<a href="/admin" class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
			>← Admin</a
		>
		<span class="mx-2 text-kood-border/60">/</span>
		<a
			href="/admin/projects/{data.project.id}"
			class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
			>{data.projectDisplayTitle}</a
		>
	</p>

	<h1 class="text-lg font-semibold text-kood-text">360° feedback</h1>

	{#if !fb}
		<p class="text-sm text-kood-muted">No 360° block in the saved workspace yet.</p>
	{:else}
		<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
			<div class="space-y-3">
				<p class="text-xs font-medium text-kood-muted">Submitter → reviewers (by category)</p>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each CATEGORIES as cat (cat.id)}
						{@const row = fb.sandraRatings.find((r) => r.categoryId === cat.id)}
						{#if row}
							<div class="rounded-xl border border-kood-border/60 bg-kood-bg/25 px-3 py-2 text-xs">
								<p class="font-medium text-kood-text/90">{cat.title}</p>
								<p class="mt-0.5 text-kood-muted">
									Reviewer: {cat.assignee === 'jane' ? data.reviewerAName : data.reviewerBName}
								</p>
								<p class="mt-1 text-kood-text/90">
									Score: <span class="font-mono">{row.score ?? '—'}</span>
									{#if row.submitted}
										<span class="ml-2 text-xs text-kood-muted">Submitted</span>
									{/if}
								</p>
								{#if row.comment.trim()}
									<p class="mt-1 whitespace-pre-wrap text-kood-muted">{row.comment}</p>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<div class="mt-8 grid gap-6 md:grid-cols-2">
				<div class="space-y-3">
					<p class="text-xs font-medium text-kood-muted">Reviewer A ({data.reviewerAName})</p>
					{#each reviewer360Dims as dim (`jane-${dim.key}`)}
						{@const block = fb.reviewerRatings.jane[dim.key]}
						<div class="rounded-xl border border-kood-border/60 bg-kood-bg/25 px-3 py-2 text-xs">
							<p class="font-medium text-kood-text/90">{dim.title}</p>
							<p class="mt-0.5 text-kood-text/90">
								Score: <span class="font-mono">{block.score ?? '—'}</span>
								{#if block.submitted}<span class="ml-2 text-xs text-kood-muted">Submitted</span>{/if}
							</p>
							{#if block.comment.trim()}
								<p class="mt-1 whitespace-pre-wrap text-kood-muted">{block.comment}</p>
							{/if}
						</div>
					{/each}
				</div>
				<div class="space-y-3">
					<p class="text-xs font-medium text-kood-muted">Reviewer B ({data.reviewerBName})</p>
					{#each reviewer360Dims as dim (`joe-${dim.key}`)}
						{@const block = fb.reviewerRatings.joe[dim.key]}
						<div class="rounded-xl border border-kood-border/60 bg-kood-bg/25 px-3 py-2 text-xs">
							<p class="font-medium text-kood-text/90">{dim.title}</p>
							<p class="mt-0.5 text-kood-text/90">
								Score: <span class="font-mono">{block.score ?? '—'}</span>
								{#if block.submitted}<span class="ml-2 text-xs text-kood-muted">Submitted</span>{/if}
							</p>
							{#if block.comment.trim()}
								<p class="mt-1 whitespace-pre-wrap text-kood-muted">{block.comment}</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</div>
