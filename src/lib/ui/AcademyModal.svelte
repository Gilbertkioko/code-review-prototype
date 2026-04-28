<script lang="ts">
	import { academyModalOpen, academyModalCategory } from '$lib/stores';
	import Modal from '$lib/ui/Modal.svelte';
	import { CATEGORIES } from '$lib/constants';

	let selectedCategory = $state(CATEGORIES[0]);

	$effect(() => {
		selectedCategory = CATEGORIES.find((c) => c.id === $academyModalCategory) || CATEGORIES[0];
	});

	function closeModal() {
		academyModalOpen.set(false);
	}

	function getDetailText(obsId: string): string {
		switch (obsId) {
			case 's1':
				return 'Input sanitization is your first line of defense. Treat every external value as suspicious and validate it before it touches your database, template, or command execution path.';
			case 's2':
				return 'Authentication is the gatekeeper. Use strong server-side validation, session controls, and hashed credentials so users cannot impersonate someone else by changing a client value.';
			case 's3':
				return 'Authorization is an ongoing check, not a one-time decision. Verify permissions on every request and avoid exposing resources by ID alone.';
			case 's4':
				return 'Sensitive data should be shielded, not scattered. Keep secrets out of code, limit who can see them, and never log personal or credential data.';
			case 's5':
				return 'Dependencies are part of your attack surface. Update libraries regularly, remove unused packages, and scan for vulnerabilities before shipping.';
			case 'cr1':
				return 'Correctness means the feature works the way it was intended. Use requirements as your checklist and confirm the behavior matches the story.';
			case 'cr2':
				return 'Edge cases are where bugs hide. Think about empty values, unusual inputs, and boundary conditions that can break otherwise normal flow.';
			case 'cr3':
				return 'Validation protects the system from bad data. Check type, range, and format before data enters the core logic.';
			case 'cr4':
				return 'Data integrity keeps the system honest. Make related updates together and avoid leaving partial states behind.';
			case 'cr5':
				return 'Logic should follow the intent clearly. If the code feels hard to trace, ask whether a simpler approach or clearer condition would help.';
			case 'p1':
				return 'Performance is about scale. Ask whether this code still performs well as input grows and whether a better algorithm would save time.';
			case 'p2':
				return 'Database efficiency matters. Look for repeated queries, over-fetching, and queries that could be batched or indexed.';
			case 'p3':
				return 'Memory matters when data grows. Avoid loading everything at once and prefer streaming, pagination, or incremental processing.';
			case 'p4':
				return 'I/O can be expensive. Reuse resources, avoid duplicate calls, and group work so network and disk operations happen less often.';
			case 'p5':
				return 'Caching helps repeated work. Cache only what makes sense, and keep the invalidation logic as simple as possible.';
			case 'st1':
				return 'Good structure keeps concerns separated. Don’t let UI details leak into business logic or database code.';
			case 'st2':
				return 'Organized modules are easier to navigate. Group related responsibilities together and keep file scope focused.';
			case 'st3':
				return 'Dependencies should flow cleanly. Avoid tangled imports and keep coupling low so the code stays easy to change.';
			case 'st4':
				return 'Layer boundaries make systems stable. Keep transport, domain, and persistence responsibilities distinct.';
			case 'st5':
				return 'A cohesive module does one job well. If a file feels like a grab bag, split it into smaller focused pieces.';
			default:
				return '';
		}
	}

	function getPrompt(obsId: string): string {
		switch (obsId) {
			case 's1':
				return 'Does this input get validated before use?';
			case 's2':
				return 'Could someone bypass login or impersonate another user?';
			case 's3':
				return 'Are access checks applied before every sensitive action?';
			case 's4':
				return 'Is any secret or personal data exposed in logs or config?';
			case 's5':
				return 'Are third-party packages up to date and minimal?';
			case 'cr1':
				return 'Does this do exactly what the user story requires?';
			case 'cr2':
				return 'What happens when the input is empty or extreme?';
			case 'cr3':
				return 'Is invalid data blocked early?';
			case 'cr4':
				return 'Could this update leave the system in a partial state?';
			case 'cr5':
				return 'Can you follow the logic without guessing?';
			case 'p1':
				return 'Will this code still feel fast with larger input?';
			case 'p2':
				return 'Does the database do more work than it needs to?';
			case 'p3':
				return 'Could this use less memory for the same result?';
			case 'p4':
				return 'Are network/file requests repeated unnecessarily?';
			case 'p5':
				return 'Could a small cache save repeated work?';
			case 'st1':
				return 'Does each part of the code have one clear responsibility?';
			case 'st2':
				return 'Would a new team member find this structure obvious?';
			case 'st3':
				return 'Does this module depend on too many others?';
			case 'st4':
				return 'Can this layer change without breaking the rest?';
			case 'st5':
				return 'Is this file doing more than one thing?';
			default:
				return '';
		}
	}

	function getAction(obsId: string): string {
		switch (obsId) {
			case 's1':
				return 'Find the nearest user input flow and confirm it is validated or escaped before use.';
			case 's2':
				return 'Review the login flow and check if the server still verifies the session on every request.';
			case 's3':
				return 'Trace one sensitive endpoint and verify access is checked before data is returned.';
			case 's4':
				return 'Search for secrets in code or logs, then move them to safe storage and mute them from output.';
			case 's5':
				return 'Open your dependency list and confirm none of the packages are stale or unused.';
			case 'cr1':
				return 'Match the implementation against a concrete requirement and mark anything that is missing.';
			case 'cr2':
				return 'Pick the most unusual input and simulate it to see whether the system still behaves safely.';
			case 'cr3':
				return 'Locate the first point where data enters the app and add a validation guard if needed.';
			case 'cr4':
				return 'Check the transaction or update path for any early returns that leave data inconsistent.';
			case 'cr5':
				return 'Read through the logic out loud and ensure each branch matches the intended behavior.';
			case 'p1':
				return 'Review the algorithm and ask whether it can be simplified or made more efficient.';
			case 'p2':
				return 'Identify one query and see if it can be combined with another or reduced in scope.';
			case 'p3':
				return 'Find a large data structure and decide whether batching or pagination would help.';
			case 'p4':
				return 'Group repeated I/O work together so the app does fewer trips for the same result.';
			case 'p5':
				return 'Pick one expensive operation and think how a cache could reduce repeated cost.';
			case 'st1':
				return 'Separate the next key responsibility you see into its own layer or module.';
			case 'st2':
				return 'Restructure one file or folder so similar concerns live together.';
			case 'st3':
				return 'Identify a dependency chain that is too deep and see if it can be simplified.';
			case 'st4':
				return 'Name the layer boundaries clearly and avoid leaking lower-level details upward.';
			case 'st5':
				return 'Refactor one large module into two smaller, more focused pieces.';
			default:
				return '';
		}
		}

	function getDidYouKnow(categoryId: string): string {
		switch (categoryId) {
			case 'security':
				return 'Security first: if input is inzvolved, treat it like a potential risk until proven safe.';
			case 'correctness':
				return 'Correctness is not just “works”; it is “works for the weird case too.”';
			case 'performance':
				return 'Small inefficiencies add up fast. Spot them early and save future rework.';
			case 'structure_architecture':
				return 'Clear structure is the best way to make code review fast and low-risk.';
			default:
				return '';
		}
	}
