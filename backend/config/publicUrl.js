const path = require('path');

/** Public base URL (no trailing slash). */
function getPublicUrl() {
  const fromEnv = process.env.PUBLIC_URL || process.env.APP_URL || process.env.RENDER_EXTERNAL_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const port = process.env.PORT || 3001;
  return `http://localhost:${port}`;
}

/** Vite dev server URL when the SPA is not served by Express. */
function getDevFrontendUrl() {
  const fromEnv = process.env.FRONTEND_URL || process.env.VITE_DEV_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:5173';
}

function getFrontendDistPath() {
  return path.join(__dirname, '..', '..', 'frontend', 'dist');
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

module.exports = {
  getPublicUrl,
  getDevFrontendUrl,
  getFrontendDistPath,
  isProduction,
};
