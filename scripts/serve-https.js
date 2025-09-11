// ============================================================================
// HTTPS DEVELOPMENT SERVER FOR PWA TESTING
// ============================================================================

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3443; // HTTPS port for PWA testing

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Serve manifest.json with correct MIME type
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, '..', 'manifest.json'));
});

// Serve service worker with correct MIME type
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, '..', 'sw.js'));
});

// Serve icons
app.use('/icons', express.static(path.join(__dirname, '..', 'icons')));

// Serve build directory
app.use('/build', express.static(path.join(__dirname, '..', 'build')));

// Create self-signed certificate for local HTTPS (development only)
const createSelfSignedCert = () => {
  const selfsigned = require('selfsigned');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, { days: 365 });
  return {
    key: pems.private,
    cert: pems.cert
  };
};

// Start HTTPS server
try {
  // Try to install selfsigned if not present
  try {
    require('selfsigned');
  } catch (e) {
    console.log('📦 Installing selfsigned certificate generator...');
    require('child_process').execSync('npm install selfsigned --save-dev', { stdio: 'inherit' });
  }

  const credentials = createSelfSignedCert();
  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(PORT, () => {
    console.log('🚀 HTTPS Development Server running!');
    console.log(`📱 PWA Test URL: https://localhost:${PORT}`);
    console.log(`📱 Standalone PWA: https://localhost:${PORT}/build/JdrBab.html`);
    console.log('');
    console.log('🔧 For PWA testing:');
    console.log('1. Accept the self-signed certificate warning');
    console.log('2. Open Chrome DevTools > Application > Manifest');
    console.log('3. Check for "Install" prompt in address bar');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down HTTPS server...');
    httpsServer.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('❌ Failed to start HTTPS server:', error.message);
  console.log('');
  console.log('🔧 Alternative: Install manually and retry:');
  console.log('npm install selfsigned --save-dev');
  console.log('node scripts/serve-https.js');
  console.log('');
  console.log('🌐 Or test PWA on a public server with valid HTTPS certificate.');
}