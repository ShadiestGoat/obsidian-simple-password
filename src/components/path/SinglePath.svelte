<script lang="ts">
	import type { App } from 'obsidian'
	import { ProtectedPathType } from 'src/settings'
	import PathWithSuggestion from './PathWithSuggestion.svelte'

	interface Props {
		app: App
		content: string,
		type: ProtectedPathType,
		disabled: boolean
	}

	let {
		app,
		content = $bindable<string>(),
		type = $bindable<ProtectedPathType>(),
		disabled
	}: Props = $props()
</script>

<select class="dropdown" bind:value={type} {disabled}>
	<option value={ProtectedPathType.PREFIX}>Prefix Match (Folders)</option>
	<option value={ProtectedPathType.EXACT}>Exact File</option>
	<option value={ProtectedPathType.GLOB}>Glob Matching</option>
</select>

{#key type}
	<PathWithSuggestion {app} bind:content {disabled} {type} />
{/key}
