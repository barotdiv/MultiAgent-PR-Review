import { Request, Response, NextFunction } from "express"
import { ZodType } from "zod"

export const validateRequest = (schema: ZodType) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        })
        return next()
    } catch (error) {
        return next(error)
    }
}
