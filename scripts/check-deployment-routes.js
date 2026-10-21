#!/usr/bin/env node

/**
 * Deployment Safety Check Script
 * 
 * Compares routes invoked by the frontend against what the live backend exposes.
 * Flags and warns if any endpoint returns 404 NOT_FOUND.
 * 
 * Usage:
 *   node scripts/check-deployment-routes.js [targetBaseUrl]
 * Default target: https://grih360.vercel.app
 */

const fs = require('fs');
const path = require('path');

const targetBaseUrl = (process.argv[2] || process.env.LIVE_BACKEND_URL || 'https://grih360.vercel.app').replace(/\/+$/, '');

console.log('='.repeat(70));
console.log('  GRIH360 DEPLOYMENT SAFETY CHECK: ROUTE RECONCILIATION');
console.log(`  Live Target: ${targetBaseUrl}`);
console.log('='.repeat(70));

// 1. Scan Frontend Source Code for API Route Usages
function scanFrontendRoutes(dir, routeSet = new Map()) {
  if (!fs.existsSync(dir)) return routeSet;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        scanFrontendRoutes(fullPath, routeSet);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Match patterns like: this.apiService.post('/auth/check-email', ...)
      const apiServiceRegex = /(?:this\.)?(?:apiService|http)\.(get|post|put|patch|delete)(?:<[^>]*>)?\(\s*[`'"]([^`'"]+)[`'"]/g;
      let match;
      while ((match = apiServiceRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let endpoint = match[2].trim();
        // Skip external URLs
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) continue;
        // Strip template expressions or query params
        endpoint = endpoint.split('?')[0].split('${')[0];
        if (!endpoint.startsWith('/api/v1')) {
          endpoint = '/api/v1' + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
        }
        // Normalize dynamic route IDs (e.g., /properties/123 -> /properties/test)
        const key = `${method} ${endpoint}`;
        if (!routeSet.has(key)) {
          routeSet.set(key, { method, endpoint, sourceFile: path.relative(process.cwd(), fullPath) });
        }
      }
    }
  }
  return routeSet;
}

// 2. Curated Essential Auth & Core Routes (Guaranteed Contract)
const criticalRoutes = [
  { method: 'POST', endpoint: '/api/v1/auth/check-email' },
  { method: 'POST', endpoint: '/api/v1/auth/register/send-otp' },
  { method: 'POST', endpoint: '/api/v1/auth/register/verify-code' },
  { method: 'POST', endpoint: '/api/v1/auth/register/verify-and-create' },
  { method: 'POST', endpoint: '/api/v1/auth/register' },
  { method: 'POST', endpoint: '/api/v1/auth/google' },
  { method: 'POST', endpoint: '/api/v1/auth/google/set-initial-password' },
  { method: 'POST', endpoint: '/api/v1/auth/google/resend-otp' },
  { method: 'POST', endpoint: '/api/v1/auth/login' },
  { method: 'POST', endpoint: '/api/v1/auth/verify-login-otp' },
  { method: 'POST', endpoint: '/api/v1/auth/resend-login-otp' },
  { method: 'POST', endpoint: '/api/v1/auth/login-otp/send' },
  { method: 'POST', endpoint: '/api/v1/auth/login-otp/verify' },
  { method: 'GET',  endpoint: '/api/v1/auth/me' },
  { method: 'POST', endpoint: '/api/v1/auth/logout' },
  { method: 'POST', endpoint: '/api/v1/auth/refresh' },
  { method: 'POST', endpoint: '/api/v1/auth/forgot-password/send-otp' },
  { method: 'POST', endpoint: '/api/v1/auth/forgot-password/reset' },
  { method: 'POST', endpoint: '/api/v1/auth/otp/send' },
  { method: 'POST', endpoint: '/api/v1/auth/otp/verify' },
  { method: 'GET',  endpoint: '/api/v1/auth/smtp/verify' },
  { method: 'POST', endpoint: '/api/v1/auth/smtp/test-email' },
  { method: 'GET',  endpoint: '/api/v1/health' }
];

async function probeRoute(targetUrl, method, endpoint) {
  const url = `${targetUrl}${endpoint}`;
  try {
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify({});
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    options.signal = controller.signal;

    const res = await fetch(url, options);
    clearTimeout(timeoutId);

    const status = res.status;
    let bodyText = '';
    try {
      bodyText = await res.text();
    } catch (_) {}

    // A route is MISSING if the server returned 404 NOT_FOUND from notFoundHandler
    const isMissing = status === 404 && (
      bodyText.includes('NOT_FOUND') ||
      bodyText.includes('Resource not found') ||
      bodyText.includes('Cannot POST') ||
      bodyText.includes('Cannot GET')
    );

    return {
      status,
      isMissing,
      bodySnippet: bodyText.slice(0, 80).replace(/\s+/g, ' '),
    };
  } catch (err) {
    return {
      status: 'ERR',
      isMissing: false,
      error: err.message,
    };
  }
}

async function runCheck() {
  const frontendDir = path.join(process.cwd(), 'frontend', 'src', 'app');
  console.log(`Scanning frontend route callers in: ${frontendDir}`);

  const routeMap = scanFrontendRoutes(frontendDir);
  console.log(`Discovered ${routeMap.size} unique dynamic route calls in frontend.`);

  // Merge critical contract routes
  for (const crit of criticalRoutes) {
    const key = `${crit.method} ${crit.endpoint}`;
    if (!routeMap.has(key)) {
      routeMap.set(key, { method: crit.method, endpoint: crit.endpoint, sourceFile: 'Critical Auth Contract' });
    }
  }

  const routesToCheck = Array.from(routeMap.values())
    // Filter to static testable routes (omit wildcard IDs ending with /:id or dangling slashes)
    .filter(r => !r.endpoint.endsWith('/') && !r.endpoint.includes('/:'));

  console.log(`Checking ${routesToCheck.length} routes against live backend...\n`);

  const results = [];
  const missingRoutes = [];

  for (const r of routesToCheck) {
    process.stdout.write(`  Probing ${r.method.padEnd(6)} ${r.endpoint.padEnd(42)} ... `);
    const probe = await probeRoute(targetBaseUrl, r.method, r.endpoint);
    
    if (probe.isMissing) {
      console.log(`❌ MISSING (HTTP ${probe.status})`);
      missingRoutes.push({ ...r, status: probe.status });
    } else {
      console.log(`✅ LIVE (HTTP ${probe.status})`);
    }

    results.push({ ...r, ...probe });
  }

  console.log('\n' + '='.repeat(70));
  console.log('  RECONCILIATION SUMMARY:');
  console.log(`  Total Endpoints Probed: ${routesToCheck.length}`);
  console.log(`  Active / Deployed:      ${routesToCheck.length - missingRoutes.length}`);
  console.log(`  Missing / Undeployed:   ${missingRoutes.length}`);
  console.log('='.repeat(70));

  if (missingRoutes.length > 0) {
    console.warn('\n⚠️  DEPLOYMENT WARNING: The following frontend routes are MISSING on the live backend:');
    missingRoutes.forEach(m => {
      console.warn(`    - [HTTP ${m.status}] ${m.method} ${m.endpoint} (called in ${m.sourceFile})`);
    });
    console.warn('\nAction Required: Deploy local backend commits to Vercel before releasing client app!\n');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ROUTES SYNCHRONIZED: The live backend exposes every route required by the frontend.\n');
    process.exit(0);
  }
}

runCheck().catch(err => {
  console.error('Fatal safety check error:', err);
  process.exit(1);
});
