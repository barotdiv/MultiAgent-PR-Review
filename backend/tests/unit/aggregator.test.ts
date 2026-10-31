import { describe, it, expect } from "vitest"
import { ReviewAggregatorService } from "../../src/services/aggregator/reviewAggregator.service.js"
import { AgentReviewResponse } from "../../src/types/index.js"

describe("ReviewAggregatorService", () => {
    it("should merge overlapping findings from two different agents", () => {
        const mockResponses: AgentReviewResponse[] = [
            {
                agent: "Bug",
                summary: "Found unhandled null",
                executionTimeMs: 120,
                findings: [
                    {
                        id: "BUG-1",
                        agent: "Bug",
                        file: "auth.ts",
                        lineStart: 14,
                        lineEnd: 16,
                        severity: "HIGH",
                        title: "Unhandled null value",
                        description: "Variable could be undefined",
                        suggestedPatch: "+ safeCheck()",
                        evidence: "user.token",
                        confidence: 0.9,
                    },
                ],
            },
            {
                agent: "Security",
                summary: "Found insecure token",
                executionTimeMs: 140,
                findings: [
                    {
                        id: "SEC-1",
                        agent: "Security",
                        file: "auth.ts",
                        lineStart: 15,
                        lineEnd: 16,
                        severity: "CRITICAL",
                        title: "Hardcoded secret token",
                        description: "Secret token exposed",
                        suggestedPatch: "+ process.env.TOKEN",
                        evidence: "user.token",
                        confidence: 0.95,
                    },
                ],
            },
        ]
        const report = ReviewAggregatorService.aggregate(
            "Test PR",
            "repo/test",
            "dev",
            mockResponses,
            1
        )
        expect(report.findings.length).toBe(1)

        expect(report.findings[0].severity).toBe("CRITICAL")

        expect(report.mergeReadiness).toBe("BLOCKED")
        expect(report.evidenceReceipts.length).toBe(1)
    })
})
