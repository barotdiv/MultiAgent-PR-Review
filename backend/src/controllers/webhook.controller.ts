import { Request, Response } from "express"
import { verifyGitHubSignature } from "../integrations/github/verifySignature.js"
import { reviewQueue } from "../queues/reviewQueue.js"
import { ReviewRun } from "../models/ReviewRun.model.js"
import { logger } from "../utils/logger.js"
import { sign } from "crypto"
import { success } from "zod"

export class WebhookController {
    static async handleGitHubWebhook(req: Request, res: Response) {
        const signature = req.headers["x-hub-signature-256"] as string
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || ""

        // 1. Verify HMAC Signature
        if (webhookSecret && !verifyGitHubSignature(webhookSecret, JSON.stringify(req.body), signature)) {
            logger.warn("GitHub webhook signature verification failed")
            return res.status(401).json({ error: "Invalid webhook signature" })
        }
        const event = req.headers["x-github-event"]
        if (event !== "pull_request") {
            return res.status(200).json({ message: "Ignored non-PR event" })
        }
        const { action, pull_request, repository } = req.body

        if (action === "opened" || action === "synchronize") {
            logger.info({ pr: pull_request.number, repo: repository.full_name }, "Triggering automated PR review from GitHub webhook")

            const diffResponse = await fetch(pull_request.diff_url)
            const rawDiff = await diffResponse.text()

            const reviewDoc = await ReviewRun.create({
                prTitle: pull_request.title,
                repoName: repository.full_name,
                prNumber: pull_request.number,
                author: pull_request.user.login,
                commitHash: pull_request.head.sha,
                status: "pending",
            })
            reviewQueue.enqueue({
                reviewId: reviewDoc._id.toString(),
                rawDiff,
                prTitle: pull_request.title,
                repoName: repository.full_name,
                author: pull_request.user.login,
            })
            return res.status(202).json({
                success: true,
                message: "PR review queued",
                reviewId: reviewDoc._id,
            })
        }
        return res.status(200).json({ message: `Action ${action}' ignored` })
    }
}