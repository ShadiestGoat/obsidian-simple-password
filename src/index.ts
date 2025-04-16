import type { WorkspaceLeaf } from 'obsidian'
import { type TFile } from 'obsidian'
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
    autolockTimeoutID: ReturnType<typeof setTimeout>
    lastHoveredFile: string

    isLocked: boolean
    isLocking = false

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
            }
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

        this.register(() => this.removeAutolock())
        this.registerEvent(
			this.app.workspace.on(
				// @ts-expect-error Undocumented api
                'hover-link',
                ({ linktext }: { linktext: string }) => {
					// Name aside, linktext is always the correct link
					// Though not always an abs path so
					this.lastHoveredFile = linktext
				}
            )
        )

        this.watchDom()

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

    isPathLocked(testPath: string): boolean {
        for (const _p of this.settings.protectedPaths) {
            const p = new URL(_p, 'file://').pathname

            if (('/' + testPath).startsWith(p)) {
                return true
            }
        }

        return false
    }

    watchDom() {
        const domObs = new MutationObserver(() => {
            if (!this.isLocked || this.isLocking) {
                return
            }

            // I decied to add a dom observer clause here, since a user could embed the thing on the fly
            const embedDoc = document.querySelector('.internal-embed[src]')
            if (embedDoc) {
                const path = embedDoc.attributes.getNamedItem('src')?.value
                if (path) {
                    const realPath = this.app.metadataCache.getFirstLinkpathDest(path, '')?.path
                    if (realPath) {
                        const curFile = this.app.workspace.getActiveFile()
                        const curLeaf = this.app.workspace.getMostRecentLeaf()

                        if (curLeaf && curFile) {
                            this.lock(true, [{ leaf: curLeaf, file: curFile }])
                            return
                        }
                    }
                }
            }

            const popover = document.querySelector('.popover.hover-popover')
            if (!popover) return

			console.log("hover", this.lastHoveredFile)

			if (this.isPathLocked(this.lastHoveredFile)) {
                popover.remove()
                this.lock(true)
                return true
            }
        })

        domObs.observe(document.body, {
            childList: true,
            subtree: true
        })

        this.register(() => domObs.disconnect())
    }

    /**
     * Performs all the needed actions to initiate a lock
     */
    async lock(alwaysRequestPassword = false, extraLeaves: SafeLeaf[] = []) {
        this.isLocked = true
        this.isLocking = true
        this.setRibbonIcon(true)
        this.removeAutolock()

        const protectedLeaves: SafeLeaf[] = [...extraLeaves]

        // We always need to know if theres active files, no matter the privacy mode
        this.app.workspace.iterateRootLeaves((l) => {
            if (l?.view instanceof FileView && l.view?.file) {
                if (this.isPathLocked(l.view.file.path)) {
                    protectedLeaves.push({ leaf: l, file: l.view.file })
                }
            }
        })

        if (!alwaysRequestPassword && protectedLeaves.length == 0) {
            this.isLocking = false
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
        console.log('Password requested')

        new RequirePasswordModal(this.app, this.settings, (success) => {
            this.isLocked = !success
            this.isLocking = false

            if (success) {
                this.setRibbonIcon(false)
                this.resetAutolock()
                new Notice('Vault unlocked')

                if (this.settings.privacyMode == PrivacyMode.CLOSE) {
                    protectedViews.forEach((v) => {
                        this.app.workspace.getLeaf('tab').openFile(v.file)
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
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}
