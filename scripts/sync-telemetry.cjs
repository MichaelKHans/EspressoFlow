/**
 * Espresso Flow - PC Telemetry Sync Utility
 * Downloads flight data recordings from Supabase into local `diagnostics/` folder
 * Run via: npm run sync:diag
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vdxfmvzdmcqfixbegumb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeGZtdnpkbWNxZml4YmVndW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NzYsImV4cCI6MjEwNjA5Mjc3Nn0.8MlspGgPxNuIiRWH819Z59MKgVWzAQdqKPE3cqFv9P4';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncTelemetry() {
  console.log('\n======================================================');
  console.log('📡 ESPRESSO FLOW - SCALE TELEMETRY PC SYNC');
  console.log('======================================================\n');
  console.log(`Connecting to Supabase at: ${SUPABASE_URL}...`);

  const outputBaseDir = path.resolve(__dirname, '..', 'diagnostics');
  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
    console.log(`Created output directory: ${outputBaseDir}`);
  }

  const { data, error } = await client
    .from('scale_diagnostic_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('❌ Error fetching sessions from Supabase:', error.message);
    if (error.code === 'PGRST205') {
      console.log('\n⚠️ Tabellen "scale_diagnostic_sessions" er endnu ikke oprettet i Supabase.');
      console.log('Gå ind i Supabase Dashboard -> SQL Editor, og kør scriptet i "supabase/schema.sql" (sektion 7).');
    }
    return;
  }

  if (!data || data.length === 0) {
    console.log('ℹ️ Ingen telemetri-sessioner fundet i Supabase endnu.');
    console.log('1. Åbn Flowbean appen på mobilen og gå til Admin (#admin)');
    console.log('2. Slå "Sort Boks Telemetri" TIL');
    console.log('3. Kør et skud eller start OCR-kameraet for at optage telemetri.');
    return;
  }

  console.log(`✅ Fandt ${data.length} optagede session(er) i skyen. Synkroniserer...\n`);

  let newSynced = 0;
  for (const session of data) {
    const sessionDir = path.join(outputBaseDir, session.session_id || `session_${session.id}`);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Save JSON payload
    const jsonPath = path.join(sessionDir, 'telemetry.json');
    const payload = {
      sessionId: session.session_id,
      createdAt: session.created_at,
      device: session.device_info,
      recipe: session.recipe_info,
      summary: session.summary_info,
      samples: session.telemetry_samples,
    };
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

    // Save Initial Image if present
    if (session.initial_image && session.initial_image.includes(',')) {
      const base64Data = session.initial_image.split(',')[1];
      const imgPath = path.join(sessionDir, 'initial_roi.jpg');
      fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
    }

    // Save Final Image if present
    if (session.final_image && session.final_image.includes(',')) {
      const base64Data = session.final_image.split(',')[1];
      const imgPath = path.join(sessionDir, 'final_roi.jpg');
      fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
    }

    newSynced++;
    console.log(`  ✓ Synkroniseret: ${session.session_id} (${(session.telemetry_samples || []).length} frames, ${session.created_at})`);
  }

  console.log(`\n🎉 Færdig! ${newSynced} sessioner gemt i: ${outputBaseDir}\n`);
}

syncTelemetry().catch((err) => {
  console.error('Uventet fejl under synkronisering:', err);
});
