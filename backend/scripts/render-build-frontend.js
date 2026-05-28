/**
 * On Render, `npm install` runs in backend/ — build the Vite app into frontend/dist
 * so Express can serve it on the same URL as the API.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.env.RENDER !== 'true') {
  process.exit(0);
}

const repoRoot = path.join(__dirname, '..', '..');
const frontendDir = path.join(repoRoot, 'frontend');
const distDir = path.join(frontendDir, 'dist');

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  console.log('Frontend dist already present, skipping build.');
  process.exit(0);
}

if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
  console.warn('frontend/ not found — skipping frontend build.');
  process.exit(0);
}

console.log('Building frontend for production (Render)...');
execSync('npm install && npm run build', {
  cwd: frontendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_URL: process.env.VITE_API_URL || '/api',
  },
});
console.log('Frontend build complete.');
