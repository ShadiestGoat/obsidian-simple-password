import { type App, Modal } from 'obsidian'
import { mount, unmount } from 'svelte'
import RequirePassword from './components/RequirePassword.svelte'
import { PrivacyMode, type Settings } from './settings'
import SettingsPassword from './components/SettingsPassword.svelte'

type PasswordCallback = (success: boolean) => void

export class RequirePasswordModal extends Modal {
    svelteContent: Record<string, never>
    settings: Settings
    succeeded: boolean
    callback: PasswordCallback

    constructor(app: App, settings: Settings, cb: PasswordCallback) {
        super(app)

        this.settings = settings
        this.callback = cb
        this.succeeded = false
    }

    onOpen(): void {
        this.setTitle('Password Required!')
        this.shouldRestoreSelection = true
        this.containerEl.addClass('sp-modal-container')
        this.containerEl.toggleClass('sp-modal-blur', this.settings.privacyMode == PrivacyMode.BLUR)

        this.svelteContent = mount(RequirePassword, {
            target: this.contentEl,
            props: {
                correctPassword: this.settings.password,
                hint: this.settings.hint,
                onCorrect: () => {
                    this.succeeded = true
                    this.close()
                }
            }
        })
    }

    close(): void {
        // This needs to be done BEFORE the actual modal closes
        // This is to ensure that everything is clsoed in case of a non-success
        this.callback(this.succeeded)

        super.close()
    }

    async onClose() {
        unmount(this.svelteContent, { outro: true })
    }
}

type NewPasswordCallback = (password: string) => void

export class NewPasswordModal extends Modal {
    svelteContent: Record<string, never>
    settings: Settings
    callback: NewPasswordCallback
    password: string

    constructor(app: App, settings: Settings, cb: NewPasswordCallback) {
        super(app)

        this.settings = settings
        this.callback = cb
        this.password = ''
    }

    onOpen(): void {
        this.setTitle('Password Required!')
        this.shouldRestoreSelection = true
        this.containerEl.addClass('sp-modal-container')
        this.containerEl.toggleClass('sp-modal-blur', this.settings.privacyMode == PrivacyMode.BLUR)

        this.svelteContent = mount(SettingsPassword, {
            target: this.contentEl,
            props: {
                requireOldPassword: this.settings.password != '',
                correctPassword: this.settings.password,
                hint: this.settings.hint,
                onSubmit: (pass) => {
                    this.password = pass
                    this.close()
                }
            }
        })
    }

    async onClose() {
        this.callback(this.password)
        unmount(this.svelteContent, { outro: true })
    }
}
