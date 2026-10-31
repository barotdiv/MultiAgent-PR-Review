import { Request, Response } from "express"
import { reviewQueue } from "../queues/reviewQueue.js"

export class StreamController {
    static streamProgress(req: Request, res: Response) {
        const { id } = req.params

        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")
        res.flushHeaders()

        const onProgress = (data: any) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`)
            if (data.status == "completed" || data.status === "failed") {
                cleanup()
                res.end()
            }
        }
        const cleanup = () => {
            reviewQueue.off(`status:${id}`, onProgress)
        }
        reviewQueue.on(`status:${id}`, onProgress)
        req.on("close", cleanup)
    }
}