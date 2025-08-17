#!/usr/bin/env node

/**
 * Simple HTTP Server for Testing Taskbar Functionality
 * Serves the ppPage application locally for proper testing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const HOST = 'localhost';

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    
    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Remove query parameters for file serving
  pathname = pathname.split('?')[0];
  
  // Security: prevent directory traversal
  if (pathname.includes('..')) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }
  
  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    serveFile(res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}/`);
  console.log('📋 Test URLs:');
  console.log(`   Main page: http://${HOST}:${PORT}/`);
  console.log(`   Taskbar test: http://${HOST}:${PORT}/taskbar-final-test.html`);
  console.log(`   Editor: http://${HOST}:${PORT}/editor.html`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});
