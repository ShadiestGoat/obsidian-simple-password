<script lang="ts">
	import { AbstractInputSuggest, App } from 'obsidian'
	import { ProtectedPathType } from 'src/settings'
	import { normalizePath } from 'src/utils'
	import { onMount } from 'svelte'

	interface Props {
        app: App
		type: ProtectedPathType
		content: string
		disabled: boolean
	}

	let { content = $bindable(), type, app, disabled }: Props = $props()

	class PathSuggester extends AbstractInputSuggest<string> {
		filesOnly: boolean

		protected getSuggestions(query: string): string[] {
			const p = normalizePath(query)
			let paths = []
			if (this.filesOnly) {
				paths = this.app.vault.getFiles().map((f) => {
					return f.path
				})
			} else {
				paths = this.app.vault.getAllFolders(true).map((f) => {
					return f.path
				})
			}

			return paths.filter((v) => {
                const sug = '/' + v
                if (sug.startsWith(p)) return true
                if (p.endsWith('/')) return sug == p.slice(0, -1)
				return false
			})
		}

		renderSuggestion(value: string, el: HTMLElement): void {
			el.setText(value)
		}
	}

	let inputEl: HTMLInputElement
    let activeElement = $state<HTMLElement>()

    onMount(() => {
        if (type == ProtectedPathType.GLOB) {
            return
        }

        const suggester = new PathSuggester(app, inputEl).onSelect((v) => {
            content = "/" + v
            if (type == ProtectedPathType.PREFIX) {
                content += '/'
            }
            suggester.close()
        })
        suggester.filesOnly = type == ProtectedPathType.EXACT
    })

    // $effect(() => {
    //     if (disabled || activeElement != inputEl || type == ProtectedPathType.GLOB) {
	// 		console.log("Closing...")
	// 		suggester?.close()
	// 		return
	// 	}

	// 	if (!suggester) {
	// 		suggester = new PathSuggester(app, inputEl).onSelect((v) => {
	// 			content = "/" + v
	// 			if (type == ProtectedPathType.PREFIX) {
	// 				content += '/'
	// 			}
	// 			suggester.close()
	// 		})
	// 		suggester.filesOnly = type == ProtectedPathType.EXACT
	// 	}

	// 	suggester.open()
    // })
</script>

<input type="text" bind:this={inputEl} placeholder="Matcher" bind:value={content} {disabled} />

<svelte:document bind:activeElement={activeElement} />
