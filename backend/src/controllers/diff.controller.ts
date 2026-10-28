import { Request, Response } from "express"
import { DiffCollectorService } from "../services/diff/diffCollector.service.js"
import { ApiResponseHandler } from "../utils/apiResponse.js"

export class DiffController {
    static parseDiff(req: Request, res: Response): Response {
        try {
            const { rawDiff } = req.body
            if (!rawDiff || typeof rawDiff !== "string") {
                return ApiResponseHandler.badRequest(res, "Missing or invalid 'rawDiff' field in request body.")
            }
            const parsed = DiffCollectorService.parseRawDiff(rawDiff)
            return ApiResponseHandler.success(res, parsed, "Diff successfully parsed.")
        } catch (error: any) {
            return ApiResponseHandler.error(res, `Failed to parse diff: ${error.message}`)
        }
    }
}