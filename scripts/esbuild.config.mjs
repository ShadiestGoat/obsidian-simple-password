import esbuild from "esbuild"
import process from "process"
import builtins from "builtin-modules"
import esbuildSvelte from 'esbuild-svelte'
import { sveltePreprocess } from 'svelte-preprocess'

const banner =
	`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`

const prod = (process.argv[2] === "production")

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	minify: prod,
	// Fun changes from default
	plugins: [
		esbuildSvelte({
			compilerOptions: {
				css: 'injected',
				runes: true,
			},
			preprocess: sveltePreprocess(),
		}),
	],
	entryPoints: ["src/main.ts", "styles.css"],
	outdir: process.env.OUTPUT || "dist/",
	entryNames: "[name]",
	absWorkingDir: process.env.PROJECT_DIR || process.cwd(),
})

if (prod) {
	await context.rebuild()
	process.exit(0)
} else {
	await context.watch()
}
