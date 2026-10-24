import dotenv from "dotenv"

dotenv.config()

export const config = {
    port: parseInt(process.env.PORT || "5000", 10),
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multi-agent-pr-review",
    ollama: {
        host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
        model: process.env.OLLAMA_MODEL || "qwen2.5-coder:7b",
    },
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
}