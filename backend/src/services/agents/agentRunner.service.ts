import { ParsedDiff, AgentReviewResponse } from "../../types/index.js"
import { BugAgent } from "./bug.agent.js"
import { SecurityAgent } from "./security.agent.js"
import { PerformanceAgent } from "./performance.agent.js"
import { QualityAgent } from "./quality.agent.js"

export class AgentRunnerService {
    private static agents = [
        new BugAgent(),
        new SecurityAgent(),
        new PerformanceAgent(),
        new QualityAgent(),
    ]

    static async runAllAgents(
        diff: ParsedDiff,
        onProgress?: (agentName: string, status: "started" | "completed") => void
    ): Promise<AgentReviewResponse[]> {
        const results: AgentReviewResponse[] = []

        console.log(`🤖 Starting Multi-Agent Review for ${diff.totalFiles} file(s)...`)

        for (const agent of this.agents) {
            if (onProgress) onProgress(agent.agentType, "started")
            console.log(`⏳ [${agent.agentType} Agent] Analyzing diff...`)
            const result = await agent.review(diff)
            results.push(result)
            console.log(
                `✅ [${agent.agentType} Agent] Finished in ${result.executionTimeMs}ms. Found ${result.findings.length} issue(s).`
            );
            if (onProgress) onProgress(agent.agentType, "completed");
        }
        return results
    }
}