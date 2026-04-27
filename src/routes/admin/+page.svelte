<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const awaitingRepo = $derived(data.sidebarProjects.filter((p) => p.status === 'awaiting_link').length);
	const needsPair = $derived(data.pairable.length);
	const inReview = $derived(
		data.sidebarProjects.filter((p) => p.status === 'review_active').length
	);
	const done = $derived(data.completed.length);
	const totalProjects = $derived(data.sidebarProjects.length);
</script>

<svelte:head>
	<title>Admin — //kood</title>
</svelte:head>

<div class="pb-16">
	<div class="mx-auto max-w-5xl space-y-10">
		<header class="rounded-xl border border-kood-border bg-kood-surface/80 p-6 md:p-8">
			<div class="flex flex-wrap items-baseline justify-between gap-3">
				<h1 class="text-2xl font-semibold tracking-tight text-kood-text md:text-3xl">Admin</h1>
				{#if totalProjects > 0}
					<p class="text-sm text-kood-muted"><span class="tabular-nums text-kood-text">{totalProjects}</span> projects</p>
				{/if}
			</div>
			<p class="mt-2 text-sm text-kood-muted">
				Pair reviewers on submitted repos; open a project in the sidebar for audit. User accounts: <a
					class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/50"
					href="/admin/users">Users</a
				>.
			</p>

			<div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-lg border border-kood-border/80 bg-kood-bg/30 p-4">
					<p class="text-xs font-medium uppercase tracking-wide text-kood-muted">Awaiting repo</p>
					<p class="mt-1 text-2xl font-semibold tabular-nums text-kood-text">{awaitingRepo}</p>
				</div>
				<div class="rounded-lg border border-kood-border/80 bg-kood-bg/30 p-4">
					<p class="text-xs font-medium uppercase tracking-wide text-kood-muted">Needs pair</p>
					<p class="mt-1 text-2xl font-semibold tabular-nums text-kood-text">{needsPair}</p>
				</div>
				<div class="rounded-lg border border-kood-border/80 bg-kood-bg/30 p-4">
					<p class="text-xs font-medium uppercase tracking-wide text-kood-muted">In review</p>
					<p class="mt-1 text-2xl font-semibold tabular-nums text-kood-text">{inReview}</p>
				</div>
				<div class="rounded-lg border border-kood-border/80 bg-kood-bg/30 p-4">
					<p class="text-xs font-medium uppercase tracking-wide text-kood-muted">Completed</p>
					<p class="mt-1 text-2xl font-semibold tabular-nums text-kood-text">{done}</p>
				</div>
			</div>
		</header>

		<div class="mx-auto max-w-3xl">
			<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-6 md:p-8">
				<h2 class="border-b border-kood-border/50 pb-3 text-sm font-semibold text-kood-text">Pair reviewers</h2>

				<form method="post" action="?/assignPair" class="mt-6 space-y-5" use:enhance>
					<div>
						<label class="text-xs font-bold uppercase tracking-wide text-kood-muted" for="projectId">Project</label>
						<select
							id="projectId"
							name="projectId"
							required
							class="mt-2 w-full rounded-xl border border-kood-border bg-kood-bg px-4 py-3 text-sm text-kood-text shadow-inner transition focus:border-kood-accent/50 focus:outline-none focus:ring-2 focus:ring-kood-accent/20"
						>
							<option value="" disabled selected>Select project…</option>
							{#each data.pairable as p (p.id)}
								<option value={p.id}>
									{p.displayTitle} — Submitter: {p.submitterUsername}
								</option>
							{/each}
						</select>
						{#if data.pairable.length === 0}
							<p class="mt-2 text-xs text-kood-muted/85">No projects waiting for a pair.</p>
						{/if}
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label class="text-xs font-bold uppercase tracking-wide text-kood-muted" for="reviewerAId"
								>Reviewer A</label
							>
							<select
								id="reviewerAId"
								name="reviewerAId"
								required
								class="mt-2 w-full rounded-xl border border-kood-border bg-kood-bg px-4 py-3 text-sm text-kood-text focus:border-kood-accent/50 focus:outline-none focus:ring-2 focus:ring-kood-accent/20"
							>
								<option value="" disabled selected>Slot 1…</option>
								{#each data.reviewers as r (r.id)}
									<option value={r.id}>{r.username}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="text-xs font-bold uppercase tracking-wide text-kood-muted" for="reviewerBId"
								>Reviewer B</label
							>
							<select
								id="reviewerBId"
								name="reviewerBId"
								required
								class="mt-2 w-full rounded-xl border border-kood-border bg-kood-bg px-4 py-3 text-sm text-kood-text focus:border-kood-accent/50 focus:outline-none focus:ring-2 focus:ring-kood-accent/20"
							>
								<option value="" disabled selected>Slot 2…</option>
								{#each data.reviewers as r (r.id)}
									<option value={r.id}>{r.username}</option>
								{/each}
							</select>
						</div>
					</div>
					<button
						type="submit"
						class="w-full rounded-lg border border-kood-border bg-kood-text px-5 py-2.5 text-sm font-semibold text-kood-bg transition hover:opacity-90 sm:w-auto"
					>
						Create pair &amp; activate review
					</button>
				</form>
			</section>
		</div>

		<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-6 md:p-8">
			<h2 class="border-b border-kood-border/50 pb-3 text-sm font-semibold text-kood-text">Active projects</h2>
			<ul class="mt-6 grid gap-4 sm:grid-cols-2">
				{#each data.active as p (p.id)}
					<li class="flex flex-col rounded-lg border border-kood-border/70 bg-kood-bg/25 p-4">
						<p class="text-base font-semibold leading-snug text-kood-text">{p.displayTitle}</p>
						<p class="mt-2 text-xs text-kood-muted">
							<span class="text-kood-muted">Submitter</span>
							<span class="ml-1 font-mono text-kood-text/90">{p.submitterUsername}</span>
						</p>
						<p class="mt-2 text-xs text-kood-muted">
							<span class="font-mono text-[11px] text-kood-text/80">{p.status}</span>
						</p>
						{#if p.giteaUrl}
							<a
								class="mt-2 truncate text-xs text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
								href={p.giteaUrl}
								target="_blank"
								rel="noreferrer">{p.giteaUrl}</a
							>
						{/if}
						{#if p.reviewerAUsername || p.reviewerBUsername}
							<p class="mt-2 text-[11px] text-kood-muted">
								<span class="text-kood-text/80">Reviewers</span>
								<span class="ml-1">A {p.reviewerAUsername ?? '—'}</span>
								<span class="mx-1.5 text-kood-border/70">·</span>
								<span>B {p.reviewerBUsername ?? '—'}</span>
							</p>
						{/if}
						<div class="mt-4 flex flex-wrap gap-2 border-t border-kood-border/40 pt-3">
							<a
								class="inline-flex items-center rounded-lg border border-kood-border bg-kood-surface px-3 py-1.5 text-xs font-medium text-kood-text hover:bg-kood-surface-raised"
								href="/admin/projects/{p.id}">Open audit</a
							>
							{#if p.status === 'review_active'}
								<form method="post" action="?/markComplete" class="inline">
									<input type="hidden" name="projectId" value={p.id} />
									<button
										type="submit"
										class="rounded-xl border border-kood-border bg-kood-surface/50 px-4 py-2 text-xs font-medium text-kood-muted transition hover:border-kood-text/25 hover:text-kood-text"
									>
										Mark completed
									</button>
								</form>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
			{#if data.active.length === 0}
				<p class="mt-6 text-center text-sm text-kood-muted">No active projects.</p>
			{/if}
		</section>

		<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-6 md:p-8">
			<h2 class="border-b border-kood-border/50 pb-3 text-sm font-semibold text-kood-text">Completed</h2>
			<ul class="mt-5 divide-y divide-kood-border/40 rounded-lg border border-kood-border/60 bg-kood-bg/20">
				{#each data.completed as p (p.id)}
					<li class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
						<div class="min-w-0">
							<p class="truncate font-medium text-kood-text">{p.displayTitle}</p>
							<p class="mt-0.5 text-xs text-kood-muted">
								<span class="text-kood-muted">Submitter</span>
								<span class="ml-1 font-mono text-kood-text/90">{p.submitterUsername}</span>
							</p>
						</div>
						<a
							class="shrink-0 rounded-lg border border-kood-border px-3 py-1.5 text-xs font-medium text-kood-text hover:bg-kood-surface-raised"
							href="/admin/projects/{p.id}">View audit</a
						>
					</li>
				{/each}
			</ul>
			{#if data.completed.length === 0}
				<p class="mt-5 text-center text-sm text-kood-muted">No completed projects yet.</p>
			{/if}
		</section>

		<p class="text-center">
			<a href="/" class="text-sm text-kood-muted underline decoration-kood-border underline-offset-4 hover:text-kood-text"
				>← Workspace</a
			>
		</p>
	</div>
</div>
