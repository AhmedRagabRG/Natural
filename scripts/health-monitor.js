#!/usr/bin/env node

'use strict';

const https = require('https');
const http  = require('http');
const { execSync } = require('child_process');

const TARGET_URL   = process.env.HEALTH_URL   || 'https://naturalspicesuae.com/api/health';
const MAX_RETRIES  = parseInt(process.env.HEALTH_RETRIES  || '3', 10);
const RETRY_DELAY  = parseInt(process.env.HEALTH_DELAY    || '5000', 10); 
const TIMEOUT_MS   = parseInt(process.env.HEALTH_TIMEOUT  || '8000', 10); 
const PM2_TARGET   = process.env.PM2_TARGET   || 'Natural';
const log = (msg) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
};

function ping(url) {
  return new Promise((resolve) => {
    const parsed  = new URL(url);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      timeout:  TIMEOUT_MS,
      headers:  { 'User-Agent': 'NaturalHealthMonitor/1.0' },
    };

    const req = lib.request(options, (res) => {
      resolve({ ok: true, status: res.statusCode });
      res.resume(); // consume body
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, reason: 'timeout' });
    });

    req.on('error', (err) => {
      resolve({ ok: false, reason: err.message });
    });

    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  log(`Health monitor started → ${TARGET_URL}`);
  log(`Max retries: ${MAX_RETRIES} | Delay: ${RETRY_DELAY}ms | Timeout: ${TIMEOUT_MS}ms`);

  let successCount = 0;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    log(`Attempt ${attempt}/${MAX_RETRIES} ...`);
    const result = await ping(TARGET_URL);

    if (result.ok) {
      log(`✓ Server responded (HTTP ${result.status}) — server is healthy.`);
      successCount++;
      break; 
    } else {
      log(`✗ Attempt ${attempt} failed: ${result.reason}`);
      if (attempt < MAX_RETRIES) {
        log(`  Waiting ${RETRY_DELAY / 1000}s before next attempt...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  if (successCount === 0) {
    log(`⚠️  All ${MAX_RETRIES} attempts failed — triggering PM2 restart (${PM2_TARGET}) ...`);
    try {
      const output = execSync(`pm2 restart ${PM2_TARGET} --update-env`, {
        encoding: 'utf8',
        timeout: 30000,
      });
      log(`PM2 restart output:\n${output.trim()}`);
      log('✓ PM2 restart command executed successfully.');
    } catch (err) {
      log(`✗ PM2 restart failed: ${err.message}`);
      process.exit(1);
    }
  }

  log('Health monitor finished.\n');
}

run().catch((err) => {
  log(`Unexpected error: ${err.message}`);
  process.exit(1);
});
