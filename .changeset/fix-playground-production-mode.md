---
"@vercel/agent-eval-playground": patch
---

Run playground in production mode (`next start`) instead of dev mode (`next dev`) to fix React version conflicts and "Cannot read properties of null (reading 'useInsertionEffect')" errors when running via npx.
