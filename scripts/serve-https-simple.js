// ============================================================================
// SIMPLE HTTPS SERVER FOR PWA TESTING (No dependencies)
// ============================================================================

const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3443;
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

// Self-signed certificate (for development only)
const certOptions = {
  key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDC4gHsKu3w8bR+
XnmhWXCjUKVaZN2vLm8dY6zOXKc5jP5Q0gq/tM0rqVY+9fNnKl9L5vW7bV9K9Y
4G9fY3bnK0Mn9f8V9f0P6K7Q9nYdM5g9Y3g8nQx0m9K1N8vLpPmC8qVoY9M9c
2P0q9dV9q9L9M9q9v9f9o9d9r9k9e9r9i9s9h9g9f9e9d9c9b9a9090819273
647382910clq2w3e4r5t6y7u8i9o0p1q2w3e4r5t6y7u8i9o0p1q2w3e4r5t6y
-----END PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
MIIDSjCCAjICCQC7S5TZm7TN0TANBgkqhkiG9w0BAQsFADCBgzELMAkGA1UEBhMC
VVMxETAPBgNVBAgMCE5ldyBZb3JrMREwDwYDVQQHDAhOZXcgWW9yazEOMAwGA1UE
CgwFTG9jYWwxETAPBgNVBAsMCERldmVsb3AxFDASBgNVBAMMC2xvY2FsaG9zdC5j
b20xFTATBgkqhkiG9w0BCQEWBmRldkBkZXYwHhcNMjQwMTAxMDAwMDAwWhcNMjUw
MTAxMDAwMDAwWjCBgzELMAkGA1UEBhMCVVMxETAPBgNVBAgMCE5ldyBZb3JrMREw
DwYDVQQHDAhOZXcgWW9yazEOMAwGA1UECgwFTG9jYWwxETAPBgNVBAsMCERldmVs
b3AxFDASBgNVBAMMC2xvY2FsaG9zdC5jb20xFTATBgkqhkiG9w0BCQEWBmRldkBk
ZXYwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDC4gHsKu3w8bR+Xnmh
WXCjUKVaZN2vLm8dY6zOXKc5jP5Q0gq/tM0rqVY+9fNnKl9L5vW7bV9K9Y4G9fY3
bnK0Mn9f8V9f0P6K7Q9nYdM5g9Y3g8nQx0m9K1N8vLpPmC8qVoY9M9c2P0q9dV9
q9L9M9q9v9f9o9d9r9k9e9r9i9s9h9g9f9e9d9c9b9a909081927364738291
-----END CERTIFICATE-----`
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

const server = https.createServer({
  key: certOptions.key,
  cert: certOptions.cert
}, (req, res) => {
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
});

server.listen(PORT, () => {
  console.log('🔒 HTTPS Development Server running!');
  console.log(`📱 PWA Test URL: https://localhost:${PORT}`);
  console.log(`📱 Standalone PWA: https://localhost:${PORT}/build/JdrBab.html`);
  console.log('');
  console.log('⚠️  Certificate Warning:');
  console.log('1. Browser will show "Not secure" - click "Advanced"');
  console.log('2. Click "Proceed to localhost (unsafe)" - this is OK for development');
  console.log('3. Then test PWA installation');
  console.log('');
  console.log('🔧 PWA Testing:');
  console.log('• F12 → Application → Manifest (check validation)');
  console.log('• F12 → Application → Service Workers (check registration)');
  console.log('• Look for install button in address bar');
  console.log('');
  console.log('Press Ctrl+C to stop');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});