<script lang="ts">
	import type { App } from 'obsidian'
	import { PathSuggestions } from 'src/settings'
	import { onMount } from 'svelte'

	let inputEl: HTMLInputElement

	onMount(() => {
		new PathSuggestions(app, inputEl).onSelect((v) => (path = v))
	})

	interface Props {
		app: App
		path: string
		disabled: boolean
	}

	let { app, path = $bindable(''), disabled }: Props = $props()
</script>

<input type="text" bind:this={inputEl} placeholder="Path" bind:value={path} {disabled} />
