<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	const reviewers = $derived(data.users.filter((u) => u.role === 'reviewer'));
</script>

<svelte:head>
	<title>Admin — //kood</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 text-kood-text">
	<h1 class="font-mono text-2xl font-semibold">Admin dashboard</h1>
	<p class="mt-2 text-sm text-kood-muted">
		Registering users, pairing reviewers to a submitted repo, and auditing completed review threads.
	</p>

	<section class="mt-10">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Registered users</h2>
		<div class="mt-3 overflow-x-auto rounded-lg border border-kood-border">
			<table class="w-full min-w-[520px] text-left text-sm">
				<thead class="border-b border-kood-border bg-kood-surface text-xs uppercase text-kood-muted">
					<tr>
						<th class="px-3 py-2">Username</th>
						<th class="px-3 py-2">Email</th>
						<th class="px-3 py-2">Role</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as u (u.id)}
						<tr class="border-b border-kood-border/60 last:border-0">
							<td class="px-3 py-2 font-mono text-xs">{u.username}</td>
							<td class="px-3 py-2 text-kood-muted">{u.email}</td>
							<td class="px-3 py-2 capitalize">{u.role}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="mt-10">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Pair reviewers → submitter project</h2>
		<p class="mt-2 text-xs text-kood-muted">
			Choose a project that is <strong class="text-kood-text/90">repo_submitted</strong> (Gitea link saved) and two
			different reviewer accounts. Reviewer A owns Security + Correctness; Reviewer B owns Performance + Structure
			&amp; architecture on the home workspace; they use <strong class="text-kood-text/90">Server sync</strong> to save
			Testing and Code review threads.
		</p>

		<form method="post" action="?/assignPair" class="mt-4 space-y-3 rounded-lg border border-kood-border bg-kood-surface p-4" use:enhance>
			<div>
				<label class="text-xs font-semibold uppercase text-kood-muted" for="projectId">Project</label>
				<select
					id="projectId"
					name="projectId"
					required
					class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm"
				>
					<option value="" disabled selected>Select project…</option>
					{#each data.pairable as p (p.id)}
						<option value={p.id}>
							{p.submitterUsername} — {p.status} — {p.giteaUrl?.slice(0, 48) ?? ''}…
						</option>
					{/each}
				</select>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<label class="text-xs font-semibold uppercase text-kood-muted" for="reviewerAId">Reviewer A (slot 1)</label>
					<select
						id="reviewerAId"
						name="reviewerAId"
						required
						class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm"
					>
						<option value="" disabled selected>Pick reviewer…</option>
						{#each reviewers as r (r.id)}
							<option value={r.id}>{r.username}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="text-xs font-semibold uppercase text-kood-muted" for="reviewerBId">Reviewer B (slot 2)</label>
					<select
						id="reviewerBId"
						name="reviewerBId"
						required
						class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm"
					>
						<option value="" disabled selected>Pick reviewer…</option>
						{#each reviewers as r (r.id)}
							<option value={r.id}>{r.username}</option>
						{/each}
					</select>
				</div>
			</div>
			<button type="submit" class="rounded bg-kood-accent px-4 py-2 text-sm font-semibold text-kood-bg hover:opacity-90">
				Create pair &amp; activate review
			</button>
		</form>
	</section>

	<section class="mt-10">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Active projects</h2>
		<ul class="mt-3 space-y-2 text-sm">
			{#each data.active as p (p.id)}
				<li class="rounded border border-kood-border px-3 py-2">
					<span class="font-mono text-xs">{p.submitterUsername}</span>
					· <span class="text-kood-accent">{p.status}</span>
					{#if p.giteaUrl}
						· <a class="text-kood-accent underline" href={p.giteaUrl} target="_blank" rel="noreferrer">repo</a>
					{/if}
					{#if p.status === 'review_active'}
						<form method="post" action="?/markComplete" class="mt-2 inline">
							<input type="hidden" name="projectId" value={p.id} />
							<button type="submit" class="text-xs text-kood-muted underline hover:text-kood-text">
								Mark completed
							</button>
						</form>
					{/if}
					<a class="ml-2 text-xs text-kood-accent underline" href="/admin/projects/{p.id}">View thread →</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-kood-muted">Completed projects</h2>
		<ul class="mt-3 space-y-2 text-sm">
			{#each data.completed as p (p.id)}
				<li class="rounded border border-kood-border px-3 py-2">
					<span class="font-mono text-xs">{p.submitterUsername}</span>
					<a class="ml-2 text-kood-accent underline" href="/admin/projects/{p.id}">Comments &amp; snapshot →</a>
				</li>
			{/each}
		</ul>
	</section>

	<p class="mt-10 text-sm">
		<a href="/" class="text-kood-accent underline">← Back to prototype</a>
	</p>
</div>
