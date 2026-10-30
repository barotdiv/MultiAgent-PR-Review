import { config } from "../../config/env.js"

export interface OllamaChatMessage {
    role: "system" | "user" | "assistant"
    content: string
}

export interface OllamaChatResponse {
    message: {
        role: string
        content: string
    }
    total_duration?: number
    eval_count?: number
}

export class OllamaService {
    static async chat(
        messages: OllamaChatMessage[],
        temperature: number = 0.1
    ): Promise<string> {
        const url = `${config.ollama.host}/api/chat`

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: config.ollama.model,
                    messages,
                    format: "json",
                    stream: false,
                    options: {
                        temperature,
                        top_p: 0.9,
                    },
                }),
            })
            if (!response.ok) {
                throw new Error(`Ollama HTTP Error: ${response.status} ${response.statusText}`)
            }
            const data = (await response.json()) as OllamaChatResponse
            return data.message.content
        } catch (error: any) {
            throw new Error(`Failed to communicate with Ollama at ${url}: ${error.message}`)
        }
    }
}