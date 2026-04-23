<script lang="ts">
	import type { AuditThreadGroup, AuditThreadPersona } from '$lib/server/review-audit';

	let {
		groups,
		emptyLabel = 'Nothing saved yet.'
	}: {
		groups: AuditThreadGroup[];
		emptyLabel?: string;
	} = $props();

	function initials(label: string): string {
		const parts = label.trim().split(/\s+/).filter(Boolean);
		if (parts.length >= 2) {
			const a = parts[0][0] ?? '';
			const b = parts[1][0] ?? '';
			return (a + b).toUpperCase() || '?';
		}
		return label.slice(0, 2).toUpperCase() || '?';
	}

	function personaSlot(persona: AuditThreadPersona | null): string {
		if (persona === 'sandra') return 'Submitter';
		if (persona === 'jane') return 'Reviewer A';
		if (persona === 'joe') return 'Reviewer B';
		return '';
	}

	function whenLabel(at: string): string {
		if (!at) return '—';
		try {
			return new Date(at).toLocaleString();
		} catch {
			return at;
		}
	}

	/** Subtle left stripe + tint so submitter vs reviewers read at a glance (still restrained). */
	function messageRowClass(persona: AuditThreadPersona | null): string {
		const base = 'flex gap-3 border-l-[3px] py-3 pl-3 pr-3 sm:pr-4';
		if (persona === 'sandra') {
			return `${base} border-amber-500/45 bg-amber-500/[0.06]`;
		}
		if (persona === 'jane') {
			return `${base} border-teal-500/40 bg-teal-500/[0.05]`;
		}
		if (persona === 'joe') {
			return `${base} border-violet-400/45 bg-violet-500/[0.05]`;
		}
		return `${base} border-kood-border/60 bg-kood-bg/25`;
	}
</script>

{#if groups.length === 0}
	<p class="text-sm text-kood-muted">{emptyLabel}</p>
{:else}
	<div class="space-y-4">
		{#each groups as g (g.context)}
			<details class="group overflow-hidden rounded-xl border border-kood-border bg-kood-bg/35 open:shadow-sm">
				<summary
					class="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-kood-border/70 bg-kood-surface/60 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden"
				>
					<div class="min-w-0 flex-1">
						<h2 class="text-sm font-medium leading-snug text-kood-text">{g.context}</h2>
						<p class="mt-1 text-[11px] text-kood-muted">
							{g.entries.length} message{g.entries.length === 1 ? '' : 's'} · expand to read the thread
						</p>
					</div>
					<svg
						class="size-5 shrink-0 text-kood-muted transition-transform duration-200 ease-out group-open:rotate-180"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fill-rule="evenodd"
							d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
							clip-rule="evenodd"
						/>
					</svg>
				</summary>
				<div class="divide-y divide-kood-border/35">
					{#each g.entries as t (t.at + t.text.slice(0, 48))}
						<div class={messageRowClass(t.authorPersona ?? null)}>
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kood-border/60 bg-kood-surface/90 text-[11px] font-semibold text-kood-muted"
								aria-hidden="true"
							>
								{initials(t.authorLabel)}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
									<span class="text-sm font-semibold text-kood-text">{t.authorLabel}</span>
									{#if personaSlot(t.authorPersona ?? null)}
										<span
											class="rounded border border-kood-border/50 bg-kood-bg/40 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-kood-muted"
										>
											{personaSlot(t.authorPersona ?? null)}
										</span>
									{/if}
									<span class="text-[11px] tabular-nums text-kood-muted">{whenLabel(t.at)}</span>
									{#if t.round != null}
										<span class="text-[11px] tabular-nums text-kood-muted">· R{t.round}</span>
									{/if}
								</div>
								<p class="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-kood-text/95">{t.text}</p>
							</div>
						</div>
					{/each}
				</div>
			</details>
		{/each}
	</div>
{/if}
