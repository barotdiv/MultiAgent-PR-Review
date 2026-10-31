import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import { logger } from "../utils/logger.js"

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    if (err instanceof ZodError) {
        const formattedErrors = err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        }))
        logger.warn({ path: req.path, errors: formattedErrors }, "Request validation failed")

        return res.status(400).json({
            success: false,
            error: "Validation Error",
            details: formattedErrors,
        })
    }
    const statusCode = err.statusCode || 500
    const isDev = process.env.NODE_ENV !== "production"

    logger.error(
        {
            path: req.path,
            method: req.method,
            statusCode,
            error: err.message,
            stack: isDev ? err.stack : undefined,
        },
        "Unhandled Application Error"
    )
    return res.status(statusCode).json({
        success: false,
        error: err.message || "Internal Server Error",
        ...(isDev && { stack: err.stack }),
    })
}
