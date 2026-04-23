<script lang="ts">
	import PrototypePageShell from '$lib/features/shell/PrototypePageShell.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<PrototypePageShell
	variant="admin"
	adminDashboardActive={data.adminIsDashboard}
	adminUsersActive={data.adminUsersActive}
	adminSidebarProjects={data.sidebarProjects}
	adminCurrentProjectId={data.adminProjectRouteId}
>
	{@render children()}
</PrototypePageShell>
