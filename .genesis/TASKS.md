# Genesis Project multi-agent-pr-review

## System Invariants
- Runtime: Node.js 20+ with TypeScript
- LLM Inference: Local Ollama (qwen2.5-coder:7b) via strict JSON grammar mode
- Frontend: React + Vite + Tailwind (Genesis Atlas Design System)
- Database: MongoDB for PRs, review runs, and evidence receipts
---

## Task Queue & Completion Contracts

### [DONE] T-00: Ollama & Model Verification
- **Outcome**: Model `qwen2.5-coder:7b` confirmed reachable on port 11434 with JSON validation.
- **Proof**: `verify-ollama.ts` passed Zod schema validation in Phase 1.

### [PENDING] T-01: Diff Ingestion & Parsing Engine
- **Outcome**: Service that takes raw git diffs/patches or GitHub PR URLs and parses them into structured files, additions, deletions, and hunks.
- **Proof**: Unit test feeding sample diffs and returning structured `ParsedDiff` objects with non-code files (lockfiles, assets) filtered out.

### [PENDING] T-02: Multi-Agent Review Engine (4 Agents)
 - **Outcome**: Bug, Security, Performance, and Quality agents execute against parsed diff hunks with specialized system prompts.
- **Proof**: Automated test running all 4 agents with concurrency gating and parsing 100% valid `AgentFinding[]`.

### [PENDING] T-03: Review Aggregator & Deduplication
- **Outcome**: Combines findings from all 4 agents, merges overlapping line issues, calculates confidence scores and overall PR Merge Readiness score.
- **Proof**: Aggregator test proving duplicate findings on the same line range are merged into a single prioritized card.

### [PENDING] T-04: MongoDB Persistence & Express REST API
- **Outcome**: Express REST endpoints (`/api/reviews`, `/api/diff`, `/api/health`) persisting runs to MongoDB via Mongoose.
- **Proof**: Successful API integration test creating a review and reading it back from MongoDB.

### [PENDING] T-05: Genesis Atlas React Dashboard (Frontend)
- **Outcome**: 4-tab control panel (Overview, Queue, Evidence, Activity) with Genesis theme styling and interactive diff viewer.
- **Proof**: Dashboard renders findings inline against code diff with 1-click patch copy.

### [PENDING] T-06: End-to-End Pipeline Verification
- **Outcome**: Full end-to-end test analyzing a realistic multi-file PR with logic bugs, security flaws, and performance issues.
- **Proof**: Verified end-to-end report generated and displayed on the dashboard.