<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	const ACCOUNTS_PAGE_SIZE = 10;
	const PAIRED_PAGE_SIZE = 4;

	let accountsPage = $state(0);
	let pairedPage = $state(0);

	const accountsTotalPages = $derived(Math.max(1, Math.ceil(data.users.length / ACCOUNTS_PAGE_SIZE)));
	const accountsPageSafe = $derived(Math.min(accountsPage, accountsTotalPages - 1));
	const usersPageSlice = $derived(
		data.users.slice(
			accountsPageSafe * ACCOUNTS_PAGE_SIZE,
			accountsPageSafe * ACCOUNTS_PAGE_SIZE + ACCOUNTS_PAGE_SIZE
		)
	);

	const pairedTotalPages = $derived(Math.max(1, Math.ceil(data.pairedProjects.length / PAIRED_PAGE_SIZE)));
	const pairedPageSafe = $derived(Math.min(pairedPage, pairedTotalPages - 1));
	const pairedSlice = $derived(
		data.pairedProjects.slice(
			pairedPageSafe * PAIRED_PAGE_SIZE,
			pairedPageSafe * PAIRED_PAGE_SIZE + PAIRED_PAGE_SIZE
		)
	);

	const refreshAfterSubmit = () => {
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			await invalidateAll();
		};
	};
</script>

