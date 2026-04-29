<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

let { data, form } = $props();

	const started = $derived(
		data.project.createdAt ? new Date(data.project.createdAt).toLocaleString() : '—'
	);
	const sidebarHidden = $derived(Boolean(data.project.adminSidebarHiddenAt));
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — Overview — Admin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 pb-12">
	<p class="text-xs text-kood-muted">
		<a href="/admin" class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
			>← Admin</a
		>
	</p>

	<header class="rounded-xl border border-kood-border bg-kood-surface/80 p-5 md:p-6">
		<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-kood-muted/90">Project</p>
		<h1 class="mt-1 text-xl font-semibold tracking-tight text-kood-text md:text-2xl">
			{data.projectDisplayTitle}
		</h1>
		<p class="mt-2 text-sm text-kood-muted">
			<span class="font-semibold text-kood-muted/80">Submitter</span>
			<span class="ml-1 font-mono text-kood-text/95">{data.submitterName}</span>
			<span class="mx-2 text-kood-border">·</span>
			Created <span class="text-kood-text/90">{started}</span>
			<span class="mx-2 text-kood-border">·</span>
			Status <span class="font-medium text-kood-text">{data.project.status}</span>
		</p>
		{#if data.project.giteaUrl}
			<p class="mt-3 break-all text-sm">
				<a
					class="text-kood-text underline decoration-kood-border hover:decoration-kood-text/40"
					href={data.project.giteaUrl}
					target="_blank"
					rel="noreferrer">{data.project.giteaUrl}</a
				>
			</p>
		{/if}
		{#if form?.message}
			<p class="mt-3 rounded-lg border border-kood-border bg-kood-bg/40 px-3 py-2 text-xs text-kood-text">{form.message}</p>
		{/if}

		<div
			class="mt-5 grid gap-3 rounded-xl border border-kood-border/60 bg-kood-bg/30 p-4 text-sm sm:grid-cols-3"
		>
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wide text-kood-muted">Submitter</p>
				<p class="mt-1 font-medium text-kood-text">{data.submitterName}</p>
			</div>
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wide text-kood-muted">Reviewer A (slot 1)</p>
				<p class="mt-1 font-medium text-kood-text">{data.reviewerAName}</p>
			</div>
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wide text-kood-muted">Reviewer B (slot 2)</p>
				<p class="mt-1 font-medium text-kood-text">{data.reviewerBName}</p>
			</div>
		</div>

		<div class="mt-6 border-t border-kood-border/50 pt-4">
			<p class="text-xs font-medium text-kood-muted">Sidebar</p>
			{#if sidebarHidden}
				<p class="mt-1 text-xs text-kood-muted">
					This batch is hidden from the admin Projects list.
					<a class="text-kood-text underline" href="/admin/settings">Settings</a> lists all hidden batches.
				</p>
				<form
					method="post"
					action="?/toggleSidebarHidden"
					class="mt-2"
					use:enhance={() => async ({ update }) => {
						await update();
						await invalidateAll();
					}}
				>
					<input type="hidden" name="projectId" value={data.project.id} />
					<input type="hidden" name="hidden" value="0" />
					<button
						type="submit"
						class="rounded-md border border-kood-border bg-kood-surface px-3 py-1.5 text-xs font-medium text-kood-text hover:bg-kood-surface-raised"
					>
						Show in sidebar again
					</button>
				</form>
			{:else}
				<p class="mt-1 text-xs text-kood-muted">
					Remove this batch from the sidebar when the list is crowded. You can bring it back anytime from Settings.
				</p>
				<form
					method="post"
					action="?/toggleSidebarHidden"
					class="mt-2"
					use:enhance={() => async ({ update }) => {
						await update();
						await invalidateAll();
					}}
				>
					<input type="hidden" name="projectId" value={data.project.id} />
					<input type="hidden" name="hidden" value="1" />
					<button
						type="submit"
						class="rounded-md border border-kood-border px-3 py-1.5 text-xs text-kood-muted hover:bg-kood-bg/40 hover:text-kood-text"
					>
						Hide from sidebar
					</button>
				</form>
			{/if}
		</div>

		{#if data.project.status === 'repo_submitted' && !data.pair}
			<div class="mt-6 border-t border-kood-border/50 pt-4">
				<p class="text-xs font-medium text-kood-muted">Pair reviewers</p>
				<form method="post" action="?/assignPair" class="mt-3 space-y-4" use:enhance={() => async ({ update }) => {
					await update();
					await invalidateAll();
				}}>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<p class="text-[10px] font-medium uppercase tracking-wide text-kood-muted">Slot A</p>
							<p class="mt-1 text-xs text-kood-muted">Reviewer A</p>
							<input type="hidden" name="projectId" value={data.project.id} />
							<select
								name="reviewerAId"
								required
								class="mt-2 w-full rounded-md border border-kood-border bg-kood-bg px-3 py-2 text-xs text-kood-text"
							>
								<option value="" disabled selected>Reviewer…</option>
								{#each data.reviewers as r (r.id)}
									<option value={r.id}>{r.username}</option>
								{/each}
							</select>
						</div>
						<div>
							<p class="text-[10px] font-medium uppercase tracking-wide text-kood-muted">Slot B</p>
							<p class="mt-1 text-xs text-kood-muted">Reviewer B</p>
							<select
								name="reviewerBId"
								required
								class="mt-2 w-full rounded-md border border-kood-border bg-kood-bg px-3 py-2 text-xs text-kood-text"
							>
								<option value="" disabled selected>Reviewer…</option>
								{#each data.reviewers as r (r.id)}
									<option value={r.id}>{r.username}</option>
								{/each}
							</select>
						</div>
					</div>
					<button
						type="submit"
						class="w-full rounded-lg border border-kood-border bg-kood-text px-4 py-2.5 text-xs font-semibold text-kood-bg transition hover:opacity-90 sm:w-auto"
					>
						Create pair & activate review
					</button>
				</form>
			</div>
		{/if}

		{#if data.pair && data.project.status !== 'completed'}
			<div class="mt-6 border-t border-kood-border/50 pt-4">
				<p class="text-xs font-medium text-kood-muted">Reviewer reassignment</p>
				<div class="mt-3 grid gap-4 md:grid-cols-2">
					<div>
						<p class="text-[10px] font-medium uppercase tracking-wide text-kood-muted">Slot A</p>
						<p class="mt-1 text-xs text-kood-text/90">{data.reviewerAName}</p>
						<form
							method="post"
							action="?/reassignReviewer"
							class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
							use:enhance={() => async ({ update }) => {
								await update();
								await invalidateAll();
							}}
						>
							<input type="hidden" name="projectId" value={data.project.id} />
							<input type="hidden" name="slot" value="A" />
							<select
								name="newReviewerId"
								required
								class="min-w-0 flex-1 rounded-md border border-kood-border bg-kood-bg px-2 py-2 text-xs text-kood-text"
							>
								<option value="" disabled selected>Reviewer...</option>
								{#each data.reviewers as r (r.id)}
									{#if r.id !== data.pair.reviewerBId}
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
						<p class="mt-1 text-xs text-kood-text/90">{data.reviewerBName}</p>
						<form
							method="post"
							action="?/reassignReviewer"
							class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
							use:enhance={() => async ({ update }) => {
								await update();
								await invalidateAll();
							}}
						>
							<input type="hidden" name="projectId" value={data.project.id} />
							<input type="hidden" name="slot" value="B" />
							<select
								name="newReviewerId"
								required
								class="min-w-0 flex-1 rounded-md border border-kood-border bg-kood-bg px-2 py-2 text-xs text-kood-text"
							>
								<option value="" disabled selected>Reviewer...</option>
								{#each data.reviewers as r (r.id)}
									{#if r.id !== data.pair.reviewerAId}
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
			</div>
		{/if}
	</header>
</div>
