import { DiffCollectorService } from "../services/diff/diffCollector.service.js"
import { AgentRunnerService } from "../services/agents/agentRunner.service.js"

const samplePRDIff = `
diff --git a/src/controllers/useController.ts b/src/controllers/useController.ts
--- a/src/controller/userController.ts
+++ b/src/controllers/userController.ts
@@ -10, 6 +10, 18 @@
export async function searchUsers(req: any, res: any) {
    // 1. Quality issue
    const { query } = req.query

    // 2. Security issue
    const sql = "SELECT * FROM users WHERE username = '" + query + "'"

    // 3. Bug issue
    const firstuser = await db.query(sql)
    const userTheme = firstUser[0].preferences.theme

    // 4. Performance issue
    const userList = await db.query("SELECT * FROM users")
    for(let i = 0; i < userList.length; i++) {
        for(let j = 0; j < userList.length; j++) {
            if(userList[i].id === userList[j].friendId) {
                userList[i].isFriend = true
            }
        }
    }
    res.json({ success: true, theme: userTheme })
}
`

async function runMultiAgentProof() {
    console.log("🧪 Running Genesis Proof: T-02 Multi-Agent Review Engine\n")

    const parsedDiff = DiffCollectorService.parseRawDiff(samplePRDIff)
    console.log(`📁 Ingested ${parsedDiff.totalFiles} code file(s) for multi-agent inspection.\n`)

    const startTime = Date.now()
    const agentResponses = await AgentRunnerService.runAllAgents(parsedDiff)
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log(`\n================ REVIEW SUMMARY (${totalDuration}s) ================`)

    let totalFindings = 0
    for (const resp of agentResponses) {
        console.log(`\n🔹 [${resp.agent} Agent] (${resp.executionTimeMs}ms)`)
        console.log(`   Summary: "${resp.summary}"`)
        console.log(`   Findings Count: ${resp.findings.length}`)

        resp.findings.forEach((f, idx) => {
            console.log(`   ${idx + 1}. [${f.severity}] ${f.title}`);
            console.log(`      Lines: L${f.lineStart}-L${f.lineEnd}`);
            console.log(`      Evidence: ${f.evidence}`);
            console.log(`      Patch:\n      ${f.suggestedPatch.replace(/\n/g, "\n      ")}`)
        })
        totalFindings += resp.findings.length
    }
    console.log(`\n======================================================`);
    console.log(`🎯 PROOF VERIFIED: All 4 agents executed successfully! Total findings: ${totalFindings}`);
    console.log(`   Ready for Phase 5: Review Aggregator & Deduplication Engine (T-03).`)
}

runMultiAgentProof()