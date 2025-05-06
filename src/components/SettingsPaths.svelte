<script lang="ts">
	import type { App } from 'obsidian'
	import Path from './Path.svelte'
	import type { Writable, Readable } from 'svelte/store'

	interface Props {
		paths: Writable<string[]>
		app: App
		disabled: Readable<boolean>
	}

	let { paths, app, disabled }: Props = $props()

	function evWrapper(cb: () => void): {
		onkeypress: (e: KeyboardEvent) => void
		onclick: () => void
	} {
		return {
			onclick: cb,
			onkeypress: (e) => {
				if (e.key == ' ' || e.key == 'Enter') {
					cb()
				}
			}
		}
	}
</script>

<hr />

<h3>Protected paths</h3>

<div class="sp-paths">
	{#each $paths as _, i (i)}
		<div class="sp-path-container">
			<Path {app} bind:path={$paths[i]} disabled={$disabled} />
			<button
				disabled={$disabled}
				class="mod-err"
				aria-label="Remove path"
				{...evWrapper(() => {
					$paths.splice(i, 1)

					$paths = $paths
				})}
			>
				-
			</button>
		</div>
	{/each}

	<button
		disabled={$disabled}
		class="mod-cta"
		aria-label="Add new path"
		{...evWrapper(() => ($paths = [...$paths, '/']))}
	>
		+
	</button>
</div>

<style>
	.sp-paths {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-2);
	}

	.mod-err {
		background: var(--background-modifier-error);
	}

	.sp-path-container {
		flex-grow: 1;
	}
</style>
