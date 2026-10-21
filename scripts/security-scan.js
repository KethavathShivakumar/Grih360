const { execSync } = require('child_process');

function scanDiff() {
  const diff = execSync('git diff 7d8d850', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const lines = diff.split('\n');

  const secretPatterns = [
    { name: 'Hardcoded Password Assignment', regex: /password\s*[:=]\s*['"][^'"]{4,}['"]/i },
    { name: 'Hardcoded Secret Assignment', regex: /secret\s*[:=]\s*['"][^'"]{6,}['"]/i },
    { name: 'MongoDB Connection URI', regex: /mongodb(\+srv)?:\/\/[^\s'"]+/i },
    { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
    { name: 'Google OAuth Token', regex: /ya29\.[0-9A-Za-z-_]+/ },
    { name: 'Private Key Block', regex: /BEGIN (RSA|EC|DSA|OPENSSH|PRIVATE) KEY/ },
    { name: 'Hardcoded SMTP Pass', regex: /smtpPass\s*[:=]\s*['"][^'"]+['"]/i },
    { name: 'Hardcoded JWT Secret', regex: /jwtAccessSecret\s*[:=]\s*['"][^'"]+['"]/i },
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  ];

  const results = [];
  let currentFile = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('diff --git')) {
      currentFile = line;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      for (const pattern of secretPatterns) {
        if (pattern.regex.test(line)) {
          // Exclude comments, types, and schema validations
          if (
            line.includes('//') &&
            !line.includes('http') &&
            !line.includes('secret')
          ) {
            continue;
          }
          results.push({
            file: currentFile,
            pattern: pattern.name,
            line: line.trim()
          });
        }
      }
    }
  }

  return results;
}

const findings = scanDiff();
console.log('Total potential secret findings:', findings.length);
if (findings.length > 0) {
  findings.forEach(f => {
    console.log(`[ALERT] ${f.pattern} in ${f.file}`);
    console.log(`  > ${f.line}`);
  });
} else {
  console.log('CLEAN: No secrets, passwords, connection strings, or private keys found in diff.');
}
