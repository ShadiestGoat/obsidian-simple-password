<svelte:options runes />

<script lang="ts">
	import PasswordInput from './PasswordInput.svelte'

	let newPassword = $state('')
	let conPassword = $state('')
	let oldPassword = $state('')

	interface Props {
		onSubmit: (newPassword: string) => void
		requireOldPassword: boolean
		correctPassword?: string
		hint?: string
	}

	let { requireOldPassword, hint = '', correctPassword = '', onSubmit }: Props = $props()

	let passInp: PasswordInput | undefined = $state()
	let displayMismatch = $derived(
		!!newPassword && !!conPassword && (newPassword != conPassword || newPassword.length < 3)
	)
</script>

<form
	class="sp-container sp-container-new-password"
	onsubmit={(e) => {
		e.preventDefault()
		e.stopPropagation()

		let happy = true

		if (!passInp?.submit(false)) {
			happy = false
		}

		if (newPassword != conPassword) {
			happy = false
		}

		if (happy) {
			onSubmit(newPassword)
		}
	}}
>
	{#if requireOldPassword}
		<PasswordInput
			{correctPassword}
			{hint}
			bind:this={passInp}
			bind:value={oldPassword}
			placeholder="Old Password"
		/>
	{/if}

	<input type="password" placeholder="New password" bind:value={newPassword} />
	<input type="password" placeholder="Confirm password" bind:value={conPassword} />
	{#if displayMismatch}
		{#if newPassword.length < 3}
			<p class="sp-wrong">Password needs to be longer than 3 chracters</p>
		{:else}
			<p class="sp-wrong">Passwords don't match</p>
		{/if}
	{/if}

	<button
		type="submit"
		disabled={!newPassword ||
			!conPassword ||
			!(requireOldPassword && oldPassword) ||
			displayMismatch}
		aria-label="Submit"
		class="mod-cta"
	>
		Submit
	</button>
</form>

<style>
	.sp-container-new-password {
		flex-direction: column;
	}
</style>
