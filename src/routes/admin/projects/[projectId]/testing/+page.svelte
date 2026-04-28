<script lang="ts">
	import AdminTestingChecklistSummary from '$lib/features/admin/AdminTestingChecklistSummary.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.projectDisplayTitle} — Testing — Admin</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 pb-12">
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
			Expand a checklist row to see its current status and related discussion thread together.
		</p>
	</header>

	<AdminTestingChecklistSummary
		summary={data.testingChecklistAdminSummary}
		reviewerAColumn={data.reviewerAName}
		reviewerBColumn={data.reviewerBName}
		threadGroups={data.testingThreadGroups}
	/>
</div>
