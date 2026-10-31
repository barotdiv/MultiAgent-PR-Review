import { Octokit } from "@octokit/rest"
import { ReviewReport } from "../../types/index.js"
import { logger } from "../../utils/logger.js"

export class GitHubCommenter {
    private octokit: Octokit

    constructor(token: string) {
        this.octokit = new Octokit({ auth: token })
    }

    async postReview(
        owner: string,
        repo: string,
        pullNumber: number,
        report: ReviewReport,
        commitId: string
    ): Promise<void> {
        try {
            await this.octokit.issues.createComment({
                owner,
                repo,
                issue_number: pullNumber,
                body: `## 🤖 Multi-Agent PR Review\n\n${report.executiveSummary}`
            })
            for (const finding of report.findings) {
                if (finding.severity === "CRITICAL" || finding.severity === "HIGH") {
                    await this.octokit.pulls.createReviewComment({
                        owner,
                        repo,
                        pull_number: pullNumber,
                        commit_id: commitId,
                        path: finding.file,
                        line: finding.lineEnd,
                        body: `### [${finding.severity}] ${finding.title} (${finding.agent} Agent)\n\n${finding.description}\n\n**Suggested Fix:**\n\`\`\`diff\n${finding.suggestedPatch}\n\`\`\``,
                    })
                }
            }
            logger.info({ owner, repo, pullNumber }, "Successfully posted review comments to GitHub PR")
        } catch (error: any) {
            logger.error({ error: error.message }, "Failed to post review comments to GitHub")
        }
    }
}