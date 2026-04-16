<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Sign in — //kood prototype</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 text-kood-text">
	<h1 class="font-mono text-xl font-semibold">Sign in</h1>
	<p class="mt-2 text-sm text-kood-muted">Use the email or username you registered with.</p>

	{#if form?.message}
		<p class="mt-4 rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
			{form.message}
		</p>
	{/if}

	<form method="post" class="mt-8 space-y-4" use:enhance>
		<div>
			<label class="block text-xs font-semibold uppercase tracking-wide text-kood-muted" for="identifier"
				>Email or username</label
			>
			<input
				class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm"
				id="identifier"
				name="identifier"
				autocomplete="username"
				required
			/>
		</div>
		<div>
			<label class="block text-xs font-semibold uppercase tracking-wide text-kood-muted" for="password"
				>Password</label
			>
			<input
				class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm"
				type="password"
				id="password"
				name="password"
				autocomplete="current-password"
				required
			/>
		</div>
		<button
			type="submit"
			class="w-full rounded bg-kood-text px-4 py-2 text-sm font-medium text-kood-bg hover:opacity-90"
		>
			Sign in
		</button>
	</form>

	<p class="mt-6 text-sm text-kood-muted">
		New here?
		<a class="text-kood-text underline" href="/signup">Create an account</a>
	</p>
</div>
