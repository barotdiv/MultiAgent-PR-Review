import { Request, Response } from "express"
import { DiffCollectorService } from "../services/diff/diffCollector.service.js"
import { AgentRunnerService } from "../services/agents/agentRunner.service.js"
import { ReviewAggregatorService } from "../services/aggregator/reviewAggregator.service.js"
import { ReviewRun } from "../models/ReviewRun.model.js"
import { ApiResponseHandler } from "../utils/apiResponse.js"

export class ReviewController {
    static async runReview(req: Request, res: Response): Promise<Response> {
        try {
            const { rawDiff, prTitle, repoName, author, prNumber, commitHash } = req.body
            if (!rawDiff || typeof rawDiff !== "string") {
                return ApiResponseHandler.badRequest(
                    res,
                    "Missing required field 'rawDiff' in request body."
                )
            }
            const title = prTitle || "Feature Pull Request"
            const repository = repoName || "local/repository"
            const prAuthor = author || "Developer"
            const parsedDiff = DiffCollectorService.parseRawDiff(rawDiff)
            if (parsedDiff.files.length === 0) {
                return ApiResponseHandler.badRequest(
                    res,
                    "No valid code files detected in the provided diff (lockfiles/binariesd were filtered out)."
                )
            }
            const agentResponses = await AgentRunnerService.runAllAgents(parsedDiff)
            const report = ReviewAggregatorService.aggregate(
                title,
                repository,
                prAuthor,
                agentResponses,
                parsedDiff.totalFiles
            )
            let savedDoc = null
            try {
                const reviewDoc = new ReviewRun({
                    prTitle: report.prTitle,
                    repoName: report.repoName,
                    prNumber: prNumber ? parseInt(prNumber, 10) : undefined,
                    author: report.author,
                    commitHash: commitHash || "head",
                    diffSummary: {
                        totalFiles: parsedDiff.totalFiles,
                        totalAdditions: parsedDiff.totalAdditions,
                        totalDeletions: parsedDiff.totalDeletions,
                    },
                    status: "completed",
                    mergeReadiness: report.mergeReadiness,
                    riskScore: report.riskScore,
                    stats: report.stats,
                    executiveSummary: report.executiveSummary,
                    findings: report.findings,
                    evidenceReceipts: report.evidenceReceipts,
                })
                savedDoc = await reviewDoc.save()
            } catch (dbErr: any) {
                console.warn(`⚠️ Review completed but MongoDB save skipped: ${dbErr.message}`)
            }
            return ApiResponseHandler.success(
                res,
                {
                    report,
                    savedId: savedDoc?._id || null,
                },
                "Pull Request review completed successfully."
            )
        } catch (error: any) {
            console.error("Review Run Failed:", error)
            return ApiResponseHandler.error(res, `Failed to execute PR review: ${error.message}`)
        }
    }
    static async getAllReviews(_req: Request, res: Response): Promise<Response> {
        try {
            const reviews = await ReviewRun.find().sort({ createdAt: -1 }).limit(20)
            return ApiResponseHandler.success(res, reviews)
        } catch (error: any) {
            return ApiResponseHandler.error(res, `Failed to fetch reviews: ${error.message}`)
        }
    }
    static async getReviewById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params
            const review = await ReviewRun.findById(id)

            if (!review) {
                return ApiResponseHandler.notFound(res, `Review with ID ${id} not found.`)
            }
            return ApiResponseHandler.success(res, review)
        } catch (error: any) {
            return ApiResponseHandler.error(res, `Failed to fetch review: ${error.message}`)
        }
    }
}