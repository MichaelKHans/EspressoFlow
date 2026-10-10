#!/usr/bin/env node
/**
 * sim-live-monitor.cjs
 * Antigravity Live Optical Telemetry Stream Receiver.
 * Subscribes to Supabase Realtime 'anti-testbed-live' channel and prints live frame OCR metrics.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vdxfmvzdmcqfixbegumb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeGZtdnpkbWNxZml4YmVndW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NzYsImV4cCI6MjEwNjA5Mjc3Nn0.8MlspGgPxNuIiRWH819Z59MKgVWzAQdqKPE3cqFv9P4';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);
const channel = client.channel('anti-testbed-live');

console.log(`\n======================================================`);
console.log(`📡 ANTIGRAVITY LIVE SCALE TELEMETRY MONITOR`);
console.log(`======================================================`);
console.log(`Connecting to Supabase channel: "anti-testbed-live"...`);

channel.on('broadcast', { event: 'remote_cmd' }, (payload) => {
  const cmd = payload.payload;
  console.log(`\n🕹️ [COMMAND] ${cmd.source || 'CLIENT'}: ${cmd.action} -> "${cmd.name || ''}"\n`);
});

let frameCount = 0;

channel.on('broadcast', { event: 'live_frame' }, (payload) => {
  const f = payload.payload;
  frameCount++;

  const timeStr = new Date(f.timestamp).toLocaleTimeString();
  const weightStr = `${f.weight.toFixed(1)}g`.padStart(6, ' ');
  const flowStr = `${f.flow.toFixed(1)} g/s`.padStart(8, ' ');
  const rawStr = `"${f.rawText || ''}"`.padEnd(8, ' ');
  const confStr = `${Math.round(f.confidence * 100)}%`.padStart(4, ' ');
  const statusStr = f.isOutlier ? '⚠️ OUTLIER' : '✅ OK';

  console.log(`[${timeStr}] 📱 #${frameCount.toString().padStart(4, '0')} | WEIGHT: ${weightStr} | FLOW: ${flowStr} | RAW: ${rawStr} | CONF: ${confStr} | ${statusStr}`);
});

channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log(`🟢 LISTENING! Waiting for phone camera frames...\n`);
    console.log(`TIME     | FRAME | WEIGHT | FLOW     | RAW      | CONF | STATUS`);
    console.log(`---------+-------+--------+----------+----------+------+-------`);
  }
});
