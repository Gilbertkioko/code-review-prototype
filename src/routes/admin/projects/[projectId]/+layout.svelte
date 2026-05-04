<script lang="ts">
	import AdminProjectResetPanel from '$lib/features/admin/AdminProjectResetPanel.svelte';

	let { data, children } = $props();

	const pid = $derived(data.project.id);
	/** Show for any batch past “awaiting link” (includes completed — admin can reopen a cycle). */
	const canShowProjectReset = $derived(data.project.status !== 'awaiting_link');

	const nav = $derived(
		[
			{ href: `/admin/projects/${pid}`, label: 'Overview' },
			{ href: `/admin/projects/${pid}/testing`, label: 'Testing' },
			{ href: `/admin/projects/${pid}/code-review`, label: 'Code review' },
			{ href: `/admin/projects/${pid}/standup`, label: 'Standup' },
			{ href: `/admin/projects/${pid}/feedback`, label: '360° feedback' }
		] as const
	);
</script>

<div class="mx-auto max-w-4xl space-y-4 pb-2">
	{#if canShowProjectReset}
		<AdminProjectResetPanel
			projectId={pid}
			hasPair={data.pair != null}
			projectCompleted={data.project.status === 'completed'}
		/>
	{/if}

	<nav
		class="flex flex-wrap gap-1 rounded-xl border border-kood-border/60 bg-kood-surface/60 px-2 py-2 text-xs font-medium"
		aria-label="Project admin sections"
	>
		{#each nav as item (item.href)}
			<a
				href={item.href}
				class="rounded-lg px-3 py-1.5 text-kood-muted transition hover:bg-kood-bg/50 hover:text-kood-text"
				>{item.label}</a
			>
		{/each}
	</nav>
</div>

{@render children()}
