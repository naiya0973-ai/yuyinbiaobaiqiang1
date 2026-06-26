#!/usr/bin/env node
/**
 * Create or update the Render backend service via API.
 *
 * Required env:
 *   RENDER_API_KEY
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env:
 *   SUPABASE_URL (default: voice-confession-wall project)
 *   RENDER_OWNER_ID (auto-detected when omitted)
 */

const API = 'https://api.render.com/v1';
const REPO = 'https://github.com/naiya0973-ai/yuyinbiaobaiqiang1';
const SERVICE_NAME = 'voice-confession-wall-api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qgsuabymkaglivexzpjo.supabase.co';
const BASE_URL = process.env.BASE_URL || 'https://voice-confession-wall-api.onrender.com';

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

async function renderFetch(path, options = {}) {
  const token = required('RENDER_API_KEY');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(`Render API ${options.method || 'GET'} ${path} failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

async function getOwnerId() {
  if (process.env.RENDER_OWNER_ID) {
    return process.env.RENDER_OWNER_ID;
  }

  const owners = await renderFetch('/owners?limit=20');
  const owner = owners.find((item) => item.owner?.email || item.owner?.name) || owners[0];
  if (!owner?.owner?.id) {
    throw new Error('Unable to detect Render ownerId. Set RENDER_OWNER_ID manually.');
  }
  return owner.owner.id;
}

async function listServices() {
  const items = await renderFetch('/services?limit=100');
  return items
    .map((item) => item.service)
    .filter(Boolean);
}

async function createService(ownerId) {
  return renderFetch('/services', {
    method: 'POST',
    body: JSON.stringify({
      type: 'web_service',
      name: SERVICE_NAME,
      ownerId,
      repo: REPO,
      branch: 'main',
      autoDeploy: 'yes',
      rootDir: 'server',
      envVars: buildEnvVars(),
      serviceDetails: {
        env: 'node',
        plan: 'free',
        region: 'singapore',
        buildCommand: 'npm install',
        startCommand: 'npm start',
        healthCheckPath: '/health'
      }
    })
  });
}

function buildEnvVars() {
  return [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '10000' },
    { key: 'USE_SUPABASE_STORAGE', value: 'true' },
    { key: 'SUPABASE_URL', value: SUPABASE_URL },
    { key: 'SUPABASE_STORAGE_AUDIO_BUCKET', value: 'audios' },
    { key: 'SUPABASE_ANON_KEY', value: required('SUPABASE_ANON_KEY') },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: required('SUPABASE_SERVICE_ROLE_KEY') },
    { key: 'JWT_SECRET', value: process.env.JWT_SECRET || randomSecret() },
    { key: 'BASE_URL', value: BASE_URL },
    { key: 'CLIENT_ORIGIN', value: 'https://naiya0973-ai.github.io' },
    { key: 'ADMIN_ORIGIN', value: 'https://naiya0973-ai.github.io' },
    { key: 'DEMO_SMS_CODE', value: '123456' }
  ].map((item) => ({ ...item, type: 'envVar' }));
}

function randomSecret() {
  return require('crypto').randomBytes(32).toString('hex');
}

async function updateEnvVars(serviceId) {
  for (const envVar of buildEnvVars()) {
    await renderFetch(`/services/${serviceId}/env-vars`, {
      method: 'POST',
      body: JSON.stringify(envVar)
    }).catch(async () => {
      await renderFetch(`/services/${serviceId}/env-vars/${encodeURIComponent(envVar.key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value: envVar.value })
      });
    });
  }
}

async function triggerDeploy(serviceId) {
  return renderFetch(`/services/${serviceId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'do_not_clear' })
  });
}

async function waitForHealthy(timeoutMs = 600000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      if (data.status === 'ok') {
        return true;
      }
    } catch {
      // service still waking up
    }
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  return false;
}

async function main() {
  const ownerId = await getOwnerId();
  const services = await listServices();
  let service = services.find((item) => item.name === SERVICE_NAME);

  if (!service) {
    console.log(`Creating Render service ${SERVICE_NAME}...`);
    const created = await createService(ownerId);
    service = created.service || created;
  } else {
    console.log(`Updating env vars for ${SERVICE_NAME} (${service.id})...`);
    await updateEnvVars(service.id);
  }

  console.log('Triggering deploy...');
  await triggerDeploy(service.id);

  console.log(`Waiting for ${BASE_URL}/health ...`);
  const healthy = await waitForHealthy();
  if (!healthy) {
    console.warn('Deploy triggered but health check did not pass within 10 minutes.');
    console.warn(`Check Render dashboard: https://dashboard.render.com/`);
    process.exitCode = 2;
    return;
  }

  console.log('Backend deployed successfully.');
  console.log(`Health: ${BASE_URL}/health`);
  console.log(`API: ${BASE_URL}/api`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
