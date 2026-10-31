import {
    AgentFinding,
    AgentReviewResponse,
    EvidenceReceipt,
    MergeReadiness,
    ReviewReport,
    SeverityLevel,
} from "../../types/index.js"

export class ReviewAggregatorService {
    static aggregate(
        prTitle: string,
        repoName: string,
        author: string,
        agentResponses: AgentReviewResponse[],
        totalFiles: number
    ): ReviewReport {
        // 1. Flatten all agent findings into a single pool
        const allFindings: AgentFinding[] = agentResponses.flatMap((r) => r.findings)

        // 2. Deduplicate overlapping findings across agents
        const deduplicatedFindings = this.deduplicateFindings(allFindings)

        // 3. Sort by severity (CRITICAL -> HIGH -> MEDIUM -> LOW -> INFO)
        const severityWeight: Record<SeverityLevel, number> = {
            CRITICAL: 5,
            HIGH: 4,
            MEDIUM: 3,
            LOW: 2,
            INFO: 1,
        }
        deduplicatedFindings.sort(
            (a, b) => severityWeight[b.severity] - severityWeight[a.severity]
        )
        // 4. Calculate issue count statistics
        const stats = {
            totalFiles,
            criticalIssues: deduplicatedFindings.filter((f) => f.severity === "CRITICAL").length,
            highIssues: deduplicatedFindings.filter((f) => f.severity === "HIGH").length,
            mediumIssues: deduplicatedFindings.filter((f) => f.severity === "MEDIUM").length,
            lowIssues: deduplicatedFindings.filter((f) => f.severity === "LOW").length
        }
        // 5. Calculate normalized Risk Score
        const rawRisk =
            stats.criticalIssues * 25 +
            stats.highIssues * 12 +
            stats.mediumIssues * 5 +
            stats.lowIssues * 2
        const riskScore = Math.min(100, Math.max(0, rawRisk))

        // 6. Determine PR Merge Readiness
        let mergeReadiness: MergeReadiness = "READY"
        if (stats.criticalIssues > 0 || riskScore >= 50) {
            mergeReadiness = "BLOCKED"
        } else if (stats.highIssues > 0 || riskScore >= 20) {
            mergeReadiness = "CHANGES_REQUESTED"
        }
        // 7. Generate Genesis Evidence Receipts
        const evidenceReceipts: EvidenceReceipt[] = deduplicatedFindings.map(
            (finding, idx) => ({
                receiptId: `RCPT-${String(idx + 1).padStart(3, "0")}`,
                recepitId: `RCPT-${String(idx + 1).padStart(3, "0")}`,
                findingId: finding.id,
                ruleCategory: finding.agent,
                sourceFile: finding.file,
                lineRange: [finding.lineStart, finding.lineEnd],
                observedCode: finding.evidence,
                recommendedPatch: finding.suggestedPatch,
                status: "open",
            })
        )
        // 8. Generate synthesis executive summary
        const executiveSummary = this.generateExecutiveSummary(
            mergeReadiness,
            riskScore,
            stats,
            agentResponses
        )
        return {
            id: `REV-${Date.now()}`,
            prTitle,
            repoName,
            author,
            timestamp: new Date().toISOString(),
            mergeReadiness,
            riskScore,
            stats,
            executiveSummary,
            findings: deduplicatedFindings,
            evidenceReceipts,
            evidenceRecepits: evidenceReceipts,
        }
    }
    private static deduplicateFindings(findings: AgentFinding[]): AgentFinding[] {
        const unique: AgentFinding[] = []

        for (const current of findings) {
            const existingMatch = unique.find(
                (f) => f.file === current.file && this.linesOverlap(
                    f.lineStart,
                    f.lineEnd,
                    current.lineStart,
                    current.lineEnd
                )
            )
            if (!existingMatch) {
                unique.push({ ...current })
            } else {
                const severities: SeverityLevel[] = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
                const higherSeverity = severities.indexOf(current.severity) > severities.indexOf(existingMatch.severity) ? current.severity : existingMatch.severity
                existingMatch.severity = higherSeverity
                existingMatch.confidence = Math.min(1.0, existingMatch.confidence + 0.05)
                existingMatch.description += ` | [Also flagged by ${current.agent} Agent: ${current.title}]`
            }
        }
        return unique
    }
    private static linesOverlap(
        startA: number,
        endA: number,
        startB: number,
        endB: number
    ): boolean {
        const tolerance = 1
        return Math.max(startA, startB) - tolerance <= Math.min(endA, endB) + tolerance
    }
    private static generateExecutiveSummary(
        decision: MergeReadiness,
        riskScore: number,
        stats: { criticalIssues: number; highIssues: number; mediumIssues: number; lowIssues: number },
        agentResponses: AgentReviewResponse[]
    ): string {
        const badge = decision === "BLOCKED" ? "⛔ BLOCKED" : decision === "CHANGES_REQUESTED" ? "⚠️ CHANGES REQUESTED" : "✅ READY TO MERGE"
        const agentSummaries = agentResponses.map((a) => `* **${a.agent} Agent**: ${a.summary} (${a.findings.length} findings)`).join("\n")
        return `### Review Decision: ${badge} (Risk Score: ${riskScore}/100)
        
**Issues Detected**: 
- 🚨 Critical: ${stats.criticalIssues} 
- ⚠️ High: ${stats.highIssues} 
- 🟡 Medium: ${stats.mediumIssues} 
- 🔵 Low/Info: ${stats.lowIssues} 

**Specialized Agent Findings**: 
${agentSummaries}`
    }
}