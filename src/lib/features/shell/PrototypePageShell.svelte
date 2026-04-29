<script lang="ts">
	import { getContext } from 'svelte';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import CurriculumLeftNav from './CurriculumLeftNav.svelte';
	import KoodRightChrome from './KoodRightChrome.svelte';
	import KoodWorkflowPanel from './KoodWorkflowPanel.svelte';
	import RoleSwitcher from './RoleSwitcher.svelte';
	import SidebarMeta from './SidebarMeta.svelte';
	import type { Snippet } from 'svelte';

	/** Mirrors server `AdminSidebarProject` — keep in sync for sidebar props (no server imports here). */
	type AdminSidebarProjectBrief = {
		id: string;
		status: string;
		createdAt: number;
		displayTitle: string;
		submitterUsername: string;
		reviewerAUsername: string | null;
		reviewerBUsername: string | null;
	};

	type AdminProjectSection =
		| 'overview'
		| 'testing'
		| 'code-review'
		| 'ai-review'
		| 'standup'
		| 'feedback'
		| null;

	let {
		children,
		variant = 'workspace',
		adminDashboardActive = false,
		adminUsersActive = false,
		adminSettingsActive = false,
		adminSidebarProjects = [] as AdminSidebarProjectBrief[],
		adminCurrentProjectId = null as string | null,
		adminProjectSection = null as AdminProjectSection
	}: {
		children: Snippet;
		variant?: 'workspace' | 'admin' | 'auth';
		/** When `variant="admin"`, pass true on `/admin` so “Dashboard” shows as current. */
		adminDashboardActive?: boolean;
		/** When `variant="admin"`, pass true on `/admin/users`. */
		adminUsersActive?: boolean;
		/** When `variant="admin"`, pass true on `/admin/settings`. */
		adminSettingsActive?: boolean;
		/** Scrollable project list for admin navigation (from `+layout.server.ts`). */
		adminSidebarProjects?: AdminSidebarProjectBrief[];
		adminCurrentProjectId?: string | null;
		adminProjectSection?: AdminProjectSection;
	} = $props();

	const auth = getContext<{ sessionUser: SessionUser | null }>(AUTH_SESSION);

	let expandedProjectId = $state<string | null>(null);
	let projectsNavOpen = $state(false);

	$effect(() => {
		if (adminCurrentProjectId) projectsNavOpen = true;
	});

	function submenuOpen(projectId: string): boolean {
		return adminCurrentProjectId === projectId || expandedProjectId === projectId;
	}

	function subLinkClass(projectId: string, section: Exclude<AdminProjectSection, null>): string {
		const here = adminCurrentProjectId === projectId && (adminProjectSection ?? 'overview') === section;
		return `block rounded-md px-2 py-1.5 text-[11px] transition ${here ? 'bg-kood-surface-raised text-kood-text' : 'text-kood-muted hover:bg-kood-surface-raised/60 hover:text-kood-text'}`;
	}

	function adminTopLinkClass(active: boolean): string {
		return `block rounded-lg px-2 py-2 text-sm transition ${active ? 'bg-kood-surface-raised/80 text-kood-text' : 'text-kood-muted hover:bg-kood-surface-raised/80 hover:text-kood-text'}`;
	}

	function projectTitleLinkClass(projectId: string): string {
		const onProject = adminCurrentProjectId === projectId;
		return `block min-w-0 flex-1 rounded-r-lg border px-2 py-2 transition ${onProject ? 'border-kood-border bg-kood-surface-raised/70 text-kood-text' : 'border-kood-border/50 hover:border-kood-border hover:bg-kood-surface-raised/50'}`;
	}
</script>

