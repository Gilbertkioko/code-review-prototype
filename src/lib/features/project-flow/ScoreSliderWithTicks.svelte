<script lang="ts">
	const TICKS = [0, 1, 2, 3, 4, 5] as const;

	let {
		disabled = false,
		score,
		id,
		onChange,
		class: className = ''
	}: {
		disabled?: boolean;
		score: number | null;
		id?: string;
		onChange: (next: number | null) => void;
		class?: string;
	} = $props();

	const rangeValue = $derived(score == null ? 0 : score);
	const selectedTick = $derived(score == null ? 0 : score);

	function applyRaw(raw: number) {
		if (!Number.isFinite(raw)) onChange(null);
		else onChange(raw === 0 ? null : raw);
	}
</script>

<div class="space-y-2 {className}">
	<input
		{id}
		type="range"
		min="0"
		max="5"
		step="1"
		{disabled}
		value={rangeValue}
		class="h-2 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-kood-border/70 accent-kood-accent disabled:cursor-not-allowed disabled:opacity-50"
		aria-valuemin={0}
		aria-valuemax={5}
		aria-valuenow={rangeValue}
		oninput={(e) => applyRaw(Number((e.currentTarget as HTMLInputElement).value))}
	/>
	<div
		class="flex justify-between gap-0.5 text-[11px] tabular-nums"
		role="radiogroup"
		aria-label="Score: 0 is unset, 1 to 5 rubric"
	>
		{#each TICKS as tick (tick)}
			<button
				type="button"
				{disabled}
				class="min-w-0 flex-1 py-0.5 text-center font-medium transition-colors focus-visible:outline-none focus-visible:underline disabled:cursor-not-allowed disabled:opacity-40 {selectedTick === tick
					? 'text-kood-accent'
					: 'text-kood-muted hover:text-kood-text'}"
				role="radio"
				aria-checked={selectedTick === tick}
				aria-label={tick === 0 ? 'Unset (0)' : `Score ${tick}`}
				onclick={() => onChange(tick === 0 ? null : tick)}
			>
				{tick}
			</button>
		{/each}
	</div>
</div>
