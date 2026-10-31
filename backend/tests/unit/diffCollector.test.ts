import { describe, it, expect } from "vitest"
import { DiffCollectorService } from "../../src/services/diff/diffCollector.service.js"

describe("DiffCollectorService", () => {
    it("should filter out package-lock.json and image files", () => {
        const rawDiff = `diff --git a/src/app.ts b/src/app.ts
        --- a/src/app.ts
        +++ b/src/app.ts
        @@ -1,2 +1,3 @@
        const x = 1;
        const y = 2;
        diff --git a/package-lock.json b/package-lock.json
        --- a/package-lock.json
        +++ b/package-lock.json
        @@ -1,2 +1,2 @@
        -"version": "1.0.0"
        +"version": "1.0.1"
        `
        const parsed = DiffCollectorService.parseRawDiff(rawDiff)

        expect(parsed.totalFiles).toBe(1)
        expect(parsed.files[0].newPath).toBe("src/app.ts")
        expect(parsed.totalAdditions).toBe(1)
    })
})