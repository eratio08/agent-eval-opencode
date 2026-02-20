---
"@vercel/agent-eval": minor
---

Inject transcript context into the sandbox before EVAL.ts runs. After the agent completes, the parsed transcript summary is written to `__agent_eval__/results.json` so tests can assert on agent behavior — shell commands executed, files modified, tool call counts, and more.
