#!/usr/bin/env npx tsx
/**
 * Integration test that mimics the actual eval flow with Docker sandbox.
 * Tests the full lifecycle without requiring an AI API key.
 */

import {
  createSandbox,
  collectLocalFiles,
  splitTestFiles,
  verifyNoTestFiles,
  getSandboxBackendInfo,
} from '../src/lib/sandbox.js';
import { createVitestConfig, runValidation } from '../src/lib/agents/shared.js';
import { resolve } from 'path';

async function main() {
  console.log('=== Docker Sandbox Eval Flow Integration Test ===\n');

  // Check sandbox backend
  const backendInfo = getSandboxBackendInfo();
  console.log(`Sandbox backend: ${backendInfo.description}\n`);

  if (backendInfo.backend !== 'docker') {
    console.error('ERROR: Expected Docker backend, but got:', backendInfo.backend);
    console.error('Set SANDBOX_BACKEND=docker to run this test');
    process.exit(1);
  }

  const fixturePath = resolve(process.cwd(), 'test-docker-integration/evals/simple-test');
  console.log(`Fixture path: ${fixturePath}\n`);

  // Step 1: Collect files (like agent does)
  console.log('1. Collecting files from fixture...');
  const allFiles = await collectLocalFiles(fixturePath);
  console.log(`   Found ${allFiles.length} files`);

  // Step 2: Split test files (agent hides these)
  console.log('2. Splitting workspace and test files...');
  const { workspaceFiles, testFiles } = splitTestFiles(allFiles);
  console.log(`   Workspace files: ${workspaceFiles.map(f => f.path).join(', ') || '(none)'}`);
  console.log(`   Test files: ${testFiles.map(f => f.path).join(', ')}`);

  // Step 3: Create sandbox
  console.log('3. Creating Docker sandbox...');
  const sandbox = await createSandbox({
    backend: 'docker',
    timeout: 120000,
    runtime: 'node24',
  });
  console.log(`   Sandbox ID: ${sandbox.sandboxId}`);
  console.log(`   Working dir: ${sandbox.getWorkingDirectory()}`);

  try {
    // Step 4: Upload workspace files only (not test files)
    console.log('4. Uploading workspace files...');
    await sandbox.uploadFiles(workspaceFiles);
    console.log('   Done');

    // Step 5: Install dependencies
    console.log('5. Running npm install...');
    const installResult = await sandbox.runCommand('npm', ['install']);
    if (installResult.exitCode !== 0) {
      throw new Error(`npm install failed: ${installResult.stderr}`);
    }
    console.log('   Done');

    // Step 6: Verify no test files leaked
    console.log('6. Verifying no test files in sandbox...');
    await verifyNoTestFiles(sandbox);
    console.log('   Verified - no test files present');

    // Step 7: Simulate agent writing code (normally AI would do this)
    console.log('7. Simulating agent writing code...');
    await sandbox.writeFiles({
      'hello.js': `export function greet(name) {
  return \`Hello, \${name}!\`;
}
`,
    });
    console.log('   Created hello.js');

    // Step 8: Upload test files (after "agent" completes)
    console.log('8. Uploading test files for validation...');
    await sandbox.uploadFiles(testFiles);
    console.log('   Done');

    // Step 9: Create vitest config
    console.log('9. Creating vitest config...');
    await createVitestConfig(sandbox);
    console.log('   Done');

    // Step 10: Run validation
    console.log('10. Running validation (vitest)...');
    const results = await runValidation(sandbox, []);

    if (results.test?.success) {
      console.log('   ✅ Tests PASSED');
    } else {
      console.log('   ❌ Tests FAILED');
      console.log('   Output:', results.test?.output?.slice(0, 500));
    }

    // Step 11: Read generated file back
    console.log('11. Reading generated file...');
    const content = await sandbox.readFile('hello.js');
    console.log(`   hello.js content:\n${content}`);

    console.log('\n=== Integration Test Complete ===');
    console.log(results.allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED');

    process.exit(results.allPassed ? 0 : 1);
  } finally {
    console.log('\nCleaning up sandbox...');
    await sandbox.stop();
    console.log('Done');
  }
}

main().catch(err => {
  console.error('\n❌ Integration test failed:', err.message);
  process.exit(1);
});
