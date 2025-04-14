import type { TFile, WorkspaceLeaf } from 'obsidian'
import { FileView, Notice, Plugin, setIcon } from 'obsidian'
import type { Settings } from './settings'
import { DEFAULT_SETTINGS, PrivacyMode, SettingsTab } from './settings'
import { RequirePasswordModal } from './modals'

const STR_RIBBON_LOCKED = 'Vault is locked'
const STR_RIBBON_UNLOCKED = 'Vault is unlocked'
const ICON_RIBBON_LOCKED = 'lock'
const ICON_RIBBON_UNLOCKED = 'unlock'

// So we have a problem when closing tabs: the File is set to null
type SafeLeaf = {
    leaf: WorkspaceLeaf
    file: TFile
}

export default class SimplePassword extends Plugin {
    settings: Settings
    ribbonIconEl: HTMLElement
    isLocked: boolean
    popoverObserver: MutationObserver
    autolockTimeoutID: ReturnType<typeof setTimeout>

    async onload() {
        await this.loadSettings()
        this.isLocked = true

        this.ribbonIconEl = this.addRibbonIcon(ICON_RIBBON_LOCKED, STR_RIBBON_LOCKED, () => {
            this.onIconClick()
        })

        this.addCommand({
            id: 'sp-lock-vault',
            name: 'Lock Vault',
            callback: () => {
                this.lock()
            },
            hotkeys: [
                {
                    key: 'l',
                    modifiers: ['Ctrl', 'Shift']
                }
            ]
        })

        this.registerObsidianProtocolHandler('lock', () => {
            this.lock()
        })

        this.registerEvent(
            this.app.workspace.on('file-open', (f: TFile | null) => {
                if (!f || !this.isLocked) return

                if (this.isPathLocked(f.path)) {
                    this.lock()
                }
            })
        )

        this.app.workspace.onLayoutReady(() => {
            ;['create', 'modify', 'delete', 'rename'].forEach((evName) => {
                this.registerEvent(
                    // @ts-expect-error Overloads + Paramters don't play well
                    this.app.vault.on(evName, () => {
                        this.resetAutolock()
                    })
                )
            })
        })

        this.beginWatchingPopover()

        this.addSettingTab(new SettingsTab(this.app, this))

        // If there are any unprotected things, lock!
        this.lock()
    }

    removeAutolock(): void {
        if (this.autolockTimeoutID) {
            clearTimeout(this.autolockTimeoutID)
        }
    }

    resetAutolock(): void {
        this.removeAutolock()

        if (this.settings.autoLockMinutes) {
            this.autolockTimeoutID = setTimeout(
                () => {
                    this.lock()
                },
                60 * 1000 * this.settings.autoLockMinutes
            )
        }
    }

    onunload(): void {
        this.popoverObserver.disconnect()
        this.removeAutolock()
    }

    isPathLocked(testPath: string): boolean {
        for (const _p of this.settings.protectedPaths) {
            const p = new URL(_p, 'file://').pathname

            if (('/' + testPath).startsWith(p)) {
                return true
            }
        }

        return false
    }

    beginWatchingPopover() {
        this.popoverObserver = new MutationObserver(() => {
            if (!this.isLocked) {
                return
            }
            const popover = document.querySelector('.popover.hover-popover')
            if (!popover) return

            document.querySelectorAll('*:hover[data-path]').forEach((e) => {
                const path = e.attributes.getNamedItem('data-path')

                if (path?.value && this.isPathLocked(path.value)) {
                    popover.remove()
                    this.lock(true)
                }
            })
        })

        this.popoverObserver.observe(document.body, {
            childList: true,
            subtree: true
        })
    }

    /**
     * Performs all the needed actions to initiate a lock
     */
    async lock(alwaysRequestPassword = false) {
        this.isLocked = true
        this.setRibbonIcon(true)
        this.removeAutolock()

        const protectedLeaves: SafeLeaf[] = []

        // We always need to know if theres active files, no matter the privacy mode
        this.app.workspace.iterateRootLeaves((l) => {
            if (l?.view instanceof FileView && l.view?.file) {
                if (this.isPathLocked(l.view.file.path)) {
                    protectedLeaves.push({ leaf: l, file: l.view.file })
                }
            }
        })

        if (!alwaysRequestPassword && protectedLeaves.length == 0) {
            return
        }

        if (this.settings.privacyMode == PrivacyMode.CLOSE) {
            protectedLeaves.forEach((v) => {
                v.leaf.detach()
            })
        }

        this.requestUserToUnlock(protectedLeaves)
    }

    requestUserToUnlock(protectedViews: SafeLeaf[] = []) {
        console.log('Please password :3')

        new RequirePasswordModal(this.app, this.settings, (success) => {
            this.isLocked = !success

            if (success) {
                this.setRibbonIcon(false)
                this.resetAutolock()
                new Notice('Vault unlocked')

                if (this.settings.privacyMode == PrivacyMode.CLOSE) {
                    protectedViews.forEach((v) => {
                        console.log('WOOOO', v.file)

                        this.app.workspace.getLeaf('tab').openFile(v.file as TFile)
                    })
                }
            } else {
                new Notice('Password prompt cancelled')

                if (this.settings.privacyMode == PrivacyMode.BLUR) {
                    protectedViews.forEach((v) => v.leaf.detach())
                }
            }
        }).open()
    }

    onIconClick() {
        if (this.isLocked) {
            this.requestUserToUnlock()
        } else {
            this.lock()
        }
    }

    setRibbonIcon(locked: boolean) {
        this.ribbonIconEl.ariaLabel = locked ? STR_RIBBON_LOCKED : STR_RIBBON_UNLOCKED
        setIcon(this.ribbonIconEl, locked ? ICON_RIBBON_LOCKED : ICON_RIBBON_UNLOCKED)
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
        console.log('Loading...', this.settings)
    }
    async saveSettings() {
        await this.saveData(this.settings)
    }
}
