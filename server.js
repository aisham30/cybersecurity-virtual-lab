'use strict';
/**
 * Lightweight static file server for Docker deployment.
 * Serves the VLab Cybersecurity Learning Platform UI as a web application.
 * 
 * In production (Docker), this replaces the Electron shell and serves
 * the renderer UI directly to a web browser on port 3000.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME type mappings
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.map':  'application/json',
};

// Base directories for serving files
const RENDERER_DIR = path.join(__dirname, 'app', 'renderer');
const PROJECT_ROOT = __dirname;

/**
 * Resolve a request URL to a file path.
 * Handles the node_modules font references from index.html.
 */
function resolveFilePath(url) {
  // Remove query strings and hash fragments
  const cleanUrl = url.split('?')[0].split('#')[0];

  // Serve root as index.html
  if (cleanUrl === '/' || cleanUrl === '') {
    return path.join(RENDERER_DIR, 'index.html');
  }

  // Handle node_modules references (fonts loaded by index.html)
  if (cleanUrl.includes('node_modules/')) {
    const nmPath = cleanUrl.substring(cleanUrl.indexOf('node_modules/'));
    return path.join(PROJECT_ROOT, nmPath);
  }

  // Default: serve from renderer directory
  return path.join(RENDERER_DIR, cleanUrl);
}

const server = http.createServer((req, res) => {
  // Only allow GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method Not Allowed');
  }

  const filePath = resolveFilePath(req.url);

  // Security: prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(PROJECT_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  // Check if file exists and serve it
  fs.stat(normalizedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA-like behavior
      const indexPath = path.join(RENDERER_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, data) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(data);
      });
      return;
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Set cache headers for static assets
    const cacheControl = (ext === '.html')
      ? 'no-cache'
      : 'public, max-age=86400';

    fs.readFile(normalizedPath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🛡️  VLab Cybersecurity Learning Platform`);
  console.log(`🌐  Server running at http://localhost:${PORT}`);
  console.log(`📦  Serving from: ${RENDERER_DIR}`);
  console.log(`⏱️  Started at: ${new Date().toISOString()}\n`);
});
