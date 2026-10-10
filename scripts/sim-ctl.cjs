#!/usr/bin/env node
/**
 * sim-ctl.cjs
 * Antigravity CLI Controller for the Flowbean Scale Optical Simulator & Mobile Testbed.
 * Allows Antigravity agent or developer to remotely trigger scale models, scenarios, weights,
 * and remotely start/stop mobile brew shots via Supabase Realtime peer-to-peer broadcast.
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const PORT = 4321;
const SUPABASE_URL = 'https://vdxfmvzdmcqfixbegumb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeGZtdnpkbWNxZml4YmVndW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NzYsImV4cCI6MjEwNjA5Mjc3Nn0.8MlspGgPxNuIiRWH819Z59MKgVWzAQdqKPE3cqFv9P4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const liveChannel = supabase.channel('anti-testbed-live');

function sendLocalCommand(cmd) {
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
          console.log(`[SIM-CTL] ✅ Simulator:`, resp);
        } catch (e) {
          console.log(`[SIM-CTL] Response:`, body);
        }
      });
    }
  );

  req.on('error', (err) => {
    console.error(`[SIM-CTL] ⚠️ Simulator server not reachable on port ${PORT}:`, err.message);
  });

  req.write(data);
  req.end();
}

async function sendRemoteMobileCommand(action, extra = {}) {
  await liveChannel.subscribe();
  console.log(`[SIM-CTL] 📡 Sending remote command to Mobile Phone: "${action}"...`);
  await liveChannel.send({
    type: 'broadcast',
    event: 'remote_cmd',
    payload: {
      action,
      source: 'antigravity_cli',
      timestamp: Date.now(),
      ...extra,
    },
  });
  console.log(`[SIM-CTL] 📱 Mobile command broadcasted!`);
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

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: node scripts/sim-ctl.cjs [options]

Autonomous End-to-End Brewing & Testing:
  --full-brew                                Remotely starts shot on mobile + starts espresso flow on simulator
  --start-shot                               Remotely presses "Start Shot" on mobile phone
  --stop-shot                                Remotely presses "Stop Shot" on mobile phone
  --tare                                     Remotely tares mobile scale to 0.0g

Simulator Controls:
  --scenario <standard|spike|digits|timer>   Run an automated test scenario on PC screen
  --model <pure_weight|muvna|timemore|acaia> Switch simulated scale model
  --set-weight <grams> [--timer <sec>]       Set static weight and timer on simulator
  --stop                                     Stop active scenario on simulator
  --status                                   Check simulator connection and status
  --export                                   Export current session ground truth to disk
`);
    process.exit(0);
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--full-brew') {
      console.log(`\n☕ STARTING AUTONOMOUS E2E ESPRESSO EXTRACTION TEST...`);
      await sendRemoteMobileCommand('start_shot');
      sendLocalCommand({ action: 'run_scenario', name: 'standard' });
      setTimeout(() => process.exit(0), 1500);
      return;
    } else if (arg === '--start-shot') {
      await sendRemoteMobileCommand('start_shot');
      setTimeout(() => process.exit(0), 1000);
      return;
    } else if (arg === '--stop-shot') {
      await sendRemoteMobileCommand('stop_shot');
      setTimeout(() => process.exit(0), 1000);
      return;
    } else if (arg === '--tare') {
      await sendRemoteMobileCommand('tare');
      setTimeout(() => process.exit(0), 1000);
      return;
    } else if (arg === '--scenario') {
      const name = args[i + 1] || 'standard';
      sendLocalCommand({ action: 'run_scenario', name });
      return;
    } else if (arg === '--model') {
      const model = args[i + 1] || 'pure_weight';
      sendLocalCommand({ action: 'set_model', model });
      return;
    } else if (arg === '--set-weight') {
      const weight = parseFloat(args[i + 1]) || 0;
      let timer = 0;
      const timerIdx = args.indexOf('--timer');
      if (timerIdx !== -1) timer = parseFloat(args[timerIdx + 1]) || 0;
      sendLocalCommand({ action: 'set_weight', weight, timer });
      return;
    } else if (arg === '--stop') {
      sendLocalCommand({ action: 'stop' });
      return;
    } else if (arg === '--status') {
      checkStatus();
      return;
    } else if (arg === '--export') {
      exportGroundTruth();
      return;
    }
  }
}

main().catch(console.error);
