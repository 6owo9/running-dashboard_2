#!/usr/bin/env node

const { execSync } = require('node:child_process');

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: 'inherit', shell: true });
}

run('git diff --check');

try {
  run('cd frontend && pnpm run build');
} catch {
  console.error('프론트엔드 빌드가 실패했습니다.');
  process.exitCode = 1;
}

try {
  run('cd backend && ./gradlew test');
} catch {
  try {
    run('cd backend && gradlew.bat test');
  } catch {
    console.error('백엔드 테스트가 실패했습니다.');
    process.exitCode = 1;
  }
}
