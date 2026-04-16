<script lang="ts">
	import { enhance } from '$app/forms';
	import { SIGNUP_ROLES } from '$lib/userRole';

	let { form } = $props();
</script>

<svelte:head>
	<title>Sign up — //kood prototype</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 text-kood-text">
	<h1 class="font-mono text-xl font-semibold">Create an account</h1>
	<p class="mt-2 text-sm text-kood-muted">
		Username: 3–31 chars, lowercase letters, digits, <span class="font-mono">-</span> or
		<span class="font-mono">_</span>. Admin accounts are not available here. This prototype allows
		<strong class="text-kood-text/90">only one submitter account</strong> (first signup wins).
	</p>

	{#if form?.message}
		<p class="mt-4 rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
			{form.message}
		</p>
	{/if}

	<form method="post" class="mt-8 space-y-4" use:enhance>
		<div>
			<label class="block text-xs font-semibold uppercase tracking-wide text-kood-muted" for="email"
				>Email</label
			>
			<input
				class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm"
				type="email"
				id="email"
				name="email"
				autocomplete="email"
				required
			/>
		</div>
		<div>
			<label class="block text-xs font-semibold uppercase tracking-wide text-kood-muted" for="username"
				>Username</label
			>
			<input
				class="mt-1 w-full rounded border border-kood-border bg-kood-bg px-3 py-2 text-sm"
				id="username"
				name="username"
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
				autocomplete="new-password"
				required
			/>
		</div>
		<fieldset>
			<legend class="block text-xs font-semibold uppercase tracking-wide text-kood-muted">Role</legend>
			<p class="mt-1 text-xs text-kood-muted/90">Pick how you will use the app.</p>
			<div class="mt-2 flex flex-col gap-2 text-sm">
				{#each SIGNUP_ROLES as r (r)}
					<label class="flex cursor-pointer items-center gap-2 rounded border border-kood-border px-3 py-2 hover:bg-kood-border/20">
						<input type="radio" name="role" value={r} required checked={r === 'submitter'} />
						<span class="capitalize">{r}</span>
					</label>
				{/each}
			</div>
		</fieldset>
		<button
			type="submit"
			class="w-full rounded bg-kood-text px-4 py-2 text-sm font-medium text-kood-bg hover:opacity-90"
		>
			Sign up
		</button>
	</form>

	<p class="mt-6 text-sm text-kood-muted">
		Already have an account?
		<a class="text-kood-text underline" href="/login">Sign in</a>
	</p>
</div>
