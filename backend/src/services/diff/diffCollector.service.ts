import parseDiff from "parse-diff"
import { DiffFile, DiffHunk, ParsedDiff } from "../../types/index.js"

const IGNORED_EXTENSIONS = [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
    ".woff", ".woff2", ".ttf", ".eot",
    ".pdf", ".zip", ".tar.gz",
    ".map", ".min.js", ".min.css",
]

const IGNORED_FILES = [
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "cargo.lock",
    "gemfile.lock",
    "composer.lock",
]

export class DiffCollectorService {
    static parseRawDiff(rawDiff: string): ParsedDiff {
        if (!rawDiff || rawDiff.trim().length === 0) {
            return {
                files: [],
                totalFiles: 0,
                totalAdditions: 0,
                totalDeletions: 0,
            }
        }
        const parsed = parseDiff(rawDiff)
        let totalAdditions = 0
        let totalDeletions = 0
        const files: DiffFile[] = []

        for (const file of parsed) {
            const filePath = file.to || file.from || "unknown"
            if (this.isIgnoredFile(filePath)) {
                continue
            }
            const hunks: DiffHunk[] = []

            for (const hunk of file.chunks) {
                const lines: string[] = []
                for (const change of hunk.changes) {
                    lines.push(change.content)
                }
                hunks.push({
                    oldStart: hunk.oldStart,
                    oldLines: hunk.oldLines,
                    newStart: hunk.newStart,
                    newLines: hunk.newLines,
                    lines,
                })
            }
            totalAdditions += file.additions
            totalDeletions += file.deletions

            const fileRawDiff = hunks.map((h) => h.lines.join("\n")).join("\n")
            files.push({
                oldPath: file.from || filePath,
                newPath: file.to || filePath,
                isNew: !!file.new,
                isDeleted: !!file.deleted,
                isModified: !file.new && !file.deleted,
                additions: file.additions,
                deletions: file.deletions,
                hunks,
                rawContent: fileRawDiff,
            })
        }
        return {
            files,
            totalFiles: files.length,
            totalAdditions,
            totalDeletions,
        }
    }
    static formatFileForPrompt(file: DiffFile): string {
        let output = `### File: ${file.newPath} (${file.isNew ? "New file" : "Modified"})\n`
        output += `Changes: +${file.additions} / -${file.deletions}\n`
        output += "```\n"

        for (const hunk of file.hunks) {
            output += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@\n`
            let currentNewLine = hunk.newStart
            for (const line of hunk.lines) {
                if (line.startsWith("+")) {
                    output += `[L${currentNewLine}] ${line}\n`
                    currentNewLine++
                } else if (line.startsWith("-")) {
                    output += `[DEL] ${line}\n`
                } else {
                    output += `[L${currentNewLine}] ${line}\n`
                    currentNewLine++
                }
            }
        }
        output += "```\n"
        return output
    }
    private static isIgnoredFile(filePath: string): boolean {
        const lower = filePath.toLowerCase()
        const fileName = lower.split("/").pop() || ""

        if (IGNORED_FILES.includes(fileName)) {
            return true
        }
        return IGNORED_EXTENSIONS.some((ext) => lower.endsWith(ext))
    }
}
