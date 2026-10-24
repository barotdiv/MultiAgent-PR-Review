import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import { config } from "./config/env.js"
import { connectDB } from "./config/db.js"
import healthRoutes from "./routes/health.routes.js"

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

app.use("/api", healthRoutes)

app.get("/", (_req: Request, res: Response) => {
    res.json({
        name: "Multi-Agent PR Review API",
        version: "1.0.0",
        docs: "/api/health",
    })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled Error:", err.stack)
    res.status(500).json({ error: "Internal Server Error", message: err.message })
})

async function startServer() {
    await connectDB()

    app.listen(config.port, () => {
        console.log(`🚀 Multi-Agent PR Review Server is running on http://localhost:${config.port}`)
        console.log(`🩺 Healthcheck available at http://localhost:${config.port}/api/health`)
    })
}

startServer()