import mongoose, { Schema, Document } from "mongoose"
import {
    AgentType,
    SeverityLevel,
    MergeReadiness,
    AgentFinding,
    EvidenceRecepit
} from "../types/index.js"

// 1. Interface extending Mongoose Document
export interface IReviewRunDocument extends Document {
    prTitle: string
    repoName: string
    prNumber?: number
    author: string
    commitHash?: string
    diffSummary: {
        totalFiles: number
        totalAdditions: number
        totalDeletions: number
    }
    status: "pending" | "processing" | "completed" | "failed"
    mergeReadiness: MergeReadiness
    riskScore: number
    stats: {
        criticalIssues: number
        highIssues: number
        mediumIssues: number
        lowIssues: number
    }
    executiveSummary: string
    findings: AgentFinding[]
    evidenceReceipts: EvidenceRecepit[]
    createdAt: Date
    updatedAt: Date
}

// 2. Sub-schema for individual Agent Findings
const FindingSubSchema = new Schema<AgentFinding>(
    {
        id: { type: String, required: true },
        agent: {
            type: String,
            enum: ["Bug", "Security", "Performance", "Quality"],
            required: true
        },
        file: { type: String, required: true },
        lineStart: { type: Number, required: true },
        lineEnd: { type: Number, required: true },
        severity: {
            type: String,
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
            required: true
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        suggestedPatch: { type: String, default: "" },
        evidence: { type: String, required: true },
        confidence: { type: Number, min: 0, max: 1, default: 0.9 },
    },
    { _id: false }
)

// 3. Sub-Schema for Genesis Evidence Receipts
const EvidenceRecepitSubSchema = new Schema<EvidenceRecepit>(
    {
        recepitId: { type: String, required: true },
        findingId: { type: String, required: true },
        ruleCategory: {
            type: String,
            enum: ["Bug", "Security", "Performance", "Quality"],
            required: true
        },
        sourceFile: { type: String, required: true },
        lineRange: { type: [Number], required: true },
        observedCode: { type: String, required: true },
        recommendedPatch: { type: String, default: "" },
        status: {
            type: String,
            enum: ["open", "accepted", "dismissed"],
            default: "open"
        },
    },
    { _id: false }
)

// 4. Main ReviewRun Schema
const ReviewRunSchema = new Schema<IReviewRunDocument>(
    {
        prTitle: { type: String, required: true, default: "Untitled PR Review" },
        repoName: { type: String, required: true, default: "local/repository" },
        prNumber: { type: Number },
        author: { type: String, default: "Developer" },
        commitHash: { type: String },
        diffSummary: {
            totalFiles: { type: Number, default: 0 },
            totalAdditions: { type: Number, default: 0 },
            totalDeletions: { type: Number, default: 0 },
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },
        mergeReadiness: {
            type: String,
            enum: ["READY", "CHANGES_REQUESTED", "BLOCKED"],
            default: "READY",
        },
        riskScore: { type: Number, default: 0, min: 0, max: 100 },
        stats: {
            criticalIssues: { type: Number, default: 0 },
            highIssues: { type: Number, default: 0 },
            mediumIssues: { type: Number, default: 0 },
            lowIssues: { type: Number, default: 0 },
        },
        executiveSummary: { type: String, default: "" },
        findings: [FindingSubSchema],
        evidenceReceipts: [EvidenceRecepitSubSchema],
    },
    {
        timestamps: true,
    }
)

ReviewRunSchema.index({ repoName: 1, createdAt: -1 })

export const ReviewRun = mongoose.model<IReviewRunDocument>("ReviewRun", ReviewRunSchema)

