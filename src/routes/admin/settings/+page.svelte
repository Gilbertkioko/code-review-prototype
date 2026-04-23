<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
</script>

<svelte:head>
	<title>Settings — Admin — //kood</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-8 pb-16">
	<p class="text-xs text-kood-muted">
		<a href="/admin" class="text-kood-text underline decoration-kood-border underline-offset-2 hover:decoration-kood-text/40"
			>← Dashboard</a
		>
	</p>

	<header>
		<h1 class="text-xl font-semibold text-kood-text">Settings</h1>
		<p class="mt-2 text-sm text-kood-muted">
			Projects removed from the sidebar are listed here. Restoring a project puts it back in the Projects list.
		</p>
	</header>

	<section class="rounded-xl border border-kood-border bg-kood-surface/80 p-5">
		<h2 class="text-sm font-semibold text-kood-text">Hidden from sidebar</h2>
		{#if data.hiddenProjects.length === 0}
			<p class="mt-3 text-sm text-kood-muted">No hidden projects.</p>
		{:else}
			<ul class="mt-4 space-y-3">
				{#each data.hiddenProjects as p (p.id)}
					<li class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kood-border/60 bg-kood-bg/25 px-3 py-2">
						<div class="min-w-0">
							<p class="font-medium text-kood-text">{p.displayTitle}</p>
							<p class="text-[11px] text-kood-muted">
								{p.submitterUsername} · <span class="font-mono">{p.status}</span>
							</p>
						</div>
						<div class="flex shrink-0 flex-wrap items-center gap-2">
							<a
								class="text-xs text-kood-text underline decoration-kood-border"
								href="/admin/projects/{p.id}">Open</a
							>
							<form
								method="post"
								action="?/restoreProjectSidebar"
								use:enhance={() => async ({ update }) => {
									await update();
									await invalidateAll();
								}}
							>
								<input type="hidden" name="projectId" value={p.id} />
								<button
									type="submit"
									class="rounded-md border border-kood-border bg-kood-surface px-2.5 py-1 text-[11px] font-medium text-kood-text hover:bg-kood-surface-raised"
								>
									Restore to sidebar
								</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
