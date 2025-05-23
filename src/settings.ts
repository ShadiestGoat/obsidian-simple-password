import type { App, ButtonComponent } from 'obsidian'
import { AbstractInputSuggest, Notice, PluginSettingTab, Setting } from 'obsidian'
import type SimplePassword from 'src/main'
import { NewPasswordModal, RequirePasswordModal } from './modals'
import SettingsPaths from './components/SettingsPaths.svelte'
import { mount, unmount } from 'svelte'
import { writable, get } from 'svelte/store'

export enum PrivacyMode {
	BLUR = 'blur',
	CLOSE = 'close',
	NONE = ''
}

export interface Settings {
	autoLockMinutes: number
	privacyMode: PrivacyMode
	protectedPaths: string[]
	hint: string
	password: string
	blockGraph: boolean
}

export const DEFAULT_SETTINGS: Settings = {
	autoLockMinutes: 15,
	privacyMode: PrivacyMode.BLUR,
	protectedPaths: ['/'],
	hint: '',
	password: '',
	blockGraph: true
}

export class SettingsTab extends PluginSettingTab {
	plugin: SimplePassword
	lockBtn: ButtonComponent
	lockSet: Setting
	lockableSettings: Setting[]
	svelteComp: SettingsPaths
	passwordSetting: {
		setting?: Setting
		btn?: ButtonComponent
	} = {}

	locked = writable(true)

	constructor(app: App, plugin: SimplePassword) {
		super(app, plugin)

		this.plugin = plugin

		this.locked.subscribe((v) => {
			if (!this.lockableSettings || !this.lockBtn || !this.lockSet) return

			if (v) {
				this.lockBtn.setIcon('unlock')
				this.lockSet.setName('Unlock settings below')
			} else {
				this.lockBtn.setIcon('lock')
				this.lockSet.setName('Lock settings below')
			}

			this.lockableSettings.forEach((s) => {
				s.setDisabled(v)
			})
		})
	}

	display() {
		const { containerEl } = this

		containerEl.empty()
		containerEl.addClass('sp-settings')

		this.passwordSetting.setting = new Setting(containerEl).addButton((btn) => {
			this.passwordSetting.btn = btn

			btn.setCta().onClick(() => {
				this.onPasswordChangeButton()
			})
		})

		this.updateDisplayInPasswordBtn()

		this.lockSet = new Setting(containerEl)
			.setName('Unlock settings below')
			.setDesc(
				'The following settings are sensetive, and therefore require that you enter your password'
			)
			.addButton((btn) => {
				btn.setIcon('unlock').onClick(() => this.onLockBtn())
				this.lockBtn = btn
			})
			.setDisabled(this.plugin.settings.password == '')

		containerEl.createEl('hr')

		this.lockableSettings = [
			new Setting(containerEl)
				.setName('Auto lock minutes')
				.setDesc('After x minutes of inactivity, lock the vault. Set to 0 for no auto lock')
				.addText((text) => {
					text.setPlaceholder('# of Minutes').setValue(
						this.plugin.settings.autoLockMinutes.toString()
					)
					text.inputEl.type = 'number'
					text.onChange((v) => {
						const f = parseFloat(v)
						if (!isNaN(f)) {
							this.plugin.settings.autoLockMinutes = f
							this.plugin.resetAutolock()
							this.plugin.saveSettings()
						}
					})
				})
				.setDisabled(true),
			new Setting(containerEl)
				.setName('Privacy mode')
				.setDesc('What should we do on lock?')
				.addDropdown((drop) => {
					drop.addOptions({
						[PrivacyMode.BLUR]: 'Blur background',
						[PrivacyMode.CLOSE]: 'Close affected tabs',
						[PrivacyMode.NONE]: 'Nothing'
					})
						.onChange((v) => {
							this.plugin.settings.privacyMode = v as PrivacyMode
							this.plugin.saveSettings()
						})
						.setValue(this.plugin.settings.privacyMode)
				})
				.setDisabled(true),
			new Setting(containerEl)
				.setName('Lock graph view')
				.setDesc(
					'If true, will lock the graph view\nNOTE: This does NOT account for paths of any files'
				)
				.addToggle((toggle) => {
					toggle
						.onChange((v) => {
							this.plugin.settings.blockGraph = v
							this.plugin.saveSettings()
						})
						.setValue(this.plugin.settings.blockGraph)
				})
				.setDisabled(true),
			new Setting(containerEl)
				.setName('Hint')
				.setDesc('Add a hint for your password (shown in case of > 3 failed attempts)')
				.addText((text) => {
					text.setPlaceholder('Hint')
						.onChange((v) => {
							this.plugin.settings.hint = v
							this.plugin.saveSettings()
						})
						.setValue(this.plugin.settings.hint)
				})
				.setDisabled(true)
		]

		const paths = writable(this.plugin.settings.protectedPaths)
		paths.subscribe((v) => {
			this.plugin.settings.protectedPaths = v
			this.plugin.saveSettings()
		})

		this.svelteComp = mount(SettingsPaths, {
			target: containerEl,
			props: {
				app: this.app,
				disabled: this.locked,
				paths
			}
		})
	}

	updateDisplayInPasswordBtn() {
		this.passwordSetting.setting!.setName(
			this.plugin.settings.password ? 'Change password' : 'Set password'
		)
		this.passwordSetting.btn!.setButtonText(this.plugin.settings.password ? 'Change' : 'Set')
	}

	onLockBtn() {
		if (get(this.locked)) {
			new RequirePasswordModal(this.app, this.plugin.settings, (success) => {
				if (success) {
					this.locked.set(false)
				}
			}).open()
		} else {
			this.locked.set(true)
		}
	}

	onPasswordChangeButton() {
		new NewPasswordModal(this.app, this.plugin.settings, (p) => {
			if (p) {
				new Notice('Password changed')
				this.plugin.settings.password = p
				this.plugin.saveSettings()

				this.lockSet.setDisabled(false)
				this.locked.set(true)
			} else {
				new Notice('Password change cancelled')
			}

			this.updateDisplayInPasswordBtn()
		}).open()
	}

	hide(): void {
		unmount(this.svelteComp)
		super.hide()
	}
}

export class PathSuggestions extends AbstractInputSuggest<string> {
	protected getSuggestions(query: string): string[] {
		const p = new URL(query, 'file://').pathname

		return this.app.vault
			.getAllFolders(true)
			.filter((v) => {
				if (('/' + v.path).startsWith(p)) {
					return true
				}
			})
			.map((v) => v.path)
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		el.setText(value)
	}
}
