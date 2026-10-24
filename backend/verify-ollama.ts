// verify-ollama.ts
import process from "node:process";
import { z } from "zod";

// 1. Define the Zod Schema that our review agents will adhere to
const FindingSchema = z.object({
  id: z.string(),
  agent: z.string(),
  file: z.string(),
  lineStart: z.number(),
  lineEnd: z.number(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  title: z.string(),
  description: z.string(),
  suggestedPatch: z.string(),
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
});

const AgentResponseSchema = z.object({
  agent: z.string(),
  summary: z.string(),
  findings: z.array(FindingSchema),
});

// Infer TypeScript type directly from Zod schema
type AgentResponse = z.infer<typeof AgentResponseSchema>;

// 2. Ollama API Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const MODEL_NAME = "qwen2.5-coder:7b";

// 3. Sample code snippet with an intentional bug to test detection
const sampleDiff = `
diff --git a/auth.ts b/auth.ts
--- a/auth.ts
+++ b/auth.ts
@@ -10,6 +10,8 @@ export function getTheme(user: any): string {
-  return user.theme;
+  // Intentional Bug: Potential crash if user or profile is null/undefined
+  const theme = user.profile.settings.theme;
+  return theme;
 }
`;

async function verifyOllamaConnection(): Promise<boolean> {
  console.log(`🔍 Checking Ollama connection at ${OLLAMA_HOST}...`);
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!res.ok) {
      throw new Error(`Ollama responded with status: ${res.status}`);
    }
    const data = (await res.json()) as { models: Array<{ name: string }> };
    const modelExists = data.models.some((m) => m.name.includes("qwen2.5-coder:7b"));

    if (!modelExists) {
      console.warn(`⚠️ Model "${MODEL_NAME}" not found in local models:`);
      data.models.forEach((m) => console.log(`   - ${m.name}`));
      console.log(`\nRun: ollama pull ${MODEL_NAME}`);
      return false;
    }

    console.log(`✅ Ollama is running and "${MODEL_NAME}" is ready!\n`);
    return true;
  } catch (error: any) {
    console.error(`❌ Could not connect to Ollama: ${error.message}`);
    console.error(`   Make sure the Ollama app is started and listening on port 11434.`);
    return false;
  }
}

async function testModelAnalysis(): Promise<void> {
  console.log(`🚀 Sending test code diff to ${MODEL_NAME} with JSON enforcement...`);

  const systemPrompt = `You are a specialized Bug Review Agent.
Your job is to detect logic errors, null pointer exceptions, and potential runtime crashes in code diffs.
You MUST output ONLY valid JSON adhering to this exact structure:
{
  "agent": "Bug Agent",
  "summary": "Brief 1-sentence summary of findings",
  "findings": [
    {
      "id": "BUG-001",
      "agent": "Bug Agent",
      "file": "file path",
      "lineStart": 10,
      "lineEnd": 12,
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "title": "Short title",
      "description": "Clear explanation of the error and why it will crash",
      "suggestedPatch": "Unified git diff replacement snippet",
      "evidence": "Exact vulnerable line or expression",
      "confidence": 0.95
    }
  ]
}`;

  const userPrompt = `Review this code diff and return any detected bugs:\n\n${sampleDiff}`;

  const startTime = Date.now();

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        format: "json", // Enforces strict JSON grammar constraint
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for deterministic analysis
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Inference failed with status ${response.status}`);
    }

    const result = (await response.json()) as { message: { content: string } };
    const rawContent = result.message.content;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`⏱️ Model responded in ${duration}s.`);
    console.log(`\n--- Raw JSON Response ---`);
    console.log(rawContent);

    // 4. Validate output with Zod
    const parsedData = JSON.parse(rawContent);
    const validatedData = AgentResponseSchema.parse(parsedData);

    console.log(`\n✅ Schema validation passed!`);
    console.log(`   Found ${validatedData.findings.length} issue(s):`);
    validatedData.findings.forEach((f) => {
      console.log(`   [${f.severity}] ${f.title}`);
      console.log(`   Evidence: "${f.evidence}"`);
      console.log(`   Suggested Patch:\n${f.suggestedPatch}`);
    });
  } catch (error: any) {
    console.error(`❌ Validation or inference error:`, error);
  }
}

async function main() {
  const isReady = await verifyOllamaConnection();
  if (isReady) {
    await testModelAnalysis();
  }
}

main();
