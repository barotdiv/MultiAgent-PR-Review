import EventEmitter from "events"
import { ReviewRun } from "../models/ReviewRun.model.js"
import { DiffCollectorService } from "../services/diff/diffCollector.service.js"
import { AgentRunnerService } from "../services/agents/agentRunner.service.js"
import { ReviewAggregatorService } from "../services/aggregator/reviewAggregator.service.js"
import { logger } from "../utils/logger.js"

export interface ReviewJobData {
    reviewId: string
    rawDiff: string
    prTitle: string
    repoName: string
    author: string
}

class ReviewQueueManager extends EventEmitter {
    private queue: ReviewJobData[] = []
    private isProcessing = false

    enqueue(data: ReviewJobData): void {
        this.queue.push(data)
        logger.info({ reviewId: data.reviewId }, "Review job enqueued")
        this.emit(`status:${data.reviewId}`, { status: "queued", progress: 0 })
        this.processNext()
    }

    private async processNext(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return

        this.isProcessing = true
        const job = this.queue.shift()
        if (!job) {
            this.isProcessing = false
            return
        }

        try {
            logger.info({ reviewId: job.reviewId }, "Processing review job")
            await ReviewRun.findByIdAndUpdate(job.reviewId, { status: "processing" })
            this.emit(`status:${job.reviewId}`, { status: "processing", progress: 10 })

            const parsedDiff = DiffCollectorService.parseRawDiff(job.rawDiff)
            let completedAgents = 0
            const agentResponses = await AgentRunnerService.runAllAgents(
                parsedDiff,
                (agentName, agentStatus) => {
                    if (agentStatus === "completed") {
                        completedAgents++
                        const progress = 10 + Math.floor((completedAgents / 4) * 70)
                        this.emit(`status:${job.reviewId}`, {
                            status: "processing",
                            progress,
                            message: `${agentName} Agent completed`,
                        })
                    }
                }
            )

            const report = ReviewAggregatorService.aggregate(
                job.prTitle,
                job.repoName,
                job.author,
                agentResponses,
                parsedDiff.totalFiles
            )

            await ReviewRun.findByIdAndUpdate(job.reviewId, {
                status: "completed",
                diffSummary: {
                    totalFiles: parsedDiff.totalFiles,
                    totalAdditions: parsedDiff.totalAdditions,
                    totalDeletions: parsedDiff.totalDeletions,
                },
                mergeReadiness: report.mergeReadiness,
                riskScore: report.riskScore,
                stats: report.stats,
                executiveSummary: report.executiveSummary,
                findings: report.findings,
                evidenceReceipts: report.evidenceReceipts,
            })

            this.emit(`status:${job.reviewId}`, {
                status: "completed",
                progress: 100,
                report,
            })
            logger.info({ reviewId: job.reviewId }, "Review job completed successfully")
        } catch (error: any) {
            logger.error({ reviewId: job.reviewId, error: error.message }, "Review job failed")
            await ReviewRun.findByIdAndUpdate(job.reviewId, { status: "failed" })
            this.emit(`status:${job.reviewId}`, {
                status: "failed",
                error: error.message,
            })
        } finally {
            this.isProcessing = false
            this.processNext()
        }
    }
}

export const reviewQueue = new ReviewQueueManager()
export { ReviewQueueManager }