import { z } from "zod"
import { OllamaService } from "../ollama/ollama.service.js"
import { DiffCollectorService } from "../diff/diffCollector.service.js"
import { AgentReviewResponse, AgentType, ParsedDiff } from "../../types/index.js"


export const RawFindingSchema = z.object({
    id: z.string(),
    file: z.string(),
    lineStart: z.number(),
    lineEnd: z.number(),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
    title: z.string(),
    description: z.string(),
    suggestedPatch: z.string(),
    evidence: z.string(),
    confidence: z.number().min(0).max(1),
})

export const RawAgentOutputSchema = z.object({
    summary: z.string(),
    findings: z.array(RawFindingSchema),
})

export abstract class BaseAgent {
    abstract readonly agentType: AgentType
    abstract getSystemPrompt(): string

    async review(diff: ParsedDiff): Promise<AgentReviewResponse> {
        const startTime = Date.now()

        if (diff.files.length === 0) {
            return {
                agent: this.agentType,
                summary: "No relevant code files to review.",
                executionTimeMs: 0,
                findings: [],
            }
        }
        const codeDiffPrompt = diff.files.map((f) => DiffCollectorService.formatFileForPrompt(f)).join("\n\n")

        const messages = [
            {
                role: "system" as const,
                content: this.getSystemPrompt()
            },
            {
                role: "user" as const,
                content: `Review the following pull request code diff and report findings:\n\n${codeDiffPrompt}`,
            },
        ]
        try {
            const rawJson = await OllamaService.chat(messages, 0.1)
            const parsed = JSON.parse(rawJson)
            const validated = RawAgentOutputSchema.parse(parsed)

            const executionTimeMs = Date.now() - startTime

            const findings = validated.findings.map((f) => ({
                ...f,
                agent: this.agentType,
            }))
            return {
                agent: this.agentType,
                summary: validated.summary,
                executionTimeMs,
                findings,
            }
        } catch (error: any) {
            console.error(`[${this.agentType}] Review failed: ${error.message}`)
            return {
                agent: this.agentType,
                summary: `Review failed: ${error.message}`,
                executionTimeMs: Date.now() - startTime,
                findings: []
            }
        }
    }
}

