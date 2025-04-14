// @ts-check

import js from '@eslint/js'
import ts from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import-x'
import stylistic from '@stylistic/eslint-plugin'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import svelte from 'eslint-plugin-svelte'

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	importPlugin.flatConfigs.recommended,
	{
		plugins: {
			'@stylistic': stylistic
		}
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
			},
		}
	},
	{
		ignores: ['main.js'],
	},
	{
		settings: {
			'import-x/resolver-next': [
				createTypeScriptImportResolver()
			]
		}
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true
				}
			],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{
					prefer: 'type-imports',
					disallowTypeAnnotations: true,
					fixStyle: 'separate-type-imports'
				}
			],
			'@stylistic/semi': ['error', 'never'],
			'@stylistic/no-trailing-spaces': 'warn',
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					"patterns": [{
						"group": ["moment"],
						"allowTypeImports": true,
						"message": "Type only import, use obisidan.moment"
					}]
				}
			],
			'svelte/no-dupe-on-directives': 'error',
			'svelte/no-dupe-use-directives': 'error',
			'svelte/no-target-blank': 'warn',
			'svelte/block-lang': [
				'error',
				{
					script: ['ts'],
				}
			],
			'svelte/require-event-dispatcher-types': 'warn',
			'svelte/require-optimized-style-attribute': 'warn',
			'svelte/prefer-style-directive': 'warn',
			'svelte/prefer-class-directive': 'warn',
			// Breaks svelete >:(
			'import-x/no-duplicates': 'off'
		}
	}
)
