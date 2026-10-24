import mongoose from "mongoose";
import { config } from "./env.js"

export async function connectDB(): Promise<void> {
    try {
        console.log("🔌 Connecting to MongoDB...")
        await mongoose.connect(config.mongoUri)
        console.log("✅ MongoDB connected successfully!")
    } catch (error: any) {
        console.error(`❌ MongoDB connection failed: ${error.message}`)
        console.warn("⚠️ Running in offline-DB mode: Review results will not be persisted until MongoDB is running.")
    }
}