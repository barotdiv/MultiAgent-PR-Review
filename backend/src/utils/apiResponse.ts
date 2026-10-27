import { Response } from "express"

export interface ApiResponse<T = any> {
    success: boolean
    message: string
    data?: T
    error: string
}

export class ApiResponseHandler {
    static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        })
    }
    static error(res: Response, error: string, statusCode = 500): Response {
        return res.status(statusCode).json({
            success: false,
            error,
        })
    }
    static badRequest(res: Response, message: string): Response {
        return res.status(400).json({
            success: false,
            error: message,
        })
    }
    static notFound(res: Response, message = "Resource not found"): Response {
        return res.status(404).json({
            success: false,
            error: message,
        })
    }
}