</script>

<Modal open={$academyModalOpen} title="Code Review Academy" maxWidth="max-w-2xl">
	{#snippet children()}
		<div class="academy-modal">
			<div class="top-row">
				<p class="intro">Review guidance for this category - use the questions and actions to improve your code review.</p>
				<p class="tip">{getDidYouKnow(selectedCategory.id)}</p>
			</div>

			<div class="category-content">
				<h3>{selectedCategory.title}</h3>
				<p class="blurb">{selectedCategory.assignmentBlurb}</p>

				<div class="observations">
					{#each selectedCategory.observations as obs}
						<div class="observation">
							<div class="obs-header">
								<h4>{obs.text}</h4>
								<span class="obs-prompt">Ask: {getPrompt(obs.id)}</span>
							</div>
							<p class="detail">{getDetailText(obs.id)}</p>
							<div class="obs-action">Try this: {getAction(obs.id)}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<button
			type="button"
			class="rounded-lg border border-kood-border bg-kood-surface px-4 py-2 text-sm font-medium text-kood-text hover:bg-kood-surface-raised"
			onclick={closeModal}
		>
			Close
		</button>
	{/snippet}
</Modal>

<style>
	.academy-modal {
		max-height: 70vh;
		overflow-y: auto;
		padding-right: 2px;
	}

	.top-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: baseline;
		margin-bottom: 16px;
	}

	.intro {
		flex: 1 1 100%;
		margin: 0;
		font-size: 0.95rem;
		color: var(--kood-text);
	}

	.tip {
		margin: 0;
		padding: 10px 14px;
		border-radius: 999px;
		background: rgba(220, 249, 0, 0.08);
		color: var(--kood-text);
		font-size: 0.85rem;
		font-weight: bold;
		border: 1px solid rgba(220, 249, 0, 0.2);
	}

	.category-chips {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 10px;
		margin-bottom: 20px;
	}

	.category-content h3 {
		margin: 0 0 8px 0;
		color: var(--kood-text);
		font-size: 1.15rem;
	}

	.blurb {
		margin: 0 0 20px 0;
		color: var(--kood-text);
		font-size: 0.95rem;
		font-style: italic;
	}

	.observations {
		display: grid;
		gap: 16px;
	}

	.observation {
		padding: 16px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.03);
	}

	.obs-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 10px;
	}

	.obs-header h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: var(--kood-text);
	}

	.obs-prompt {
		font-size: 0.82rem;
		color: var(--kood-accent);
		font-weight: 700;
		white-space: nowrap;
	}

	.detail {
		margin: 0 0 12px;
		color: var(--kood-text);
		line-height: 1.6;
		font-size: 0.92rem;
	}

	.obs-action {
		padding: 12px 14px;
		border-radius: 12px;
		background: rgba(220, 249, 0, 0.08);
		color: var(--kood-text);
		font-size: 0.9rem;
		border: 1px solid rgba(220, 249, 0, 0.2);
	}

	button:hover {
		outline: none;
	}
</style>