import rateLimit from "express-rate-limit"
import { success } from "zod"

export const reviewRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too many PR review requests from this IP. Please wait before retrying."
    }
})