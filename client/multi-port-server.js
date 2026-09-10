import http from 'http';
import httpProxy from 'http-proxy';

const TARGET = 'http://127.0.0.1:3000';

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  ws: true,
  xfwd: true
});

proxy.on('error', (err, req, res) => {
  console.error(`[MultiPort Proxy Error] ${req.url}:`, err.message);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connecting Clinical Deck...</title>
        <meta http-equiv="refresh" content="3">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #F0F7F9;
            color: #253237;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .card {
            background: white;
            border: 1px solid #C2DFE3;
            border-radius: 12px;
            padding: 32px;
            max-width: 460px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(37,50,55,0.06);
          }
          .spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #E0FBFC;
            border-top: 3px solid #5C6B73;
            border-radius: 50%;
            margin: 0 auto 16px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { margin: 0 0 8px; font-size: 14px; }
          p { margin: 0; font-size: 13px; color: #5C6B73; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h2>Initializing Clinical Deck...</h2>
          <p>Connecting to Vite development server on port 3000. Auto-refreshing in 3 seconds...</p>
        </div>
      </body>
      </html>
    `);
  }
});

const PORT_MAPPINGS = [
  { port: 3001, role: 'DOCTOR', name: 'Dr. Aisha Khan', description: 'Clinical Doctor Deck' },
  { port: 3002, role: 'RECEPTIONIST', name: 'Sarah Jenkins', description: 'Reception & Queue Desk' },
  { port: 3003, role: 'PATIENT', name: 'John Doe', description: 'Patient Self-Service Portal' },
  { port: 3004, role: 'ADMIN', name: 'Administrator', description: 'Admin Vault & Audit Trail' },
  { port: 3005, role: 'PHARMACIST', name: 'Tariq Mehmood, RPh', description: 'Pharmacy & Dispensary Suite' },
];

console.log('\n============================================================');
console.log('🚀 INITIALIZING DEDICATED ROLE-BASED LOCALHOST PORTS');
console.log('   Browser Origin & LocalStorage Isolated per Port');
console.log('============================================================');

PORT_MAPPINGS.forEach(({ port, role, name }) => {
  const server = http.createServer((req, res) => {
    req.headers['x-isolated-port'] = String(port);
    req.headers['x-isolated-role'] = role;
    proxy.web(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    proxy.ws(req, socket, head);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port ${port}] ⚠️ Warning: Port ${port} already occupied. Please release it.`);
    } else {
      console.error(`[Port ${port}] Server error:`, err.message);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Port ${port}] 🩺 ROLE: ${role.padEnd(12)} -> ${name.padEnd(16)} (http://localhost:${port})`);
  });
});

console.log('------------------------------------------------------------');
console.log('[Port 3000] 🌐 CENTRAL COMMAND HUB -> http://localhost:3000');
console.log('============================================================\n');
