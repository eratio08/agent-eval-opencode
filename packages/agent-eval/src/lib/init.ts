/**
 * Project initialization - create new eval projects.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import pkg from '../../package.json' with { type: 'json' }

const ASDF_NODE_VERSION = '24.14.1'
const PNPM_VERSION = '10.33.0'

/**
 * Options for initializing a new project.
 */
export interface InitOptions {
  /** Project name */
  name: string
  /** Target directory (defaults to current working directory) */
  targetDir?: string
}

/**
 * Template file definitions.
 */
interface TemplateFile {
  path: string
  content: string
}

/**
 * Get the package.json template.
 */
function getPackageJson(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      version: '0.0.1',
      private: true,
      packageManager: `pnpm@${PNPM_VERSION}`,
      type: 'module',
      devDependencies: {
        'agent-eval-opencode': `^${pkg.version}`,
        '@types/node': '^22.0.0',
        typescript: '^5.6.0',
        vitest: '^2.1.0',
      },
    },
    null,
    2,
  )
}

function getToolVersions(): string {
  return `nodejs ${ASDF_NODE_VERSION}
pnpm ${PNPM_VERSION}
`
}

/**
 * Get the .env.example template.
 */
function getEnvExample(): string {
  return `# OpenCode agent uses credentials from your local OpenCode installation.
# No API keys are needed here -- auth is read from ~/.local/share/opencode/auth.json
# and ~/.config/github-copilot/apps.json automatically.

# To use the Vercel sandbox instead of Docker, set these:
# VERCEL_TOKEN=your-vercel-token
# VERCEL_TEAM_ID=your-team-id
# VERCEL_PROJECT_ID=your-project-id
`
}

/**
 * Get the .gitignore template.
 */
function getGitignore(): string {
  return `node_modules/
dist/
.env
.env.local
results/
*.log
.DS_Store
`
}

/**
 * Get the README.md template.
 */
function getReadme(): string {
  return `# Agent Evaluation Suite

Test AI coding agents to measure what actually works.

## Prerequisites

- **Docker** running (Colima, Docker Desktop, or OrbStack)
- **OpenCode** authenticated with GitHub Copilot (\`~/.local/share/opencode/auth.json\` must exist)

## Setup

1. **Install asdf tool versions:**
   \`\`\`bash
   asdf install
   \`\`\`

1. **Install dependencies:**
   \`\`\`bash
   pnpm install
   \`\`\`

## Running Evals

### Preview (no cost)

See what will run without making API calls:

\`\`\`bash
npx agent-eval-opencode --dry
\`\`\`

### Run Experiments

\`\`\`bash
npx agent-eval-opencode
\`\`\`

### View Results

Launch the official Vercel results viewer:

\`\`\`bash
npx agent-eval-opencode playground
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to browse results.

`
}

function getOpencodeExperiment(): string {
  return `import type { ExperimentConfig } from 'agent-eval-opencode';

const config: ExperimentConfig = {
  agent: 'opencode',
  model: 'github-copilot/claude-opus-4.6',
  sandbox: 'docker',
  runs: 1,
  earlyExit: true,
  scripts: ['build'],
  timeout: 600,
};

export default config;
`
}

/**
 * Get the example eval fixture PROMPT.md.
 */
function getExamplePrompt(): string {
  return `Add a greeting message below the heading that says "Welcome, user!"

Requirements:
- Add a paragraph element below the h1
- The text should be exactly "Welcome, user!"
- Keep the existing heading unchanged
`
}

/**
 * Get the example eval fixture EVAL.ts.
 */
function getExampleEval(): string {
  return `import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { test, expect } from 'vitest';

test('greeting message exists in source', () => {
  const content = readFileSync('src/App.tsx', 'utf-8');
  expect(content).toContain('Welcome, user!');
});

test('app still builds', () => {
  // This throws if the build fails
  execSync('npm run build', { stdio: 'pipe' });
});
`
}

/**
 * Get the example eval fixture package.json.
 */
function getExamplePackageJson(): string {
  return JSON.stringify(
    {
      name: 'add-greeting',
      type: 'module',
      scripts: {
        build: 'tsc',
      },
      dependencies: {
        react: '^18.0.0',
      },
      devDependencies: {
        '@types/react': '^18.0.0',
        typescript: '^5.0.0',
        vitest: '^2.1.0',
      },
    },
    null,
    2,
  )
}

/**
 * Get the root tsconfig.json for the project.
 */
function getRootTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        lib: ['ES2022'],
      },
      include: ['experiments'],
    },
    null,
    2,
  )
}

/**
 * Get the example eval fixture tsconfig.json.
 */
function getExampleTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        outDir: 'dist',
        skipLibCheck: true,
      },
      include: ['src'],
    },
    null,
    2,
  )
}

/**
 * Get the example eval fixture App.tsx.
 */
function getExampleApp(): string {
  return `export function App() {
  return (
    <div>
      <h1>Hello World</h1>
      {/* TODO: Add greeting message here */}
    </div>
  );
}

export default App;
`
}

/**
 * Get all template files for a new project.
 */
function getTemplateFiles(projectName: string): TemplateFile[] {
  return [
    { path: 'package.json', content: getPackageJson(projectName) },
    { path: '.tool-versions', content: getToolVersions() },
    { path: 'tsconfig.json', content: getRootTsconfig() },
    { path: '.env.example', content: getEnvExample() },
    { path: '.gitignore', content: getGitignore() },
    { path: 'README.md', content: getReadme() },
    { path: 'experiments/opencode.ts', content: getOpencodeExperiment() },
    { path: 'evals/add-greeting/PROMPT.md', content: getExamplePrompt() },
    { path: 'evals/add-greeting/EVAL.ts', content: getExampleEval() },
    { path: 'evals/add-greeting/package.json', content: getExamplePackageJson() },
    { path: 'evals/add-greeting/tsconfig.json', content: getExampleTsconfig() },
    { path: 'evals/add-greeting/src/App.tsx', content: getExampleApp() },
  ]
}

/**
 * Initialize a new eval project.
 */
export function initProject(options: InitOptions): string {
  const targetDir = options.targetDir ?? process.cwd()
  const projectDir = resolve(targetDir, options.name)
  const projectName = basename(projectDir)

  // Check if directory already exists
  if (existsSync(projectDir)) {
    throw new Error(`Directory already exists: ${projectDir}`)
  }

  // Create project directory
  mkdirSync(projectDir, { recursive: true })

  // Write all template files
  const files = getTemplateFiles(projectName)
  for (const file of files) {
    const filePath = join(projectDir, file.path)
    const fileDir = dirname(filePath)

    // Create parent directories
    mkdirSync(fileDir, { recursive: true })

    // Write file
    writeFileSync(filePath, file.content)
  }

  return projectDir
}

/**
 * Get instructions for after project creation.
 */
export function getPostInitInstructions(projectDir: string, projectName: string): string {
  return `
Project created at: ${projectDir}

Next steps:
  1. cd ${projectName}
  2. asdf install
  3. pnpm install
  4. pnpx agent-eval-opencode --dry
  5. pnpx agent-eval-opencode

Prerequisites:
  - Docker running (Colima, Docker Desktop, or OrbStack)
  - OpenCode authenticated with GitHub Copilot
`
}
