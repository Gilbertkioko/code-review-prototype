<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { exportCodeReviewWorkspaceForPersistence, exportTestingStateForPersistence } from '$lib/appState.svelte';

	type Proj = {
		id: string;
		status: string;
	};

	let { project, canMarkComplete }: { project: Proj; canMarkComplete: boolean } = $props();

	let saveForm: HTMLFormElement | undefined = $state();
	let testingField: HTMLInputElement | undefined = $state();
	let codeField: HTMLInputElement | undefined = $state();

	const showSave = $derived(project.status === 'review_active' || project.status === 'repo_submitted');

	function submitSave() {
		const t = testingField;
		const c = codeField;
		const f = saveForm;
		if (!t || !c || !f) return;
		t.value = JSON.stringify(exportTestingStateForPersistence());
		c.value = JSON.stringify(exportCodeReviewWorkspaceForPersistence());
		f.requestSubmit();
	}
</script>

{#if showSave}
	<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-kood-border/50 pt-3">
		<button
			type="button"
			class="rounded-md border border-kood-border bg-kood-bg px-3 py-1.5 text-xs text-kood-text hover:bg-kood-surface-raised"
			onclick={submitSave}
		>
			Save testing &amp; code review
		</button>
		{#if canMarkComplete && project.status === 'review_active'}
			<form
				method="post"
				action="?/markReviewComplete"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						await invalidateAll();
					};
				}}
			>
				<input type="hidden" name="projectId" value={project.id} />
				<button
					type="submit"
					class="rounded-md border border-kood-border px-3 py-1.5 text-xs font-medium text-kood-text hover:bg-kood-surface-raised"
				>
					Mark review complete
				</button>
			</form>
		{/if}
	</div>

	<form
		bind:this={saveForm}
		method="post"
		action="?/saveReviewState"
		class="hidden"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				await invalidateAll();
			};
		}}
	>
		<input type="hidden" name="projectId" value={project.id} />
		<input bind:this={testingField} type="hidden" name="testingPayload" value="" />
		<input bind:this={codeField} type="hidden" name="codeReviewPayload" value="" />
	</form>
{/if}
