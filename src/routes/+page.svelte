<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { getContext } from 'svelte';
	import { io } from 'socket.io-client';
	import { setActiveCollaboration } from '$lib/collaborationContext';
	import {
		getApp,
		importCategorySessionsFromServer,
		importTestingStateFromServer,
		reviewerNeedsAssignmentGate,
		setCategoryAssigneeOverride,
		setRole
	} from '$lib/appState.svelte';
	import { AUTH_SESSION, type SessionUser } from '$lib/auth-context';
	import ReviewProgressSave from '$lib/features/workspace/ReviewProgressSave.svelte';
	import WorkspaceStrip from '$lib/features/workspace/WorkspaceStrip.svelte';
	import ProjectBriefing from '$lib/features/briefing/ProjectBriefing.svelte';
	import ReviewerBriefingWait from '$lib/features/briefing/ReviewerBriefingWait.svelte';
	import CodeReviewView from '$lib/features/code-review/CodeReviewView.svelte';
	import AcceptView from '$lib/features/project-flow/AcceptView.svelte';
	import Feedback360View from '$lib/features/project-flow/Feedback360View.svelte';
	import ProjectCompletionView from '$lib/features/project-flow/ProjectCompletionView.svelte';
	import StandupView from '$lib/features/project-flow/StandupView.svelte';
	import CurriculumLeftNav from '$lib/features/shell/CurriculumLeftNav.svelte';
	import DevJumpPanel from '$lib/features/shell/DevJumpPanel.svelte';
	import KoodRightChrome from '$lib/features/shell/KoodRightChrome.svelte';
	import KoodWorkflowPanel from '$lib/features/shell/KoodWorkflowPanel.svelte';
	import ReviewerAssignmentPanel from '$lib/features/shell/ReviewerAssignmentPanel.svelte';
	import RoleSwitcher from '$lib/features/shell/RoleSwitcher.svelte';
	import SidebarMeta from '$lib/features/shell/SidebarMeta.svelte';
	import TestingView from '$lib/features/testing/TestingView.svelte';
	import ToastStack from '$lib/ui/ToastStack.svelte';

	const app = getApp();

	const reviewerGate = $derived(reviewerNeedsAssignmentGate(app.role));

	const auth = getContext<{ sessionUser: SessionUser | null }>(AUTH_SESSION);

	let { data } = $props();

	const reviewSaveContext = $derived.by(() => {
		const w = data.workspace;
		if (w.kind === 'submitter') {
			return { project: w.project, canMarkComplete: w.canMarkComplete };
		}
		if (w.kind === 'reviewer' && w.project) {
			return { project: w.project, canMarkComplete: w.canMarkComplete };
		}
		return null;
	});

	let syncedRoomKey = $state('');

	$effect(() => {
		if (!browser) return;
		const w = data.workspace;
		const p = w.kind === 'submitter' ? w.project : w.kind === 'reviewer' ? w.project : null;
		if (w.kind === 'other' || !p || !w.viewerId) {
			setActiveCollaboration(null);
			return () => setActiveCollaboration(null);
		}
		setActiveCollaboration({ projectId: p.id, userId: w.viewerId });
		const socket = io(window.location.origin, { path: '/socket.io', withCredentials: true });
		socket.emit('joinProject', p.id);
		const onInvalidate = () => {
			void invalidateAll();
		};
		socket.on('review:invalidate', onInvalidate);
		return () => {
			socket.emit('leaveProject', p.id);
			socket.off('review:invalidate', onInvalidate);
			socket.disconnect();
			setActiveCollaboration(null);
		};
	});

	$effect(() => {
		if (!browser) return;
		const w = data.workspace;
		const r = auth.sessionUser?.role;
		if (r === 'admin') {
			setCategoryAssigneeOverride(null);
			return () => setCategoryAssigneeOverride(null);
		}
		if (r === 'submitter' && w.kind === 'submitter') {
			setRole('sandra');
			setCategoryAssigneeOverride(w.categoryMap ?? null);
			return () => setCategoryAssigneeOverride(null);
		}
		if (r === 'reviewer' && w.kind === 'reviewer') {
			if (w.persona === 'jane' || w.persona === 'joe') setRole(w.persona);
			else setRole('jane');
			setCategoryAssigneeOverride(w.categoryMap ?? null);
			return () => setCategoryAssigneeOverride(null);
		}
		setCategoryAssigneeOverride(null);
	});

	$effect(() => {
		if (!browser) return;
		const w = data.workspace;
		const p = w.kind === 'submitter' ? w.project : w.kind === 'reviewer' ? w.project : null;
		if (!p) return;
		const key = `${p.id}:${p.updatedAt}:${p.codeReviewJson ?? ''}:${p.testingJson ?? ''}`;
		if (key === syncedRoomKey) return;
		syncedRoomKey = key;
		if (p.testingJson) {
			try {
				importTestingStateFromServer(JSON.parse(p.testingJson));
			} catch {
				/* ignore corrupt snapshot */
			}
		}
		if (p.codeReviewJson) {
			try {
				importCategorySessionsFromServer(JSON.parse(p.codeReviewJson));
			} catch {
				/* ignore corrupt snapshot */
			}
		}
	});
</script>

<svelte:head>
	<title>Mobile Messenger — //kood prototype</title>
</svelte:head>

<div class="min-h-screen bg-kood-bg text-kood-text">
	<div class="mx-auto flex min-h-screen max-w-[1700px] flex-col lg:flex-row">
		<aside
			class="flex w-full shrink-0 flex-col border-b border-kood-border lg:w-[240px] lg:border-b-0 lg:border-r lg:px-4 lg:py-5"
		>
			<div class="px-4 pt-4 lg:px-0 lg:pt-0">
				<p class="font-mono text-lg font-semibold tracking-tight text-kood-text">//kood</p>
				<p class="mt-0.5 text-[10px] uppercase tracking-wider text-kood-muted/70">Prototype UI</p>
			</div>

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
					<form method="post" action="?/signout">
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
		</aside>

		<main class="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-8">
			<WorkspaceStrip workspace={data.workspace} />
			{#if reviewSaveContext}
				<ReviewProgressSave
					project={reviewSaveContext.project}
					canMarkComplete={reviewSaveContext.canMarkComplete}
				/>
			{/if}
			{#if app.phase === 'briefing'}
				{#if app.role === 'sandra'}
					<ProjectBriefing />
				{:else}
					<ReviewerBriefingWait />
				{/if}
			{:else if reviewerGate}
				<ReviewerAssignmentPanel />
			{:else if app.phase === 'project_completion'}
				<ProjectCompletionView />
			{:else if app.phase === 'testing'}
				<TestingView />
			{:else if app.phase === 'code_review'}
				<CodeReviewView />
			{:else if app.phase === 'standup'}
				<StandupView />
			{:else if app.phase === 'accept_project'}
				<AcceptView />
			{:else if app.phase === 'feedback_360'}
				<Feedback360View />
			{/if}
		</main>

		<aside
			class="w-full shrink-0 border-t border-kood-border px-4 py-6 lg:w-[300px] lg:border-l lg:border-t-0 lg:px-5 lg:py-8"
		>
			<KoodWorkflowPanel />
			<div class="mt-8">
				<SidebarMeta />
			</div>
			<KoodRightChrome />
		</aside>
	</div>
</div>

<ToastStack />
{#if auth.sessionUser?.role === 'admin'}
	<DevJumpPanel />
{/if}
