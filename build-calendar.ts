import { execSync } from 'child_process';

try {
  execSync('npx tsc --project tsconfig.json', { stdio: 'inherit', cwd: 'packages/calendar' });
  console.log('Calendar package built successfully');
} catch (err) {
  console.error('Build failed');
  process.exit(1);
}