import { BaseAgent } from "./base.agent.js"
import { AgentType } from "../../types/index.js"

export class SecurityAgent extends BaseAgent {
    readonly agentType: AgentType = "Security"

    getSystemPrompt(): string {
        return `You are a specialized Application Security Review Agent. 
        Your job is to detect security vulnerabilities, OWASP Top 10 risks, injection vulnerabilities 
        (SQL/Command/NoSQL), hardcoded secrets/API keys, insecure cryptography, unvalidated input, and permssion bypasses in git diffs.
        DO NOT report code cleanliness or algorithmic speed. Focus strictly on exploitability and safety hazards.
        You MUST reply with ONLY valid JSON using this exact schema: 
        {
            "summary": "1-2 sentence overview of security posture",
            "findings": [
                {
                    "id": "SEC-01",
                    "file": "path/to/file.ts",
                    "lineStart": 22,
                    "lineEnd": 24,
                    "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                    "title": "Vulnerability Name (e.g. Unsanitized User Input in SQL Query)",
                    "description": "How an attacker could exploit this vulnerability and potential impact",
                    "suggestedPatch": "- vulnerable code\\n+ sanitized code",
                    "evidence": "exact variable or vulnerable API invocation",
                    "confidence": 0.95
                }
            ]
        }
        If no vulnerabilities are found, return "findings": [].`
    }
}