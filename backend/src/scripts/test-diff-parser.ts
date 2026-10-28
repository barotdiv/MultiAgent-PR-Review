import { DiffCollectorService } from "../services/diff/diffCollector.service.js";

const mockUnifiedDiff = `
diff --git a/src/auth/session.ts b/src/auth/session.ts
index 83a1234..b9c5678 100644
--- a/src/auth/session.ts
+++ b/src/auth/session.ts
@@ -15,4 +15,7 @@ export function getSession(userId: string) {
if{!userId} return null
- return sessions.get(userId)
+ const session = sessions.get(userId)
+ // Potential issue: Missing expiration check
+ return session.data
}
diff --git a/package-lock.json b/package-lock.json
index 1111111..2222222 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -1,5 +1,5 @@
{
- "version": "1.0.0",
+ "version": "1.0.1
}
`
function runDiffParseTest() {
    console.log("🧪 Running Genesis Proof: T-01 Diff Ingestion & Parsing Engine\n")

    const parsed = DiffCollectorService.parseRawDiff(mockUnifiedDiff)

    console.log(`📊 Total Files Detected: ${parsed.totalFiles}`)
    console.log(`➕ Total Additions: ${parsed.totalAdditions}`)
    console.log(`➖ Total Deletions: ${parsed.totalDeletions}\n`)

    const hasLockfile = parsed.files.some((f) => f.newPath.includes("package-lock.json"))
    if (hasLockfile) {
        console.error("❌ FAILED: package-lock.json was not filtered out!")
        process.exit(1)
    } else {
        console.log("✅ Filter Test: package-lock.json was successfully filtered out.")
    }
    const sessionFile = parsed.files.find((f) => f.newPath.includes("session.ts"))
    if (!sessionFile) {
        console.error("❌ FAILED: session.ts was not found!")
        process.exit()
    } else {
        console.log(`✅ Parse Test: Found ${sessionFile.newPath} with ${sessionFile.hunks.length} hunk(s).`)
    }
    console.log("\n📝 Annotated Prompt Preview for Ollama qwen2.5-coder:7b:")
    console.log("-------------------------------------------------------")
    const formattedPrompt = DiffCollectorService.formatFileForPrompt(sessionFile)
    console.log(formattedPrompt)
    console.log("-------------------------------------------------------")

    console.log("\n🎯 PROOF VERIFIED: Task T-01 is complete and ready for Phase 4!")
}

runDiffParseTest()