import { minimatch } from "minimatch"
import { ProtectedPathType } from "./settings"

export function normalizePath(str: string) {
    return decodeURIComponent(new URL(str, 'file://').pathname)
}

export const pathComparer: Record<ProtectedPathType, (content: string, realPath: string) => boolean> = {
    [ProtectedPathType.PREFIX]: (content, realPath) => {
        return realPath.startsWith(content)
    },
    [ProtectedPathType.EXACT]: (content, realPath) => {
        return normalizePath(content) == normalizePath(realPath)
    },
    [ProtectedPathType.GLOB]: (content, realPath) => {
        return minimatch(realPath, content)
    }
}
