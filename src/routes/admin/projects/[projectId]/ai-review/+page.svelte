<script lang="ts">
	let { data } = $props();

	const ai = $derived(data.aiReview);
	const completedAt = $derived(ai?.completedAt ? new Date(ai.completedAt).toLocaleString() : '—');
	const linkedAt = $derived(ai?.linkedAt ? new Date(ai.linkedAt).toLocaleString() : '—');
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — AI review — Admin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 pb-12">
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

	<header class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
		<h1 class="text-lg font-semibold text-kood-text">AI code review</h1>
		{#if !ai}
			<p class="mt-2 text-sm text-kood-muted">No AI review is linked to this project yet.</p>
		{:else}
			<div class="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Status</p>
					<p class="mt-1 font-semibold text-kood-text">{ai.status}</p>
					{#if ai.jobAttemptCount && ai.jobMaxAttempts}
						<p class="mt-1 text-[11px] text-kood-muted">Attempt {ai.jobAttemptCount}/{ai.jobMaxAttempts}</p>
					{/if}
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Model</p>
					<p class="mt-1 font-mono text-kood-text/95">{ai.model}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Prompt version</p>
					<p class="mt-1 font-mono text-kood-text/95">{ai.promptVersion}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Completed</p>
					<p class="mt-1 text-kood-text/95">{completedAt}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Linked to project</p>
					<p class="mt-1 text-kood-text/95">{linkedAt}</p>
				</div>
				<div class="rounded-lg border border-kood-border/60 bg-kood-bg/30 p-3">
					<p class="text-kood-muted">Cache reuse</p>
					<p class="mt-1 text-kood-text/95">{ai.reusedAcrossProjects ? 'Reused existing review' : 'Fresh review'}</p>
				</div>
			</div>
		{/if}
	</header>

	{#if ai?.status === 'failed'}
		<section class="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-100">
			<p class="font-semibold">AI review failed</p>
			<p class="mt-2 whitespace-pre-wrap break-words">{ai.jobLastError ?? ai.error ?? 'Unknown error'}</p>

			<form method="post" action="?/retryAiReview" class="mt-3">
				<button
					type="submit"
					class="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/20"
				>
					Retry AI review
				</button>
			</form>
		</section>
	{/if}

	{#if ai?.result}
		<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Overall summary</h2>
			<p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-kood-text/95">{ai.result.overall_summary}</p>
		</section>

		<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Functional testing</h2>
			<div class="mt-3 space-y-3">
				{#each ai.result.functional_testing as row (row.question_id)}
					<div class="rounded-lg border border-kood-border/60 bg-kood-bg/25 p-3">
						<p class="text-xs text-kood-muted">{row.question_id}</p>
						<p class="mt-1 text-sm font-medium text-kood-text">{row.question}</p>
						<p class="mt-1 text-xs text-kood-muted">Verdict: <span class="font-semibold text-kood-text/90">{row.verdict}</span></p>
						<p class="mt-2 whitespace-pre-wrap text-sm text-kood-text/90">{row.evidence}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Code review findings</h2>
			<div class="mt-3 space-y-3">
				{#each ai.result.code_review as row (row.question_id)}
					<div class="rounded-lg border border-kood-border/60 bg-kood-bg/25 p-3">
						<p class="text-xs text-kood-muted">
							{row.question_id} · verdict {row.verdict} · severity {row.severity}
						</p>
						<p class="mt-1 text-sm font-medium text-kood-text">{row.question}</p>
						<p class="mt-2 text-sm text-kood-text/90"><strong>Finding:</strong> {row.finding}</p>
						<p class="mt-1 whitespace-pre-wrap text-sm text-kood-text/90"><strong>Evidence:</strong> {row.evidence}</p>
						<p class="mt-1 whitespace-pre-wrap text-sm text-kood-text/90"><strong>Recommendation:</strong> {row.recommendation}</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="grid gap-4 lg:grid-cols-2">
			<div class="rounded-xl border border-kood-border bg-kood-surface/80 p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Key risks</h2>
				<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-kood-text/95">
					{#each ai.result.key_risks as risk, i (`risk-${i}`)}
						<li>{risk}</li>
					{/each}
				</ul>
			</div>
			<div class="rounded-xl border border-kood-border bg-kood-surface/80 p-5">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Action items</h2>
				<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-kood-text/95">
					{#each ai.result.action_items as item, i (`action-${i}`)}
						<li>{item}</li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}
</div>
