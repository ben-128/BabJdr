const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Change to parent directory for serving files
process.chdir(path.join(__dirname, '..'));

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch(extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpeg'; break;
    case '.jpeg': contentType = 'image/jpeg'; break;
    case '.gif': contentType = 'image/gif'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
    case '.ico': contentType = 'image/x-icon'; break;
    case '.pdf': contentType = 'application/pdf'; break;
    case '.mp3': contentType = 'audio/mpeg'; break;
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}/`);
  console.log('📱 No live reload - manual refresh needed');
  
  // Open browser automatically on Windows
  if (process.platform === 'win32') {
    exec(`start http://localhost:${PORT}`);
  }
});