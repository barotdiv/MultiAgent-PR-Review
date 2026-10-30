import { int } from "zod"

// 1. Git Diff Model
export interface DiffHunk {
    oldStart: number
    oldLines: number
    newStart: number
    newLines: number
    lines: string[]
}

export interface DiffFile {
    oldPath: string
    newPath: string
    isNew: boolean
    isDeleted: boolean
    isModified: boolean
    additions: number
    deletions: number
    hunks: DiffHunk[]
    rawContent: string
}

export interface ParsedDiff {
    files: DiffFile[]
    totalFiles: number
    totalAdditions: number
    totalDeletions: number
}

// 2. Agent Finding Model
export type AgentType = "Bug" | "Security" | "Performance" | "Quality"
export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"

export interface AgentFinding {
    id: string
    agent: AgentType
    file: string
    lineStart: number
    lineEnd: number
    severity: SeverityLevel
    title: string
    description: string
    suggestedPatch: string
    evidence: string
    confidence: number
}

export interface AgentReviewResponse {
    agent: AgentType
    summary: string
    executionTimeMs: number
    findings: AgentFinding[]
}

// 3. Genesis Evidence Receipt 
export interface EvidenceRecepit {
    recepitId: string
    findingId: string
    ruleCategory: AgentType
    sourceFile: string
    lineRange: [number, number]
    observedCode: string
    recommendedPatch: string
    status: "open" | "accepted" | "dismissed"
}

// 4. Aggregated PR Review Result
export type MergeReadiness = "READY" | "CHANGES_REQUESTED" | "BLOCKED"

export interface ReviewReport {
    id: string
    prTitle: string
    repoName: string
    author: string
    timestamp: string
    mergeReadiness: MergeReadiness
    riskScore: number
    stats: {
        totalFiles: number
        criticalIssues: number
        highIssues: number
        mediumIssues: number
        lowIssues: number
    }
    executiveSummary: string
    findings: AgentFinding[]
    evidenceRecepits: EvidenceRecepit[]
}