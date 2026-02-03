#!/usr/bin/env npx tsx
/**
 * Quick manual test for Docker sandbox.
 * Run with: npx tsx scripts/test-docker-sandbox.ts
 */

import { DockerSandboxManager } from '../src/lib/docker-sandbox.js';

async function main() {
  console.log('Testing Docker sandbox...\n');

  console.log('1. Creating sandbox...');
  const sandbox = await DockerSandboxManager.create({
    timeout: 120000,
    runtime: 'node24',
  });
  console.log(`   Container ID: ${sandbox.sandboxId}`);
  console.log(`   Working directory: ${sandbox.getWorkingDirectory()}`);

  try {
    console.log('\n2. Verifying non-root user...');
    const idResult = await sandbox.runCommand('id');
    console.log(`   ${idResult.stdout.trim()}`);
    if (idResult.stdout.includes('uid=0')) {
      throw new Error('Running as root! Expected non-root user.');
    }
    console.log('   ✓ Running as non-root user');

    console.log('\n3. Running echo command...');
    const echoResult = await sandbox.runCommand('echo', ['Hello from Docker!']);
    console.log(`   Exit code: ${echoResult.exitCode}`);
    console.log(`   Output: ${echoResult.stdout.trim()}`);

    console.log('\n4. Checking Node.js version...');
    const nodeResult = await sandbox.runCommand('node', ['--version']);
    console.log(`   Node version: ${nodeResult.stdout.trim()}`);

    console.log('\n5. Writing files...');
    await sandbox.writeFiles({
      'package.json': JSON.stringify({ name: 'test', version: '1.0.0', type: 'module' }, null, 2),
      'index.js': 'console.log("Hello from index.js!");',
    });
    console.log('   Files written successfully');

    console.log('\n6. Reading file back...');
    const content = await sandbox.readFile('package.json');
    console.log(`   package.json content: ${content.substring(0, 50)}...`);

    console.log('\n7. Running Node.js script...');
    const runResult = await sandbox.runCommand('node', ['index.js']);
    console.log(`   Output: ${runResult.stdout.trim()}`);

    console.log('\n8. Running npm install...');
    const npmResult = await sandbox.runCommand('npm', ['install']);
    console.log(`   Exit code: ${npmResult.exitCode}`);

    console.log('\n9. Testing npm install -g (global)...');
    const globalInstall = await sandbox.runCommand('npm', ['install', '-g', 'cowsay']);
    console.log(`   Exit code: ${globalInstall.exitCode}`);
    if (globalInstall.exitCode !== 0) {
      console.log(`   stderr: ${globalInstall.stderr}`);
      throw new Error('Global npm install failed');
    }

    console.log('\n10. Verifying global package works...');
    const cowsayResult = await sandbox.runCommand('cowsay', ['Hello from Docker!']);
    console.log(`   ${cowsayResult.stdout.trim().split('\n').slice(0, 3).join('\n   ')}`);

    console.log('\n✅ All tests passed!');
  } finally {
    console.log('\n11. Stopping sandbox...');
    await sandbox.stop();
    console.log('   Sandbox stopped');
  }
}

main().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
