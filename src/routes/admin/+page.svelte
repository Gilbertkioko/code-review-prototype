<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const reviewers = $derived(data.users.filter((u) => u.role === 'reviewer'));

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

<div class="relative pb-16">
	<div
		class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
		aria-hidden="true"
	>
		<div
			class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-kood-accent/[0.07] blur-3xl"
		></div>
		<div
			class="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-violet-500/[0.06] blur-3xl"
		></div>
		<div
			class="absolute bottom-0 right-1/4 h-48 w-96 rounded-full bg-emerald-500/[0.05] blur-3xl"
		></div>
	</div>

	<div class="mx-auto max-w-6xl space-y-12">
		<header
			class="relative overflow-hidden rounded-3xl border border-kood-accent/20 bg-gradient-to-br from-kood-surface via-kood-surface/95 to-kood-bg/50 p-8 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)] md:p-10"
		>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_50%)]"
				aria-hidden="true"
			></div>
			<div class="relative">
				<div class="flex flex-wrap items-center gap-3">
					<p
						class="rounded-full border border-kood-border/50 bg-kood-bg/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-kood-muted"
					>
						Operations
					</p>
					{#if totalProjects > 0}
						<p class="text-xs text-kood-muted">
							<span class="font-mono text-kood-text/90">{totalProjects}</span> projects in system
						</p>
					{/if}
				</div>
				<h1 class="mt-4 font-mono text-3xl font-semibold tracking-tight text-kood-text md:text-4xl">
					Admin dashboard
				</h1>
				<p class="mt-4 max-w-2xl text-base leading-relaxed text-kood-muted md:text-[1.05rem]">
					Pair reviewers, track batches by <strong class="font-medium text-kood-text/90">project name</strong> (from
					the repo or submitter notes), then open any row in the sidebar for live threads, standup, and 360°
					snapshots.
				</p>

				<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div
						class="group rounded-2xl border border-kood-border/50 bg-kood-bg/25 p-5 transition hover:border-kood-border hover:bg-kood-bg/40"
					>
						<p class="text-[11px] font-semibold uppercase tracking-wide text-kood-muted">Awaiting repo</p>
						<p class="mt-2 font-mono text-3xl font-semibold tabular-nums text-kood-text">{awaitingRepo}</p>
						<p class="mt-2 text-xs leading-snug text-kood-muted/80">No Gitea link yet</p>
					</div>
					<div
						class="group rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-5 transition hover:border-amber-400/35"
					>
						<p class="text-[11px] font-semibold uppercase tracking-wide text-amber-100/85">Needs reviewer pair</p>
						<p class="mt-2 font-mono text-3xl font-semibold tabular-nums text-kood-text">{needsPair}</p>
						<p class="mt-2 text-xs leading-snug text-kood-muted/85">Ready for you to assign A &amp; B</p>
					</div>
					<div
						class="group rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-5 transition hover:border-emerald-400/35"
					>
						<p class="text-[11px] font-semibold uppercase tracking-wide text-emerald-100/85">In review</p>
						<p class="mt-2 font-mono text-3xl font-semibold tabular-nums text-kood-text">{inReview}</p>
						<p class="mt-2 text-xs leading-snug text-kood-muted/85">Active sprint + sync</p>
					</div>
					<div
						class="group rounded-2xl border border-kood-border/50 bg-kood-surface-raised/20 p-5 transition hover:border-kood-border"
					>
						<p class="text-[11px] font-semibold uppercase tracking-wide text-kood-muted">Completed</p>
						<p class="mt-2 font-mono text-3xl font-semibold tabular-nums text-kood-text">{done}</p>
						<p class="mt-2 text-xs leading-snug text-kood-muted/80">Archived batches</p>
					</div>
				</div>
			</div>
		</header>

		<div class="grid gap-10 lg:grid-cols-2">
			<section
				class="rounded-3xl border border-kood-border/70 bg-kood-surface/70 p-6 shadow-sm backdrop-blur-sm md:p-8"
			>
				<div class="flex items-baseline justify-between gap-2 border-b border-kood-border/40 pb-4">
					<h2 class="text-xs font-bold uppercase tracking-[0.15em] text-kood-muted">Registered users</h2>
					<span class="rounded-full bg-kood-bg/50 px-2.5 py-0.5 font-mono text-xs text-kood-muted"
						>{data.users.length}</span
					>
				</div>
				<div class="mt-5 overflow-x-auto rounded-2xl border border-kood-border/60 bg-kood-bg/25">
					<table class="w-full min-w-[480px] text-left text-sm">
						<thead class="border-b border-kood-border/50 bg-kood-surface-raised/30 text-xs uppercase tracking-wide text-kood-muted">
							<tr>
								<th class="px-4 py-3 font-semibold">Username</th>
								<th class="px-4 py-3 font-semibold">Email</th>
								<th class="px-4 py-3 font-semibold">Role</th>
							</tr>
						</thead>
						<tbody>
							{#each data.users as u (u.id)}
								<tr class="border-b border-kood-border/30 last:border-0 transition hover:bg-kood-accent/[0.04]">
									<td class="px-4 py-3 font-mono text-xs font-medium text-kood-text">{u.username}</td>
									<td class="max-w-[200px] truncate px-4 py-3 text-xs text-kood-muted" title={u.email}
										>{u.email}</td
									>
									<td class="px-4 py-3 text-xs capitalize text-kood-text/90">{u.role}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>

			<section
				class="rounded-3xl border border-kood-border/70 bg-kood-surface/70 p-6 shadow-sm backdrop-blur-sm md:p-8"
			>
				<h2 class="border-b border-kood-border/40 pb-4 text-xs font-bold uppercase tracking-[0.15em] text-kood-muted">
					Pair reviewers → project
				</h2>
				<p class="mt-4 text-sm leading-relaxed text-kood-muted">
					Choose a project in <strong class="font-medium text-kood-text/90">repo_submitted</strong> and two reviewers.
					<strong class="font-medium text-kood-text/90">Server sync</strong> pushes threads into SQL for auditing.
				</p>

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
								{#each reviewers as r (r.id)}
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
								{#each reviewers as r (r.id)}
									<option value={r.id}>{r.username}</option>
								{/each}
							</select>
						</div>
					</div>
					<button
						type="submit"
						class="w-full rounded-xl bg-kood-accent py-3.5 text-sm font-bold text-kood-accent-foreground shadow-lg shadow-kood-accent/10 transition hover:brightness-110 sm:w-auto sm:px-10"
					>
						Create pair &amp; activate review
					</button>
				</form>
			</section>
		</div>

		<section class="rounded-3xl border border-kood-border/70 bg-kood-surface/60 p-6 shadow-sm md:p-8">
			<div class="flex flex-col gap-2 border-b border-kood-border/40 pb-5 sm:flex-row sm:items-end sm:justify-between">
				<h2 class="text-xs font-bold uppercase tracking-[0.15em] text-kood-muted">Active &amp; in-flight</h2>
				<p class="max-w-xl text-xs leading-relaxed text-kood-muted">
					Not completed — includes awaiting link, repo submitted, and review active. Names match the sidebar.
				</p>
			</div>
			<ul class="mt-6 grid gap-4 sm:grid-cols-2">
				{#each data.active as p (p.id)}
					<li
						class="flex flex-col rounded-2xl border border-kood-border/60 bg-gradient-to-b from-kood-bg/40 to-kood-bg/10 p-5 transition hover:border-kood-accent/30 hover:shadow-md"
					>
						<p class="text-base font-semibold leading-snug text-kood-text">{p.displayTitle}</p>
						<p class="mt-2 text-xs text-kood-muted">
							<span class="font-semibold text-kood-muted/90">Submitter</span>
							<span class="ml-1 font-mono text-kood-text/95">{p.submitterUsername}</span>
						</p>
						<div class="mt-3 flex flex-wrap items-center gap-2">
							<span
								class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide {p.status ===
								'review_active'
									? 'bg-emerald-500/15 text-emerald-200'
									: p.status === 'repo_submitted'
										? 'bg-amber-500/15 text-amber-100'
										: 'bg-kood-surface-raised text-kood-muted'}">{p.status}</span
							>
						</div>
						{#if p.giteaUrl}
							<a
								class="mt-3 truncate text-xs text-kood-accent underline decoration-kood-accent/30"
								href={p.giteaUrl}
								target="_blank"
								rel="noreferrer">{p.giteaUrl}</a
							>
						{/if}
						{#if p.reviewerAUsername || p.reviewerBUsername}
							<p class="mt-3 text-[11px] text-kood-muted">
								<span class="font-medium text-kood-text/80">Reviewers</span>
								<span class="ml-1"><span class="text-kood-muted">A</span> {p.reviewerAUsername ?? '—'}</span>
								<span class="mx-1.5 text-kood-border/70">·</span>
								<span class="text-kood-muted">B</span>
								{p.reviewerBUsername ?? '—'}
							</p>
						{/if}
						<div class="mt-4 flex flex-wrap gap-2 border-t border-kood-border/30 pt-4">
							<a
								class="inline-flex items-center rounded-xl bg-kood-accent px-4 py-2 text-xs font-bold text-kood-accent-foreground shadow-sm transition hover:brightness-110"
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

		<section
			class="rounded-3xl border border-kood-border/50 bg-kood-bg/15 p-6 backdrop-blur-sm md:p-8"
		>
			<h2 class="text-xs font-bold uppercase tracking-[0.15em] text-kood-muted">Completed projects</h2>
			<ul class="mt-5 divide-y divide-kood-border/40 rounded-2xl border border-kood-border/50 bg-kood-surface/40">
				{#each data.completed as p (p.id)}
					<li class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
						<div class="min-w-0">
							<p class="truncate font-medium text-kood-text">{p.displayTitle}</p>
							<p class="mt-0.5 text-xs text-kood-muted">
								<span class="font-semibold">Submitter</span>
								<span class="ml-1 font-mono text-kood-text/90">{p.submitterUsername}</span>
							</p>
						</div>
						<a
							class="shrink-0 rounded-lg bg-kood-bg/50 px-3 py-1.5 text-xs font-semibold text-kood-accent ring-1 ring-kood-border/60 transition hover:ring-kood-accent/40"
							href="/admin/projects/{p.id}">View audit</a
						>
					</li>
				{/each}
			</ul>
			{#if data.completed.length === 0}
				<p class="mt-5 text-center text-sm text-kood-muted">No completed projects yet.</p>
			{/if}
		</section>

		<p class="pb-4 text-center">
			<a
				href="/"
				class="text-sm font-medium text-kood-accent underline decoration-2 underline-offset-4 transition hover:text-kood-text"
				>← Back to prototype workspace</a
			>
		</p>
	</div>
</div>
