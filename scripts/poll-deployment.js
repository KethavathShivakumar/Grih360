const targetCommit = '72bbc19';
const url = 'https://grih360.vercel.app/api/v1/health';

async function checkHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    return { error: err.message };
  }
}

async function poll() {
  console.log(`Polling ${url} for commitHash: ${targetCommit}...`);
  for (let attempt = 1; attempt <= 30; attempt++) {
    const data = await checkHealth();
    const liveCommit = data.commitHash || 'UNKNOWN';
    console.log(`[Attempt ${attempt}] Status: ${data.message || data.error || 'Running'} | Live commit: ${liveCommit} | SMTP: ${data.smtp || data.email || 'N/A'}`);
    if (liveCommit === targetCommit) {
      console.log(`\nSUCCESS: Deployment is LIVE with target commit ${targetCommit}!`);
      console.log('Full Health Response:', JSON.stringify(data, null, 2));
      process.exit(0);
    }
    // Sleep 8 seconds before next check
    await new Promise(r => setTimeout(r, 8000));
  }
  console.error(`TIMEOUT: Deployment did not reach ${targetCommit} after 30 attempts.`);
  process.exit(1);
}

poll();
