import { BaseAgent } from "./base.agent.js"
import { AgentType } from "../../types/index.js"

export class BugAgent extends BaseAgent {
    readonly agentType: AgentType = "Bug"

    getSystemPrompt(): string {
        return `You are a specialized Bug & Logic Review Agent. Your job is to identify logic bugs, crash hazards, unhandled edge cases, null/undefined dereferences, off-by-one errors, and broken promises in git diffs. 
        DO NOT report style issues, formatting, or theoretical security flaws. Focus strictly on whether this code will BREAK or behave unexpectedly at runtime. 
        Your MUST reply with ONLY valid JSON using this exact schema: 
        {
            "summary": "1-2 sentence overview of logic stability",
            "findings": [
                {
                    "id": "BUG-01",
                    "file": "path/to/file.ts",
                    "lineStart": 15,
                    "lineEnd": 18,
                    "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                    "title": "Short descriptive title of the bug",
                    "description": "Why this code will faile and the exact condition that triggeres it",
                    "suggestedPatch": "- buggy line\n+ fixed line",
                    "evidence": "the specific expression or statement causing the bug",
                    "confidence": 0.95
                }
            ]
        } 
        If no bugs are found, return "findings": [].`
    }
}