<svelte:head>
	<title>Users — Admin — //kood</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-10 pb-16">
	<p class="text-xs text-kood-muted">
		<a href="/admin" class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
			>← Admin</a
		>
	</p>

	<header class="rounded-xl border border-kood-border bg-kood-surface/80 p-6 md:p-8">
		<h1 class="text-xl font-semibold tracking-tight text-kood-text md:text-2xl">Users</h1>
		<p class="mt-2 text-sm text-kood-muted">
			Role changes apply to non-admin accounts. Removal is blocked while a user owns a project or sits on a pair.
		</p>
		{#if form?.message}
			<p class="mt-3 rounded-lg border border-kood-border bg-kood-bg/40 px-3 py-2 text-sm text-kood-text">{form.message}</p>
		{/if}
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
		<div class="flex flex-wrap items-end justify-between gap-3 border-b border-kood-border/50 pb-3">
			<h2 class="text-sm font-semibold text-kood-text">Accounts</h2>
			{#if data.users.length > ACCOUNTS_PAGE_SIZE}
				<p class="text-xs text-kood-muted">
					Page <span class="tabular-nums text-kood-text">{accountsPageSafe + 1}</span> / {accountsTotalPages}
				</p>
			{/if}
		</div>
		<div class="mt-4 overflow-x-auto rounded-lg border border-kood-border/60">
			<table class="w-full min-w-[640px] text-left text-sm">
				<thead class="border-b border-kood-border/50 bg-kood-bg/30 text-xs uppercase tracking-wide text-kood-muted">
					<tr>
						<th class="px-3 py-3 font-semibold">Username</th>
						<th class="px-3 py-3 font-semibold">Email</th>
						<th class="px-3 py-3 font-semibold">Role</th>
						<th class="px-3 py-3 font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each usersPageSlice as u (u.id)}
						<tr class="border-b border-kood-border/30 last:border-0">
							<td class="px-3 py-3 font-mono text-xs font-medium text-kood-text">{u.username}</td>
							<td class="max-w-[220px] truncate px-3 py-3 text-xs text-kood-muted" title={u.email}>{u.email}</td>
							<td class="px-3 py-3">
								{#if u.role === 'admin'}
									<span class="text-xs font-medium capitalize text-kood-text/90">admin</span>
									<p class="mt-1 text-[10px] text-kood-muted">—</p>
								{:else}
									<form method="post" action="?/updateUserRole" class="flex flex-wrap items-center gap-2" use:enhance={refreshAfterSubmit}>
										<input type="hidden" name="userId" value={u.id} />
										<select
											name="role"
											class="rounded-md border border-kood-border bg-kood-bg px-2 py-1.5 text-xs text-kood-text"
											value={u.role}
										>
											<option value="submitter">Submitter</option>
											<option value="reviewer">Reviewer</option>
										</select>
										<button
											type="submit"
											class="rounded-md border border-kood-border bg-kood-surface px-2.5 py-1 text-[11px] font-medium text-kood-text hover:bg-kood-surface-raised"
										>
											Save
										</button>
									</form>
								{/if}
							</td>
							<td class="px-3 py-3">
								{#if u.role !== 'admin'}
									<form method="post" action="?/deleteUser" use:enhance={refreshAfterSubmit}>
										<input type="hidden" name="userId" value={u.id} />
										<button
											type="submit"
											class="text-xs text-kood-muted underline decoration-kood-border decoration-dotted hover:text-kood-text"
											onclick={(e) => {
												if (!confirm(`Remove account “${u.username}”? This cannot be undone.`)) {
													e.preventDefault();
												}
											}}
										>
											Remove
										</button>
									</form>
								{:else}
									<span class="text-[11px] text-kood-muted/60">—</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.users.length > ACCOUNTS_PAGE_SIZE}
			<div class="mt-4 flex flex-wrap items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-md border border-kood-border px-3 py-1.5 text-xs text-kood-text hover:bg-kood-bg/40 disabled:opacity-40"
					disabled={accountsPageSafe <= 0}
					onclick={() => (accountsPage = accountsPageSafe - 1)}>Previous</button
				>
				<button
					type="button"
					class="rounded-md border border-kood-border px-3 py-1.5 text-xs text-kood-text hover:bg-kood-bg/40 disabled:opacity-40"
					disabled={accountsPageSafe >= accountsTotalPages - 1}
					onclick={() => (accountsPage = accountsPageSafe + 1)}>Next</button
				>
			</div>
		{/if}
	</section>

	<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
		<div class="flex flex-wrap items-end justify-between gap-3 border-b border-kood-border/50 pb-3">
			<h2 class="text-sm font-semibold text-kood-text">Reassign reviewer</h2>
			{#if data.pairedProjects.length > PAIRED_PAGE_SIZE}
				<p class="text-xs text-kood-muted">
					Page <span class="tabular-nums text-kood-text">{pairedPageSafe + 1}</span> / {pairedTotalPages}
				</p>
			{/if}
		</div>

		{#if data.pairedProjects.length === 0}
			<p class="mt-4 text-sm text-kood-muted">No active paired projects.</p>
		{:else}
			<ul class="mt-5 space-y-6">
				{#each pairedSlice as p (p.id)}
					<li class="rounded-lg border border-kood-border/60 bg-kood-bg/25 p-4">
						<p class="font-medium text-kood-text">{p.displayTitle}</p>
						<p class="mt-1 font-mono text-[11px] text-kood-muted">{p.status}</p>
						<div class="mt-4 grid gap-4 md:grid-cols-2">
							<div>
								<p class="text-[10px] font-medium uppercase tracking-wide text-kood-muted">Slot A</p>
								<p class="mt-1 text-xs text-kood-text/90">{p.reviewerAUsername}</p>
								<form
									method="post"
									action="?/reassignReviewer"
									class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
									use:enhance={refreshAfterSubmit}
								>
									<input type="hidden" name="projectId" value={p.id} />
									<input type="hidden" name="slot" value="A" />
									<select
										name="newReviewerId"
										required
										class="min-w-0 flex-1 rounded-md border border-kood-border bg-kood-bg px-2 py-2 text-xs text-kood-text"
									>
										<option value="" disabled selected>Reviewer…</option>
										{#each data.reviewers as r (r.id)}
											{#if r.id !== p.reviewerBId}
												<option value={r.id}>{r.username}</option>
											{/if}
										{/each}
									</select>
									<button
										type="submit"
										class="shrink-0 rounded-md border border-kood-border bg-kood-surface px-3 py-2 text-[11px] font-medium text-kood-text hover:bg-kood-surface-raised"
									>
										Set A
									</button>
								</form>
							</div>
							<div>
								<p class="text-[10px] font-medium uppercase tracking-wide text-kood-muted">Slot B</p>
								<p class="mt-1 text-xs text-kood-text/90">{p.reviewerBUsername}</p>
								<form
									method="post"
									action="?/reassignReviewer"
									class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
									use:enhance={refreshAfterSubmit}
								>
									<input type="hidden" name="projectId" value={p.id} />
									<input type="hidden" name="slot" value="B" />
									<select
										name="newReviewerId"
										required
										class="min-w-0 flex-1 rounded-md border border-kood-border bg-kood-bg px-2 py-2 text-xs text-kood-text"
									>
										<option value="" disabled selected>Reviewer…</option>
										{#each data.reviewers as r (r.id)}
											{#if r.id !== p.reviewerAId}
												<option value={r.id}>{r.username}</option>
											{/if}
										{/each}
									</select>
									<button
										type="submit"
										class="shrink-0 rounded-md border border-kood-border bg-kood-surface px-3 py-2 text-[11px] font-medium text-kood-text hover:bg-kood-surface-raised"
									>
										Set B
									</button>
								</form>
							</div>
						</div>
						<p class="mt-3 text-center">
							<a class="text-xs text-kood-text underline decoration-kood-border" href="/admin/projects/{p.id}"
								>Audit</a
							>
						</p>
					</li>
				{/each}
			</ul>
			{#if data.pairedProjects.length > PAIRED_PAGE_SIZE}
				<div class="mt-6 flex flex-wrap items-center justify-between gap-2">
					<button
						type="button"
						class="rounded-md border border-kood-border px-3 py-1.5 text-xs text-kood-text hover:bg-kood-bg/40 disabled:opacity-40"
						disabled={pairedPageSafe <= 0}
						onclick={() => (pairedPage = pairedPageSafe - 1)}>Previous</button
					>
					<button
						type="button"
						class="rounded-md border border-kood-border px-3 py-1.5 text-xs text-kood-text hover:bg-kood-bg/40 disabled:opacity-40"
						disabled={pairedPageSafe >= pairedTotalPages - 1}
						onclick={() => (pairedPage = pairedPageSafe + 1)}>Next</button
					>
				</div>
			{/if}
		{/if}
	</section>
</div>
