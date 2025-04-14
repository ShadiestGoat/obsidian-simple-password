import {
    App,
    Editor,
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
	TFile
} from 'obsidian'

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
    mySetting: string
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings
	ribbonIconEl: HTMLElement

    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'open-sample-modal-simple',
            name: 'Open sample modal (simple)',
            callback: () => {
                new SampleModal(this.app).open()
            }
        })

		this.registerEvent(this.app.workspace.on('file-open', (f: TFile | null) => {
			if (!f) return

		}))

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this))

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000))
    }

	isPathLocked(p: string) {
		this.settings.
	}

	/**
	 * Performs all the needed actions to initiate a lock
	 */
	async lock() {
	}

	/**
	 * Performs everything that needs to be done in order to set ourselfs into an unlock state
	 */
	async unlock() {

	}
}

class SampleModal extends Modal {
    constructor(app: App) {
        super(app)
    }

    onOpen() {
        const { contentEl } = this
        contentEl.setText('Woah!')
    }

    onClose() {
        const { contentEl } = this
        contentEl.empty()
    }
}

class SampleSettingTab extends PluginSettingTab {
    plugin: MyPlugin

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const { containerEl } = this

        containerEl.empty()

        new Setting(containerEl)
            .setName('Setting #1')
            .setDesc("It's a secret")
            .addText((text) =>
                text
                    .setPlaceholder('Enter your secret')
                    .setValue(this.plugin.settings.mySetting)
                    .onChange(async (value) => {
                        this.plugin.settings.mySetting = value
                        await this.plugin.saveSettings()
                    })
            )
    }
}
