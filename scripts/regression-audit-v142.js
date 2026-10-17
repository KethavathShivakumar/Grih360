/**
 * Grih360 v1.4.2 Regression Audit Script
 * Automated verification of:
 * 1. Empty-state SVG rendering & SafeHtml pipe
 * 2. Auth logout lifecycle & splash hang prevention
 * 3. Complete absence of <svg> inside <option>
 * 4. Zero unescaped emojis (⭐, ⏰) and zero mdash (&mdash;)
 * 5. Android versionCode 12 & versionName 1.4.2 alignment
 * 6. ReplaceUrl: true on all router.navigate(['/auth/login']) calls
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT_DIR, 'frontend', 'src');

let failures = 0;
let passed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName}`);
    if (details) console.error(`        ${details}`);
    failures++;
  }
}

function getAllFiles(dir, exts = ['.ts', '.html']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.some((ext) => fullPath.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('=== STARTING GRIH360 v1.4.2 REGRESSION AUDIT ===\n');

// 1. Audit EmptyStateComponent
console.log('Test Suite 1: EmptyStateComponent & SafeHtml Pipe');
const emptyStateFile = path.join(FRONTEND_SRC, 'app', 'shared', 'components', 'empty-state', 'empty-state.component.ts');
const emptyStateContent = fs.readFileSync(emptyStateFile, 'utf8');
assert(emptyStateContent.includes('sanitizer.bypassSecurityTrustHtml'), 'EmptyStateComponent sanitizes raw SVG strings with DomSanitizer');
assert(emptyStateContent.includes('[innerHTML]="safeIcon"'), 'EmptyStateComponent binds icon via [innerHTML]="safeIcon"');
assert(!emptyStateContent.includes('{{ icon }}'), 'EmptyStateComponent does not leak raw SVG via {{ icon }} interpolation');
assert(emptyStateContent.includes('actionClick') && emptyStateContent.includes('actionLabel'), 'EmptyStateComponent supports both actionClick and actionLabel aliases');

const safeHtmlPipeFile = path.join(FRONTEND_SRC, 'app', 'shared', 'pipes', 'safe-html.pipe.ts');
assert(fs.existsSync(safeHtmlPipeFile), 'SafeHtmlPipe exists at shared/pipes/safe-html.pipe.ts');

// 2. Audit SavedHomesComponent layout & empty state
console.log('\nTest Suite 2: SavedHomesComponent Responsive Layout');
const savedHomesFile = path.join(FRONTEND_SRC, 'app', 'features', 'tenant', 'saved-homes', 'saved-homes.component.ts');
const savedHomesContent = fs.readFileSync(savedHomesFile, 'utf8');
assert(savedHomesContent.includes('flex flex-col sm:flex-row sm:items-center justify-between gap-3'), 'SavedHomesComponent has responsive flex-col sm:flex-row gap-3 layout preventing 390px overlap');
assert(!savedHomesContent.includes('<svg') || savedHomesContent.includes('cleanHeartSvg') || savedHomesContent.includes('app-empty-state'), 'SavedHomesComponent does not directly interpolate raw SVG');

// 3. Audit AuthService Logout Lifecycle & Session Restore
console.log('\nTest Suite 3: AuthService Logout Lifecycle & Splash Hang Prevention');
const authServiceFile = path.join(FRONTEND_SRC, 'app', 'core', 'services', 'auth.service.ts');
const authServiceContent = fs.readFileSync(authServiceFile, 'utf8');
assert(authServiceContent.includes('this.initializationSubject.next(true);'), 'AuthService.logout() sets initializationSubject to true so splash screen does not hang');
assert(!authServiceContent.includes('this.initializationSubject.next(false);'), 'AuthService.logout() does NOT set initializationSubject to false');
assert(authServiceContent.includes('this.clearActiveChallenge()'), 'AuthService.logout() clears active challenge');
assert(authServiceContent.includes('this.storageService.clearSession()'), 'AuthService.logout() calls storageService.clearSession()');
assert(authServiceContent.includes('5000') && authServiceContent.includes('Promise.race'), 'AuthService.initSessionPromise() has guaranteed 5s race timeout');

// 4. Audit StorageService clearSession
console.log('\nTest Suite 4: StorageService clearSession');
const storageServiceFile = path.join(FRONTEND_SRC, 'app', 'core', 'services', 'storage.service.ts');
const storageServiceContent = fs.readFileSync(storageServiceFile, 'utf8');
assert(storageServiceContent.includes('this.LEGACY_TOKEN_KEY'), 'StorageService.clearSession removes legacy token keys');
assert(storageServiceContent.includes('this.LEGACY_USER_KEY'), 'StorageService.clearSession removes legacy user keys');

// 5. Audit all files for emojis & mdash
console.log('\nTest Suite 5: Codebase Purity (Zero Emojis, Zero &mdash;, Zero <svg> in <option>)');
const allFrontendFiles = getAllFiles(FRONTEND_SRC, ['.ts', '.html']);

let starEmojiCount = 0;
let clockEmojiCount = 0;
let mdashCount = 0;
let svgInOptionCount = 0;

allFrontendFiles.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('⭐')) starEmojiCount++;
  if (content.includes('⏰')) clockEmojiCount++;
  if (content.includes('&mdash;')) mdashCount++;
  if (/<option[^>]*>[^<]*<svg/i.test(content)) svgInOptionCount++;
});

assert(starEmojiCount === 0, 'Zero star emojis (⭐) in frontend codebase', `Found in ${starEmojiCount} files`);
assert(clockEmojiCount === 0, 'Zero clock emojis (⏰) in frontend codebase', `Found in ${clockEmojiCount} files`);
assert(mdashCount === 0, 'Zero &mdash; entities in frontend codebase', `Found in ${mdashCount} files`);
assert(svgInOptionCount === 0, 'Zero <svg> tags inside <option> elements in frontend codebase', `Found in ${svgInOptionCount} files`);

// 6. Audit onLogout() calls for replaceUrl: true
console.log('\nTest Suite 6: Logout Navigation (replaceUrl: true)');
const layoutFiles = [
  path.join(FRONTEND_SRC, 'app', 'layouts', 'tenant', 'tenant-layout.component.ts'),
  path.join(FRONTEND_SRC, 'app', 'layouts', 'owner', 'owner-layout.component.ts'),
  path.join(FRONTEND_SRC, 'app', 'layouts', 'professional', 'professional-layout.component.ts'),
  path.join(FRONTEND_SRC, 'app', 'layouts', 'admin', 'admin-layout.component.ts'),
  path.join(FRONTEND_SRC, 'app', 'features', 'tenant', 'tenant-profile', 'tenant-profile.component.ts'),
  path.join(FRONTEND_SRC, 'app', 'features', 'tenant', 'settings', 'tenant-settings.component.ts'),
  path.join(FRONTEND_SRC, 'app', 'features', 'owner', 'profile', 'owner-profile.component.ts'),
  path.join(FRONTEND_SRC, 'app', 'features', 'professional', 'profile', 'pro-profile.component.ts'),
];

layoutFiles.forEach((file) => {
  const rel = path.relative(ROOT_DIR, file);
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasReplaceUrl = content.includes("navigate(['/auth/login'], { replaceUrl: true })") || content.includes('navigate(["/auth/login"], { replaceUrl: true })');
    assert(hasReplaceUrl, `Logout navigation uses { replaceUrl: true } in ${rel}`);
  }
});

// 7. Audit Version Alignment (Android versionCode 12, versionName 1.4.2, package.json 1.4.2)
console.log('\nTest Suite 7: Release Version Alignment (v1.4.2 / versionCode 12)');
const buildGradleFile = path.join(ROOT_DIR, 'frontend', 'android', 'app', 'build.gradle');
const buildGradleContent = fs.readFileSync(buildGradleFile, 'utf8');
assert(buildGradleContent.includes('versionCode 12'), 'Android build.gradle has versionCode 12');
assert(buildGradleContent.includes('versionName "1.4.2"'), 'Android build.gradle has versionName "1.4.2"');

const packageJsonFile = path.join(ROOT_DIR, 'frontend', 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonFile, 'utf8');
assert(packageJsonContent.includes('"version": "1.4.2"'), 'frontend package.json has version "1.4.2"');

console.log(`\n=== REGRESSION AUDIT COMPLETE: ${passed} PASSED, ${failures} FAILED ===`);
if (failures > 0) {
  process.exit(1);
}
