#!/usr/bin/env node
/**
 * sim-ctl.cjs
 * Antigravity CLI Controller for the Flowbean Scale Optical Simulator.
 * Allows Antigravity agent or developer to remotely trigger scale models, scenarios, and weights.
 */

const http = require('http');

const PORT = 4321;

function sendCommand(cmd) {
  const data = JSON.stringify(cmd);
  const req = http.request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/command',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    },
    (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const resp = JSON.parse(body);
          console.log(`[SIM-CTL] ✅ Success!`, resp);
        } catch (e) {
          console.log(`[SIM-CTL] Response:`, body);
        }
      });
    }
  );

  req.on('error', (err) => {
    console.error(`[SIM-CTL] ❌ Could not connect to simulator server on port ${PORT}:`, err.message);
    console.error(`Tip: Make sure "npm run sim:server" is running.`);
  });

  req.write(data);
  req.end();
}

function checkStatus() {
  http.get(`http://localhost:${PORT}/api/status`, (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      try {
        const status = JSON.parse(body);
        console.log(`\n--- 📊 SIMULATOR STATUS ---`);
        console.log(`Active Clients: ${status.clients}`);
        console.log(`Session Active: ${status.isSessionActive}`);
        console.log(`Logged Points:  ${status.sessionLength}`);
        if (status.latestGroundTruth) {
          console.log(`Latest GT:      ${status.latestGroundTruth.weight}g | Timer: ${status.latestGroundTruth.timer} | Flow: ${status.latestGroundTruth.flow} g/s`);
        }
        console.log(`---------------------------\n`);
      } catch (e) {
        console.log(body);
      }
    });
  }).on('error', (err) => {
    console.error(`[SIM-CTL] Server not reachable on port ${PORT}:`, err.message);
  });
}

function exportGroundTruth() {
  const req = http.request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/export-ground-truth',
      method: 'POST',
    },
    (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => console.log(`[SIM-CTL] 💾 Ground truth export:`, body));
    }
  );
  req.on('error', (e) => console.error(e.message));
  req.end();
}

// Parse CLI Arguments
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log(`
Usage: node scripts/sim-ctl.cjs [options]

Commands:
  --scenario <standard|spike|digits|timer>   Run an automated test scenario
  --model <muvna|timemore|acaia|lcd>         Switch simulated scale model
  --set-weight <grams> [--timer <sec>]       Set static weight and timer
  --stop                                     Stop active scenario
  --status                                   Check simulator connection and status
  --export                                   Export current session ground truth to disk
`);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--scenario') {
    const name = args[i + 1] || 'standard';
    sendCommand({ action: 'run_scenario', name });
    break;
  } else if (arg === '--model') {
    const model = args[i + 1] || 'muvna';
    sendCommand({ action: 'set_model', model });
    break;
  } else if (arg === '--set-weight') {
    const weight = parseFloat(args[i + 1]) || 0;
    let timer = 0;
    const timerIdx = args.indexOf('--timer');
    if (timerIdx !== -1) timer = parseFloat(args[timerIdx + 1]) || 0;
    sendCommand({ action: 'set_weight', weight, timer });
    break;
  } else if (arg === '--stop') {
    sendCommand({ action: 'stop' });
    break;
  } else if (arg === '--status') {
    checkStatus();
    break;
  } else if (arg === '--export') {
    exportGroundTruth();
    break;
  }
}
