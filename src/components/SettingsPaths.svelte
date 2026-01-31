<script lang="ts">
	import type { App } from 'obsidian'
	import Path from './path/SinglePath.svelte'
	import type { Writable, Readable } from 'svelte/store'
	import { ProtectedPathType, type ProtectedPath } from 'src/settings'

	interface Props {
		paths: Writable<ProtectedPath[]>
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
<div class="setting-item-description">
	These are the actual files, folders or patterns you want to protect. <br />
	For protecting entire folders, make sure there is a '/' at the end. <br />
	<a
		aria-label="Glob Matching Guide Link"
		href="https://www.malikbrowne.com/blog/a-beginners-guide-glob-patterns/"
		rel="noopener nofollow"
		class="external-link"
		target="_blank">Rules for globs can be learn here</a
	>
</div>

<div class="sp-paths">
	{#each $paths as _, i (i)}
		<div class="sp-path-container">
			<Path
				{app}
				bind:content={$paths[i].content}
				bind:type={$paths[i].type}
				disabled={$disabled}
			/>
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
		{...evWrapper(
			() => ($paths = [...$paths, { type: ProtectedPathType.PREFIX, content: '/' }])
		)}
	>
		+
	</button>
</div>

<style>
	.sp-paths {
		margin-top: var(--size-4-2);
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
