<script lang="ts">
	import AdminThreadConversationFeed from '$lib/features/admin/AdminThreadConversationFeed.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — Code review threads — Admin</title>
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

	<header>
		<h1 class="text-lg font-semibold text-kood-text">Code review — conversation threads</h1>
		<p class="mt-1 text-sm text-kood-muted">
			Threads are collapsed by default; expand a row to read messages (oldest → newest within each observation).
		</p>
	</header>

	<AdminThreadConversationFeed groups={data.codeReviewThreadGroups} emptyLabel="No code review comments saved yet." />
</div>
