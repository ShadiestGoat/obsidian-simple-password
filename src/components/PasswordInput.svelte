<script lang="ts">
	let wrongCount = $state(0)

	interface Props {
		correctPassword: string
		hint: string
		value?: string
		placeholder?: string
	}

	let { correctPassword, hint, value = $bindable(''), placeholder = 'Password' }: Props = $props()

	export function submit(shoulClear: boolean): boolean {
		const correct = value == correctPassword

		if (shoulClear) {
			value = ''
		}

		if (correct) {
			return true
		}

		wrongCount++

		return false
	}
</script>

<div class="sp-password-input">
	<!-- svelte-ignore a11y_autofocus -->
	<!-- This is only rendered in modals, at which point focus SHOULD jump to the new element -->
	<input type="password" {placeholder} autofocus bind:value />
	{#if wrongCount > 0}
		<p class="sp-wrong">
			Wrong Password!
			{#if wrongCount > 2 && hint}
				Hint: <span class="sp-hint">{hint}</span>
			{/if}
		</p>
	{/if}
</div>

<style>
	.sp-hint {
		font-style: italic;
	}

	.sp-password-input {
		width: 100%;
	}

	input {
		width: 100%;
	}
</style>
