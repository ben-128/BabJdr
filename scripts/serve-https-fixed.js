// ============================================================================
// SIMPLE HTTPS SERVER FOR PWA TESTING (Fixed certificate)
// ============================================================================

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT_HTTPS = 3443;
const PORT_HTTP = 3000;
const rootDir = path.resolve(__dirname, '..');

// MIME types for common files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

function serveFile(filePath, res) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found: ' + filePath);
    }
  } catch (error) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Server error: ' + error.message);
  }
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Special handling for PWA files
  if (pathname === '/manifest.json') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    const manifest = fs.readFileSync(path.join(rootDir, 'manifest.json'));
    res.end(manifest);
    return;
  }
  
  if (pathname === '/sw.js') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Access-Control-Allow-Origin': '*'
    });
    const sw = fs.readFileSync(path.join(rootDir, 'sw.js'));
    res.end(sw);
    return;
  }
  
  // Serve static files
  const filePath = path.join(rootDir, pathname);
  serveFile(filePath, res);
}

// Try to create HTTPS server with selfsigned
function tryHTTPS() {
  try {
    const selfsigned = require('selfsigned');
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, { days: 365, algorithm: 'sha256' });
    
    const httpsServer = https.createServer({
      key: pems.private,
      cert: pems.cert
    }, handleRequest);

    httpsServer.listen(PORT_HTTPS, () => {
      console.log('🔒 HTTPS Server running!');
      console.log(`📱 PWA Test URL: https://localhost:${PORT_HTTPS}`);
      console.log(`📱 Standalone: https://localhost:${PORT_HTTPS}/build/JdrBab.html`);
      console.log('');
      console.log('⚠️  Accept certificate warning in browser');
      console.log('🔧 F12 → Application → Manifest to check PWA');
    });

    return httpsServer;
  } catch (error) {
    console.log('❌ HTTPS failed:', error.message);
    return null;
  }
}

// Fallback to HTTP server
function createHTTPServer() {
  const httpServer = http.createServer(handleRequest);
  
  httpServer.listen(PORT_HTTP, () => {
    console.log('🌐 HTTP Server running (PWA will NOT work - needs HTTPS)');
    console.log(`📄 Test URL: http://localhost:${PORT_HTTP}`);
    console.log('');
    console.log('⚠️  PWA requires HTTPS. Options:');
    console.log('1. Install selfsigned: npm install selfsigned --save-dev');
    console.log('2. Use build/JdrBab.html (standalone version)');
    console.log('3. Deploy to HTTPS hosting (GitHub Pages, Netlify)');
  });
  
  return httpServer;
}

// Try HTTPS first, fallback to HTTP
console.log('🚀 Starting PWA test server...');

let server;
try {
  require('selfsigned');
  server = tryHTTPS();
} catch (e) {
  console.log('📦 Installing selfsigned for HTTPS...');
  try {
    require('child_process').execSync('npm install selfsigned --save-dev', { stdio: 'inherit' });
    server = tryHTTPS();
  } catch (installError) {
    console.log('❌ Could not install selfsigned, using HTTP fallback');
    server = createHTTPServer();
  }
}

if (!server) {
  server = createHTTPServer();
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});