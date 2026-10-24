import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { config } from "../config/env.js";

const router = Router();

const healthCheckHandler = async (_req: Request, res: Response) => {
    let ollamaStatus: "ready" | "connected" | "unreachable" = "unreachable";
    let availableModels: string[] = [];
    let modelReady = false;

    // Check Ollama connectivity & available models
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const ollamaRes = await fetch(`${config.ollama.host}/api/tags`, {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (ollamaRes.ok) {
            const data = (await ollamaRes.json()) as { models?: Array<{ name: string }> };
            availableModels = (data.models || []).map((m) => m.name);
            modelReady = availableModels.some((m) => m.includes(config.ollama.model));
            ollamaStatus = modelReady ? "ready" : "connected";
        }
    } catch {
        ollamaStatus = "unreachable";
    }

    // Check MongoDB connectivity
    const mongoStateMap: Record<number, string> = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    const mongoStatus = mongoStateMap[mongoose.connection.readyState] || "unknown";

    const isHealthy = mongoStatus === "connected" && ollamaStatus === "ready";

    return res.status(isHealthy ? 200 : 207).json({
        status: isHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
            database: {
                status: mongoStatus,
                connected: mongoose.connection.readyState === 1,
            },
            ollama: {
                status: ollamaStatus,
                host: config.ollama.host,
                targetModel: config.ollama.model,
                modelReady,
                availableModels,
            },
        },
    });
};

// Support both "/" (when mounted at /api/health) and "/health"
router.get("/", healthCheckHandler);
router.get("/health", healthCheckHandler);

export default router;
