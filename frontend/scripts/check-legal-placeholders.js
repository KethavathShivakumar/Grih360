const fs = require('fs');
const path = require('path');

const legalFiles = [
  path.resolve(__dirname, '../src/app/features/public/privacy/privacy.component.ts'),
  path.resolve(__dirname, '../src/app/features/public/terms/terms.component.ts'),
];

const placeholderRegex = /\[[A-Z_]{3,}\]/g;
let foundPlaceholders = 0;
const details = [];

for (const filePath of legalFiles) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const matches = line.match(placeholderRegex);
    if (matches) {
      matches.forEach(m => {
        foundPlaceholders++;
        details.push({
          file: path.relative(path.resolve(__dirname, '..'), filePath),
          line: idx + 1,
          placeholder: m,
          text: line.trim()
        });
      });
    }
  });
}

console.log(`[Legal Check] Scanned ${legalFiles.length} legal template files.`);

const isStrict = process.argv.includes('--strict') || process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

if (foundPlaceholders > 0) {
  console.log(`[Legal Check] Found ${foundPlaceholders} unpopulated bracket placeholders:`);
  details.forEach(d => {
    console.log(`  - ${d.file}:${d.line} -> ${d.placeholder}`);
  });

  if (isStrict) {
    console.error('\n[FATAL] Production build failed: Legal pages contain unpopulated bracket placeholders!');
    console.error('Please populate all legal entities before deploying to production.\n');
    process.exit(1);
  } else {
    console.log('\n[INFO] Development mode: Placeholders allowed for staging/review. Use --strict to fail.\n');
    process.exit(0);
  }
} else {
  console.log('[Legal Check] All legal placeholders are verified and populated. Clean check passed.\n');
  process.exit(0);
}
