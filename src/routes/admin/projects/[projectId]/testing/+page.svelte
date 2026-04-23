<script lang="ts">
	import AdminTestingChecklistSummary from '$lib/features/admin/AdminTestingChecklistSummary.svelte';
	import AdminThreadConversationFeed from '$lib/features/admin/AdminThreadConversationFeed.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — Testing — Admin</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 pb-12">
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

	<header class="border-b border-kood-border/60 pb-4">
		<h1 class="text-lg font-semibold text-kood-text">Testing review</h1>
		<p class="mt-1 max-w-2xl text-sm leading-relaxed text-kood-muted">
			Verdicts by checklist row (mandatory vs extra), then per-row discussion threads. Threads are oldest → newest
			within each row.
		</p>
	</header>

	<AdminTestingChecklistSummary
		summary={data.testingChecklistAdminSummary}
		reviewerAColumn={data.reviewerAName}
		reviewerBColumn={data.reviewerBName}
	/>

	<section class="space-y-3">
		<h2 class="text-sm font-semibold text-kood-text">Discussion threads</h2>
		<p class="text-xs text-kood-muted">Expand a row to read messages for that checklist item.</p>
		<AdminThreadConversationFeed groups={data.testingThreadGroups} emptyLabel="No testing comments saved yet." />
	</section>
</div>
