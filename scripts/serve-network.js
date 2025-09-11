// ============================================================================
// NETWORK HTTPS SERVER FOR MOBILE PWA TESTING
// ============================================================================

const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');

const PORT = 3443;
const rootDir = path.resolve(__dirname, '..');

// Get local network IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg'
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
      res.end('File not found');
    }
  } catch (error) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Server error: ' + error.message);
  }
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  if (pathname === '/') pathname = '/index.html';
  
  // Special PWA files
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
  
  const filePath = path.join(rootDir, pathname);
  serveFile(filePath, res);
}

// Start server
try {
  const selfsigned = require('selfsigned');
  const attrs = [{ name: 'commonName', value: getLocalIP() }];
  const pems = selfsigned.generate(attrs, { days: 365, algorithm: 'sha256' });
  
  const server = https.createServer({
    key: pems.private,
    cert: pems.cert
  }, handleRequest);

  const localIP = getLocalIP();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log('🌐 HTTPS Network Server running!');
    console.log('');
    console.log('📱 Access from mobile/tablet:');
    console.log(`   https://${localIP}:${PORT}`);
    console.log(`   https://${localIP}:${PORT}/build/JdrBab.html`);
    console.log('');
    console.log('💻 Access from computer:');
    console.log(`   https://localhost:${PORT}`);
    console.log('');
    console.log('⚠️  Mobile: Accept certificate warning');
    console.log('📱 Then: Add to Home Screen / Install App');
    console.log('');
    console.log('Press Ctrl+C to stop');
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Server stopped');
    process.exit(0);
  });

} catch (error) {
  console.error('❌ Failed to start server:', error.message);
}