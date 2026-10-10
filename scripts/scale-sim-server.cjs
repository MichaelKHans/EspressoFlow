#!/usr/bin/env node
/**
 * scale-sim-server.cjs
 * Zero-dependency Node.js HTTP & SSE Testbed Server for Flowbean Optical Benchmarking.
 * Enables Antigravity agent to control the PC Scale Simulator and log ground truth telemetry.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4321;
const PUBLIC_HTML = path.join(__dirname, '..', 'public', 'scale-simulator.html');
const DIAGNOSTICS_DIR = path.join(__dirname, '..', 'diagnostics');

if (!fs.existsSync(DIAGNOSTICS_DIR)) {
  fs.mkdirSync(DIAGNOSTICS_DIR, { recursive: true });
}

let sseClients = [];
let latestGroundTruth = null;
let currentSessionLog = [];
let isSessionActive = false;

function broadcastCommand(cmd) {
  const data = `data: ${JSON.stringify(cmd)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(data);
    } catch (e) {}
  });
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Serve Simulator HTML
  if (url.pathname === '/' || url.pathname === '/simulator') {
    if (fs.existsSync(PUBLIC_HTML)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(PUBLIC_HTML).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('scale-simulator.html not found in public directory');
    }
    return;
  }

  // 2. Server-Sent Events (SSE) Endpoint for Live Agent Control
  if (url.pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('retry: 2000\n\n');
    res.write(`data: ${JSON.stringify({ type: 'connected', clients: sseClients.length + 1 })}\n\n`);

    sseClients.push(res);
    console.log(`[SIM-SERVER] 📱 Browser client connected to SSE. Total clients: ${sseClients.length}`);

    req.on('close', () => {
      sseClients = sseClients.filter((c) => c !== res);
      console.log(`[SIM-SERVER] 📱 Browser client disconnected. Remaining: ${sseClients.length}`);
    });
    return;
  }

  // 3. Command Endpoint (Called by Antigravity or CLI to trigger test)
  if (url.pathname === '/api/command' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const cmd = JSON.parse(body);
        console.log('[SIM-SERVER] 🕹️ Command received:', cmd);

        if (cmd.action === 'run_scenario') {
          isSessionActive = true;
          currentSessionLog = [];
        } else if (cmd.action === 'stop') {
          isSessionActive = false;
        }

        broadcastCommand(cmd);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', command: cmd, clients: sseClients.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 4. Ground Truth Telemetry Ingestion (Sent by the Simulator Page)
  if (url.pathname === '/api/ground-truth' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        latestGroundTruth = data;

        if (isSessionActive) {
          currentSessionLog.push(data);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Status API
  if (url.pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'running',
        clients: sseClients.length,
        latestGroundTruth,
        sessionLength: currentSessionLog.length,
        isSessionActive,
      })
    );
    return;
  }

  // 6. Save and Export Ground Truth Session
  if (url.pathname === '/api/export-ground-truth' && req.method === 'POST') {
    const filename = `ground_truth_${Date.now()}.json`;
    const filepath = path.join(DIAGNOSTICS_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(currentSessionLog, null, 2), 'utf-8');
    console.log(`[SIM-SERVER] 💾 Saved ground truth session: ${filepath} (${currentSessionLog.length} points)`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'saved', filepath, count: currentSessionLog.length }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`☕ FLOWBEAN SCALE OPTICAL TESTBED SERVER IS RUNNING`);
  console.log(`======================================================`);
  console.log(`🌐 Simulator URL:     http://localhost:${PORT}/`);
  console.log(`🕹️ Remote Control:    http://localhost:${PORT}/api/command`);
  console.log(`📡 SSE Stream:        http://localhost:${PORT}/api/events`);
  console.log(`📂 Diagnostics dir:   ${DIAGNOSTICS_DIR}`);
  console.log(`======================================================\n`);
});
