import type { View, WorkspaceLeaf } from 'obsidian'
import type SimplePassword from './main'

const blockedSearch = Symbol('Managed by Simple Password')

// These are minimum types needed to accomplish my goal
type SearchQuery = {
	matcher: {
		match: (v: { strings: { filepath: string } }) => unknown | Record<string, unknown>
	}
}

export type SearchView = View & {
	[blockedSearch]?: boolean
	searchQuery: SearchQuery
	startSearch: () => void
}

export function modifySearchLeaf(this: SimplePassword, leafId: string) {
	const l = this.app.workspace.getLeafById(leafId) as WorkspaceLeaf & { view: SearchView }
	if (!l) return

	if (l.view[blockedSearch]) return
	l.view[blockedSearch] = true

	let curQuery = l.view.searchQuery
	Object.defineProperty(l.view, 'searchQuery', {
		configurable: true,
		enumerable: true,
		get: () => curQuery,
		set: (newValue: SearchQuery) => {
			const og = newValue.matcher.match.bind(newValue.matcher)

			// Args are just in case extra stuff ever DOES get passed in
			newValue.matcher.match = (t, ...args) => {
				if (this.isLocked && this.isPathLocked(t.strings.filepath)) {
					return null
				}

				return og(t, ...args)
			}

			curQuery = newValue
		}
	})

	l.view.startSearch()

	this.register(() => {
		const l = this.app.workspace.getLeafById(leafId) as WorkspaceLeaf & { view: SearchView }
		if (!l || !l.view || !l.view[blockedSearch]) return

		delete l.view[blockedSearch]
		Object.defineProperty(l.view, 'searchQuery', {
			configurable: true,
			enumerable: true,
			value: curQuery,
			writable: true
		})
		l.view.startSearch()
	})
}
