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

	let {
		children,
		variant = 'workspace',
		adminDashboardActive = false,
		adminSidebarProjects = [] as AdminSidebarProjectBrief[],
		adminCurrentProjectId = null as string | null
	}: {
		children: Snippet;
		variant?: 'workspace' | 'admin' | 'auth';
		/** When `variant="admin"`, pass true on `/admin` so “Dashboard” shows as current. */
		adminDashboardActive?: boolean;
		/** Scrollable project list for admin navigation (from `+layout.server.ts`). */
		adminSidebarProjects?: AdminSidebarProjectBrief[];
		adminCurrentProjectId?: string | null;
	} = $props();

	function adminStatusLabel(status: string): string {
		if (status === 'awaiting_link') return 'Awaiting repo';
		if (status === 'repo_submitted') return 'Needs pair';
		if (status === 'review_active') return 'In review';
		if (status === 'completed') return 'Completed';
		return status;
	}

	function adminStatusChipClass(status: string): string {
		if (status === 'review_active') {
			return 'bg-emerald-500/12 text-emerald-200/95 ring-1 ring-emerald-400/35';
		}
		if (status === 'repo_submitted') {
			return 'bg-amber-500/12 text-amber-100/95 ring-1 ring-amber-400/35';
		}
		if (status === 'completed') {
			return 'bg-kood-surface-raised text-kood-muted ring-1 ring-kood-border/70';
		}
		return 'bg-kood-bg/80 text-kood-muted ring-1 ring-kood-border/80';
	}

	const auth = getContext<{ sessionUser: SessionUser | null }>(AUTH_SESSION);
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
				<a href="/" class="block">
					<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
					<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">Prototype UI</p>
				</a>
			</div>

			{#if variant === 'admin'}
				<nav class="mt-6 space-y-1 px-4 text-sm lg:px-0" aria-label="Admin">
					<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-kood-muted">Admin</p>
					<a
						href="/"
						class="block rounded-lg px-2 py-2 text-kood-muted transition hover:bg-kood-surface-raised/80 hover:text-kood-text"
						>Workspace</a
					>
					<a
						href="/admin"
						class="block rounded-lg px-2 py-2 transition {adminDashboardActive
							? 'bg-kood-surface-raised/80 text-kood-text'
							: 'text-kood-muted hover:bg-kood-surface-raised/80 hover:text-kood-text'}"
						>Dashboard</a
					>

					<div class="mt-4 border-t border-kood-border/80 pt-3">
						<p class="px-2 text-[10px] font-semibold uppercase tracking-wide text-kood-muted/90">
							Projects ({adminSidebarProjects.length})
						</p>
						<p class="mt-1 px-2 text-[10px] leading-snug text-kood-muted/75">
							Project name from repo or notes, then who submitted. Open for threads, standup, and 360°.
						</p>
						<ul class="mt-2 max-h-[min(48vh,26rem)] space-y-1 overflow-y-auto overscroll-contain pr-1">
							{#if adminSidebarProjects.length === 0}
								<li class="px-2 py-2 text-xs text-kood-muted">No projects yet.</li>
							{:else}
								{#each adminSidebarProjects as p (p.id)}
									<li>
										<a
											href="/admin/projects/{p.id}"
											class="block rounded-lg border px-2.5 py-2.5 transition {adminCurrentProjectId === p.id
												? 'border-kood-accent/50 bg-kood-accent/10 text-kood-text'
												: 'border-transparent hover:border-kood-border/60 hover:bg-kood-surface-raised/50'}"
										>
											<div class="flex items-start justify-between gap-2">
												<p class="min-w-0 flex-1 leading-snug">
													<span class="line-clamp-2 text-[12px] font-semibold tracking-tight text-kood-text"
														>{p.displayTitle}</span
													>
												</p>
												<span
													class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide {adminStatusChipClass(
														p.status
													)}">{adminStatusLabel(p.status)}</span
												>
											</div>
											<p class="mt-1.5 text-[10px] text-kood-muted/90">
												<span class="font-semibold uppercase tracking-wide text-kood-muted/70"
													>Submitter</span
												>
												<span class="ml-1 font-mono text-[11px] text-kood-text/95">{p.submitterUsername}</span>
											</p>
											<p class="mt-0.5 truncate font-mono text-[9px] text-kood-muted/60" title={p.id}>
												{p.id.slice(0, 6)}…{p.id.slice(-4)}
											</p>
											{#if p.reviewerAUsername || p.reviewerBUsername}
												<p class="mt-1.5 border-t border-kood-border/40 pt-1.5 text-[10px] leading-snug text-kood-muted/90">
													<span class="font-medium text-kood-text/75">Reviewers</span>
													<span class="ml-1"
														><span class="text-kood-muted">A</span>
														{p.reviewerAUsername ?? '—'}</span
													>
													<span class="mx-0.5 text-kood-border/80">·</span>
													<span class="text-kood-muted">B</span>
													{p.reviewerBUsername ?? '—'}
												</p>
											{:else}
												<p class="mt-1.5 text-[10px] italic text-kood-muted/70">No reviewer pair yet</p>
											{/if}
										</a>
									</li>
								{/each}
							{/if}
						</ul>
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
					<p class="text-xs font-semibold uppercase tracking-wide text-kood-muted">Demo</p>
					{#if auth.sessionUser?.role === 'admin'}
						<p class="mt-2 text-xs text-kood-muted">Switch persona for sprint + 360° flows</p>
						<div class="mt-2">
							<RoleSwitcher />
						</div>
					{:else if auth.sessionUser}
						<p class="mt-2 text-xs text-kood-muted">
							Your account role is fixed — use <strong class="text-kood-text/90">Server sync</strong> when you have a
							batch to save Testing and Code review threads for the team.
						</p>
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
