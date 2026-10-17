const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const DIST_DIR = path.resolve(__dirname, '../frontend/dist/frontend/browser');
const PORT = 4200;
const BACKEND_PORT = 5000;

// Read JWT secret from backend .env
const envContent = fs.readFileSync(path.resolve(__dirname, '../backend/.env'), 'utf8');
const jwtSecretMatch = envContent.match(/JWT_ACCESS_SECRET=([^\r\n]+)/);
const jwtRefreshMatch = envContent.match(/JWT_REFRESH_SECRET=([^\r\n]+)/);
const jwtSecret = jwtSecretMatch ? jwtSecretMatch[1].trim() : 'nivas360_dev_jwt_access_secret_key_2026';
const jwtRefreshSecret = jwtRefreshMatch ? jwtRefreshMatch[1].trim() : 'nivas360_dev_jwt_refresh_secret_key_2026';

const tenantUser = {
  _id: '6ab809b345e466a0da72ebf2',
  id: '6ab809b345e466a0da72ebf2',
  name: 'Vikram',
  email: 'kethavathshiva14@gmail.com',
  phone: '9876543299',
  role: 'TENANT',
  isActive: true,
  createdAt: new Date().toISOString()
};

const authToken = jwt.sign(
  { userId: tenantUser._id, role: 'TENANT', email: tenantUser.email },
  jwtSecret,
  { expiresIn: '2h' }
);
const refreshToken = jwt.sign(
  { userId: tenantUser._id, role: 'TENANT', email: tenantUser.email },
  jwtRefreshSecret,
  { expiresIn: '30d' }
);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const rawIndexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
const authInjectScript = `
<script>
  try {
    localStorage.setItem('grih360_auth_token', ${JSON.stringify(authToken)});
    localStorage.setItem('grih360_refresh_token', ${JSON.stringify(refreshToken)});
    localStorage.setItem('grih360_user_session', JSON.stringify(${JSON.stringify(tenantUser)}));
    sessionStorage.setItem('grih360_auth_token', ${JSON.stringify(authToken)});
  } catch(e) {}
</script>
`;
const indexWithAuth = rawIndexHtml.replace('</head>', `${authInjectScript}</head>`);

const adminUser = {
  _id: '6abbf3ca69ece7b4ebf063b8',
  id: '6abbf3ca69ece7b4ebf063b8',
  name: 'Shiva',
  email: 'shivakumarkethavath53@gmail.com',
  phone: '7702508990',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date().toISOString()
};

const adminAuthToken = jwt.sign(
  { userId: adminUser._id, role: 'ADMIN', email: adminUser.email },
  jwtSecret,
  { expiresIn: '2h' }
);
const adminRefreshToken = jwt.sign(
  { userId: adminUser._id, role: 'ADMIN', email: adminUser.email },
  jwtRefreshSecret,
  { expiresIn: '30d' }
);

const adminAuthInjectScript = `
<script>
  try {
    localStorage.setItem('grih360_auth_token', ${JSON.stringify(adminAuthToken)});
    localStorage.setItem('grih360_refresh_token', ${JSON.stringify(adminRefreshToken)});
    localStorage.setItem('grih360_user_session', JSON.stringify(${JSON.stringify(adminUser)}));
    sessionStorage.setItem('grih360_auth_token', ${JSON.stringify(adminAuthToken)});
  } catch(e) {}
</script>
`;
const otpInjectScript = `
<script>
  try {
    sessionStorage.setItem('grih360_active_challenge', JSON.stringify({
      challengeId: 'demo-otp-challenge-12345',
      maskedEmail: 't***t@grih360.com',
      selectedRole: 'TENANT'
    }));
  } catch(e) {}
</script>
`;
const indexWithOtpAuth = rawIndexHtml.replace('</head>', `${otpInjectScript}</head>`);

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/')) {
    const proxyReq = http.request(
      `http://127.0.0.1:${BACKEND_PORT}${req.url}`,
      { method: req.method, headers: req.headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (err) => {
      res.writeHead(502);
      res.end(`Backend proxy error: ${err.message}`);
    });
    req.pipe(proxyReq);
    return;
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(DIST_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  if (pathname.includes('verify-email')) {
    res.end(indexWithOtpAuth);
  } else if (pathname.startsWith('/admin/') && !pathname.includes('login')) {
    res.end(indexWithAdminAuth);
  } else if (pathname.startsWith('/tenant/')) {
    res.end(indexWithAuth);
  } else {
    res.end(rawIndexHtml);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Static Server] Serving ${DIST_DIR} on http://127.0.0.1:${PORT}`);
});
