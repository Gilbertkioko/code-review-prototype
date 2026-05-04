<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let {
		projectId,
		hasPair = false,
		projectCompleted = false
	}: { projectId: string; hasPair?: boolean; projectCompleted?: boolean } = $props();
</script>

<div
	class="flex flex-col gap-3 rounded-xl border-2 border-kood-accent/35 bg-kood-accent/10 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
>
	<div class="min-w-0 text-xs text-kood-muted">
		<p class="text-sm font-semibold text-kood-text">Reset review cycle</p>
		<p class="mt-1 leading-relaxed">
			Clears testing and code-review progress, standup notes, and 360° feedback saved for this batch. The repo URL
			stays; the reviewer pair stays if you already assigned one. Reviewers must accept assignments again after a
			reset.
		</p>
		{#if projectCompleted}
			<p class="mt-2 text-[11px] font-medium text-amber-200/90">
				This batch is marked <strong class="text-kood-text">completed</strong> — reset clears saved work and moves it
				back to an active review state so the team can run the flow again.
			</p>
		{:else if !hasPair}
			<p class="mt-2 text-[11px] text-kood-muted/90">
				Reviewer pair not assigned yet — you can still reset to clear any partial snapshots before pairing.
			</p>
		{/if}
	</div>
	<form
		method="post"
		action="/admin/projects/{projectId}?/resetReviewCycle"
		class="shrink-0"
		use:enhance={() => async ({ update }) => {
			await update();
			await invalidateAll();
		}}
	>
		<input type="hidden" name="projectId" value={projectId} />
		<button
			type="submit"
			class="w-full rounded-lg bg-kood-accent px-4 py-2.5 text-sm font-bold text-kood-accent-foreground shadow-sm hover:opacity-95 sm:w-auto"
			onclick={(e) => {
				if (
					!confirm(
						projectCompleted
							? 'This project was marked COMPLETE. Reset anyway? All saved testing, code review, standup, and 360° progress will be cleared and the batch will return to an active review state.'
							: 'Reset this project’s review cycle? All saved testing, code review, standup, and 360° progress for this batch will be cleared.'
					)
				) {
					e.preventDefault();
				}
			}}
		>
			Reset review cycle
		</button>
	</form>
</div>
