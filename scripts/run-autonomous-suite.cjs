#!/usr/bin/env node
/**
 * run-autonomous-suite.cjs
 * Antigravity 100% Autonomous End-to-End Test Suite for Flowbean Mobile & Scale Optical Simulator.
 * 
 * Controls both:
 * 1. Mobile Phone (via Supabase Realtime broadcast commands: tare, start_shot, stop_shot, close_modal)
 * 2. PC Scale Simulator (via HTTP REST commands: scenarios, models, static weights, tares)
 * 
 * Tracks live mobile camera frames in real time, evaluates OCR accuracy against Ground Truth,
 * and prints an executive engineering report without requiring any manual user interaction!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PORT = 4321;
const SUPABASE_URL = 'https://vdxfmvzdmcqfixbegumb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeGZtdnpkbWNxZml4YmVndW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NzYsImV4cCI6MjEwNjA5Mjc3Nn0.8MlspGgPxNuIiRWH819Z59MKgVWzAQdqKPE3cqFv9P4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const liveChannel = supabase.channel('anti-testbed-live');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendLocalCommand(cmd) {
  return new Promise((resolve, reject) => {
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
            resolve(JSON.parse(body));
          } catch {
            resolve({ raw: body });
          }
        });
      }
    );
    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

async function sendRemoteMobileCommand(action, extra = {}) {
  await liveChannel.send({
    type: 'broadcast',
    event: 'remote_cmd',
    payload: {
      action,
      source: 'autonomous_test_suite',
      timestamp: Date.now(),
      ...extra,
    },
  });
}

// Telemetry frame buffer
let recordedFrames = [];
let latestMobileFrame = null;
let isRecording = false;

liveChannel.on('broadcast', { event: 'live_frame' }, (payload) => {
  const f = payload.payload;
  latestMobileFrame = f;
  if (isRecording) {
    recordedFrames.push(f);
  }
});

async function waitForMobileConnection(timeoutSec = 10) {
  console.log(`\n⏳ Checking connection with mobile phone (waiting up to ${timeoutSec}s)...`);
  const start = Date.now();
  while (Date.now() - start < timeoutSec * 1000) {
    if (latestMobileFrame && Date.now() - latestMobileFrame.timestamp < 3000) {
      console.log(`✅ Mobile phone is LIVE! Latest reading: ${latestMobileFrame.weight.toFixed(1)}g (Confidence: ${Math.round(latestMobileFrame.confidence * 100)}%)`);
      return true;
    }
    await sleep(400);
  }
  return false;
}

async function main() {
  console.log(`\n===============================================================`);
  console.log(`🚀 ANTIGRAVITY AUTONOMOUS TEST SUITE RUNNER`);
  console.log(`   Full Control of Mobile App (Flowbean) + Optical PC Simulator`);
  console.log(`===============================================================`);

  await liveChannel.subscribe();
  await sleep(1000);

  const isConnected = await waitForMobileConnection(8);
  if (!isConnected) {
    console.warn(`⚠️ Warning: No live frames detected from phone yet.`);
    console.warn(`   Make sure Flowbean is open on the phone and pointed at the PC scale.`);
  }

  const results = {
    standardShot: null,
    channelingSpike: null,
    digitAccuracy: [],
  };

  // -----------------------------------------------------------------
  // TEST CASE 1: Standard Extraction (0.0g -> 36.0g @ 2.2 g/s)
  // -----------------------------------------------------------------
  console.log(`\n---------------------------------------------------------------`);
  console.log(`☕ TEST 1: Standard Extraction (0.0g -> 36.0g @ 2.2 g/s)`);
  console.log(`---------------------------------------------------------------`);

  console.log(`1. Taring simulator display to 0.0g...`);
  await sendLocalCommand({ action: 'set_weight', weight: 0, timer: 0 });
  await sendLocalCommand({ action: 'set_model', model: 'pure_weight' });
  await sleep(500);

  console.log(`2. Sending Tare to mobile phone...`);
  await sendRemoteMobileCommand('tare');
  await sendRemoteMobileCommand('close_modal');
  await sleep(1500);

  console.log(`3. Remotely triggering "Start Shot" on mobile...`);
  await sendRemoteMobileCommand('start_shot');
  await sleep(500);

  console.log(`4. Triggering 30s Standard Extraction flow on PC simulator...`);
  recordedFrames = [];
  isRecording = true;
  await sendLocalCommand({ action: 'run_scenario', name: 'standard' });

  // Monitor live for 28 seconds
  const testStart = Date.now();
  while (Date.now() - testStart < 28000) {
    if (latestMobileFrame) {
      const elapsed = ((Date.now() - testStart) / 1000).toFixed(1);
      process.stdout.write(`\r   [${elapsed}s] 📱 Mobile OCR: ${latestMobileFrame.weight.toFixed(1)}g | Flow: ${latestMobileFrame.flow.toFixed(1)} g/s | Raw: "${latestMobileFrame.rawText}" | Conf: ${Math.round(latestMobileFrame.confidence * 100)}%   `);
    }
    await sleep(250);
  }
  console.log('');

  console.log(`5. Remotely stopping shot on mobile phone...`);
  await sendRemoteMobileCommand('stop_shot');
  await sleep(1500);
  isRecording = false;

  const validFrames = recordedFrames.filter((f) => !f.isOutlier);
  const avgConf = recordedFrames.length > 0
    ? (recordedFrames.reduce((acc, f) => acc + f.confidence, 0) / recordedFrames.length) * 100
    : 0;
  const maxWeight = recordedFrames.reduce((max, f) => Math.max(max, f.weight), 0);

  results.standardShot = {
    totalFrames: recordedFrames.length,
    validFrames: validFrames.length,
    outliers: recordedFrames.length - validFrames.length,
    avgConfidence: avgConf.toFixed(1),
    maxWeight: maxWeight.toFixed(1),
    pass: maxWeight >= 33.0 && maxWeight <= 38.0,
  };

  console.log(`📊 Test 1 Results: Total Frames: ${recordedFrames.length} | Max Weight: ${maxWeight.toFixed(1)}g | Avg Conf: ${avgConf.toFixed(1)}% | Status: ${results.standardShot.pass ? '✅ PASS' : '⚠️ CHECK'}`);

  console.log(`6. Dismissing shot summary modal on mobile...`);
  await sendRemoteMobileCommand('close_modal');
  await sleep(1500);

  // -----------------------------------------------------------------
  // TEST CASE 2: Violent Channeling Spike Test
  // -----------------------------------------------------------------
  console.log(`\n---------------------------------------------------------------`);
  console.log(`⚡ TEST 2: Channeling Spike Test (Flow Jump to 4.8 g/s)`);
  console.log(`---------------------------------------------------------------`);

  console.log(`1. Taring scale and mobile...`);
  await sendLocalCommand({ action: 'set_weight', weight: 0, timer: 0 });
  await sendRemoteMobileCommand('tare');
  await sleep(1200);

  console.log(`2. Starting shot on mobile & starting spike scenario on PC...`);
  await sendRemoteMobileCommand('start_shot');
  await sleep(500);

  recordedFrames = [];
  isRecording = true;
  await sendLocalCommand({ action: 'run_scenario', name: 'spike' });

  const spikeStart = Date.now();
  let peakFlow = 0;
  while (Date.now() - spikeStart < 22000) {
    if (latestMobileFrame) {
      peakFlow = Math.max(peakFlow, latestMobileFrame.flow);
      const elapsed = ((Date.now() - spikeStart) / 1000).toFixed(1);
      process.stdout.write(`\r   [${elapsed}s] 📱 Mobile Flow: ${latestMobileFrame.flow.toFixed(1)} g/s (Peak: ${peakFlow.toFixed(1)} g/s) | Weight: ${latestMobileFrame.weight.toFixed(1)}g   `);
    }
    await sleep(250);
  }
  console.log('');

  console.log(`3. Stopping shot on mobile...`);
  await sendRemoteMobileCommand('stop_shot');
  await sleep(1500);
  isRecording = false;

  results.channelingSpike = {
    peakFlowGps: peakFlow.toFixed(1),
    channelingDetected: peakFlow >= 3.5,
    pass: peakFlow >= 3.5,
  };

  console.log(`📊 Test 2 Results: Peak Flow: ${peakFlow.toFixed(1)} g/s | Channeling Detected: ${results.channelingSpike.channelingDetected ? 'YES' : 'NO'} | Status: ${results.channelingSpike.pass ? '✅ PASS' : '⚠️ CHECK'}`);

  console.log(`4. Dismissing summary modal...`);
  await sendRemoteMobileCommand('close_modal');
  await sleep(1500);

  // -----------------------------------------------------------------
  // TEST CASE 3: Digit Precision Benchmark (0.0 -> 9.9 -> 18.4 -> 36.0)
  // -----------------------------------------------------------------
  console.log(`\n---------------------------------------------------------------`);
  console.log(`🔢 TEST 3: Static Digit Precision Benchmark`);
  console.log(`---------------------------------------------------------------`);

  const benchmarkValues = [0.0, 1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9, 18.4, 36.0];

  for (const targetVal of benchmarkValues) {
    process.stdout.write(`   Testing ${targetVal.toFixed(1)}g... `);
    await sendLocalCommand({ action: 'set_weight', weight: targetVal, timer: 0 });
    // Wait for display update and camera frame
    await sleep(1400);

    const detected = latestMobileFrame ? latestMobileFrame.weight : null;
    const diff = detected !== null ? Math.abs(detected - targetVal) : 999;
    const isAccurate = diff <= 0.15;

    results.digitAccuracy.push({
      expected: targetVal,
      detected,
      accurate: isAccurate,
      confidence: latestMobileFrame ? latestMobileFrame.confidence : 0,
    });

    if (isAccurate) {
      console.log(`✅ MATCH! (Mobile read: ${detected !== null ? detected.toFixed(1) : 'null'}g, Conf: ${Math.round((latestMobileFrame?.confidence || 0) * 100)}%)`);
    } else {
      console.log(`⚠️ DIFF (${detected !== null ? detected.toFixed(1) : 'null'}g vs expected ${targetVal}g)`);
    }
  }

  // Reset scale to 0.0g
  await sendLocalCommand({ action: 'set_weight', weight: 0, timer: 0 });
  await sendRemoteMobileCommand('tare');

  // -----------------------------------------------------------------
  // EXECUTIVE SUMMARY REPORT
  // -----------------------------------------------------------------
  const accurateDigits = results.digitAccuracy.filter((d) => d.accurate).length;
  const digitRate = Math.round((accurateDigits / results.digitAccuracy.length) * 100);

  console.log(`\n===============================================================`);
  console.log(`🏆 AUTONOMOUS TEST SUITE COMPLETE! EXECUTIVE REPORT`);
  console.log(`===============================================================`);
  console.log(`Test 1 (30s Extraction):  ${results.standardShot.pass ? '✅ PASS' : '❌ FAIL'} | Yield: ${results.standardShot.maxWeight}g | Avg Conf: ${results.standardShot.avgConfidence}%`);
  console.log(`Test 2 (Channeling Spike): ${results.channelingSpike.pass ? '✅ PASS' : '❌ FAIL'} | Peak Flow: ${results.channelingSpike.peakFlowGps} g/s`);
  console.log(`Test 3 (Digit Precision):  ${digitRate >= 80 ? '✅ PASS' : '⚠️ WARN'} | Accuracy: ${digitRate}% (${accurateDigits}/${results.digitAccuracy.length} digits verified)`);
  console.log(`===============================================================\n`);

  // Save report to disk
  const reportPath = path.resolve(__dirname, '../diagnostics/autonomous-test-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`💾 Detailed metrics report saved to: ${reportPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Fatal error running test suite:', err);
  process.exit(1);
});