{#if variant === 'auth'}
	<!-- Sign-in / sign-up only: no curriculum chrome or workspace landing panels -->
	<div class="min-h-screen bg-kood-bg text-kood-text">
		<div class="flex min-h-screen flex-col">
			<header class="shrink-0 border-b border-kood-border px-4 py-5 lg:px-10">
				<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
				<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">Prototype UI</p>
			</header>
			<main class="flex flex-1 flex-col justify-center px-4 py-10 lg:px-10">
				{@render children()}
			</main>
		</div>
	</div>
{:else}
<div class="min-h-screen bg-kood-bg text-kood-text">
	<div class="mx-auto flex min-h-screen max-w-[1700px] flex-col lg:flex-row">
		<aside
			class="flex w-full shrink-0 flex-col border-b border-kood-border lg:border-b-0 lg:border-r lg:px-4 lg:py-5 {variant ===
			'admin'
				? 'lg:w-[300px]'
				: 'lg:w-[240px]'}"
		>
			<div class="px-4 pt-4 lg:px-0 lg:pt-0">
				<a href={variant === 'admin' ? '/admin' : '/'} class="block">
					<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
					<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">
						{variant === 'admin' ? 'Admin' : 'Prototype UI'}
					</p>
				</a>
			</div>

			{#if variant === 'admin'}
				<nav class="mt-6 space-y-0.5 px-4 text-sm lg:px-0" aria-label="Admin">
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-kood-muted">Menu</p>
					<a href="/admin" class={adminTopLinkClass(adminDashboardActive)}>Dashboard</a>
					<a href="/admin/users" class={adminTopLinkClass(adminUsersActive)}>Users</a>
					<a href="/admin/settings" class={adminTopLinkClass(adminSettingsActive)}>Settings</a>

					<div class="mt-3 border-t border-kood-border/80 pt-3">
						<button
							type="button"
							class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-kood-surface-raised/50"
							aria-expanded={projectsNavOpen}
							onclick={() => (projectsNavOpen = !projectsNavOpen)}
						>
							<span class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Projects</span>
							<svg
								class="size-4 shrink-0 text-kood-muted transition-transform duration-200 ease-out {projectsNavOpen
									? 'rotate-90'
									: ''}"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
						{#if projectsNavOpen}
							<ul
								class="mt-1 max-h-[min(44vh,22rem)] space-y-1 overflow-y-auto overscroll-contain pr-1 pl-1"
							>
								{#if adminSidebarProjects.length === 0}
									<li class="px-2 py-2 text-xs text-kood-muted">None in sidebar (see Settings for hidden).</li>
								{:else}
									{#each adminSidebarProjects as p (p.id)}
										<li class="rounded-lg">
											<div class="flex items-stretch gap-0.5">
												<button
													type="button"
													class="flex w-8 shrink-0 items-center justify-center rounded-l-lg border border-kood-border/50 text-kood-muted hover:bg-kood-surface-raised/70"
													aria-expanded={submenuOpen(p.id)}
													aria-controls="admin-proj-{p.id}-sub"
													aria-label={submenuOpen(p.id)
														? `Collapse sections for ${p.displayTitle}`
														: `Expand sections for ${p.displayTitle}`}
													onclick={() =>
														(expandedProjectId = expandedProjectId === p.id ? null : p.id)}
												>
													<svg
														class="size-4 text-kood-muted transition-transform duration-200 ease-out {submenuOpen(
															p.id
														)
															? 'rotate-90'
															: ''}"
														viewBox="0 0 20 20"
														fill="currentColor"
														aria-hidden="true"
													>
														<path
															fill-rule="evenodd"
															d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
															clip-rule="evenodd"
														/>
													</svg>
												</button>
												<a href="/admin/projects/{p.id}" class={projectTitleLinkClass(p.id)}>
													<span
														class="line-clamp-2 text-left text-[12px] font-semibold leading-snug tracking-tight text-kood-text"
														>{p.displayTitle}</span
													>
												</a>
											</div>
											{#if submenuOpen(p.id)}
												<ul
													id="admin-proj-{p.id}-sub"
													class="ml-9 mt-1 space-y-0.5 border-l border-kood-border/45 py-1 pl-2"
												>
													<li>
														<a href="/admin/projects/{p.id}" class={subLinkClass(p.id, 'overview')}
															>Overview</a
														>
													</li>
													<li>
														<a href="/admin/projects/{p.id}/testing" class={subLinkClass(p.id, 'testing')}
															>Testing</a
														>
													</li>
													<li>
														<a
															href="/admin/projects/{p.id}/code-review"
															class={subLinkClass(p.id, 'code-review')}>Code review</a
														>
													</li>
													<li>
														<a
															href="/admin/projects/{p.id}/ai-review"
															class={subLinkClass(p.id, 'ai-review')}>AI review</a
														>
													</li>
													<li>
														<a href="/admin/projects/{p.id}/standup" class={subLinkClass(p.id, 'standup')}
															>Standup</a
														>
													</li>
													<li>
														<a href="/admin/projects/{p.id}/feedback" class={subLinkClass(p.id, 'feedback')}
															>360°</a
														>
													</li>
												</ul>
											{/if}
										</li>
									{/each}
								{/if}
							</ul>
						{/if}
					</div>
				</nav>

				<div class="mt-6 space-y-3 border-t border-kood-border px-4 py-4 text-xs text-kood-muted lg:px-0 lg:pb-0">
					{#if auth.sessionUser}
						<form method="post" action="/?/signout">
							<button
								type="submit"
								class="text-left text-kood-muted/90 underline decoration-kood-border decoration-dotted hover:text-kood-text"
							>
								Log out
							</button>
						</form>
					{/if}
				</div>
			{:else}
				<div class="mt-5 px-4 lg:px-0">
					<CurriculumLeftNav />
				</div>

				<div class="mt-6 border-t border-kood-border px-4 py-4 lg:px-0">
					{#if auth.sessionUser?.role === 'admin'}
						<p class="mt-2 text-xs text-kood-muted">Switch persona for sprint + 360° flows</p>
						<div class="mt-2">
							<RoleSwitcher />
						</div>
					{:else if auth.sessionUser}
					{:else}
						<p class="mt-2 text-xs text-kood-muted">Sign in to use the live workspace.</p>
					{/if}
				</div>

				<div class="mt-auto space-y-2 border-t border-kood-border px-4 py-4 text-xs text-kood-muted lg:border-0 lg:px-0 lg:pb-0">
					<p class="flex items-center gap-2"><span>🌙</span> Dark</p>
					<p class="flex items-center gap-2"><span>☕</span> Gitea</p>
					{#if auth.sessionUser}
						{#if auth.sessionUser.role === 'admin'}
							<p class="mt-1">
								<a class="text-kood-accent underline" href="/admin">Admin dashboard</a>
							</p>
						{/if}
						<p class="flex items-center gap-2">
							<span>👤</span> {auth.sessionUser.username}
						</p>
						<p class="break-all text-kood-muted/90">{auth.sessionUser.email}</p>
						<p class="text-[10px] uppercase tracking-wide text-kood-muted/80">
							Role: {auth.sessionUser.role}
						</p>
						<form method="post" action="/?/signout">
							<button
								type="submit"
								class="text-left text-kood-muted/90 underline decoration-kood-border decoration-dotted hover:text-kood-text"
							>
								Log out
							</button>
						</form>
					{:else}
						<p class="flex items-center gap-2"><span>👤</span> Guest</p>
						<p class="flex flex-col gap-1">
							<a class="text-kood-text underline" href="/login">Sign in</a>
							<a class="text-kood-muted/90 underline" href="/signup">Sign up</a>
						</p>
					{/if}
				</div>
			{/if}
		</aside>

		<main class="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-8">
			{@render children()}
		</main>

		{#if variant === 'workspace'}
			<aside
				class="w-full shrink-0 border-t border-kood-border px-4 py-6 lg:w-[300px] lg:border-l lg:border-t-0 lg:px-5 lg:py-8"
			>
				<KoodWorkflowPanel />
				<div class="mt-8">
					<SidebarMeta />
				</div>
				<KoodRightChrome />
			</aside>
		{/if}
	</div>
</div>
{/if}
