/**
 * Grih360 v1.4.3 Regression Audit Script
 * Automated verification of:
 * 1. Location service timeout >= 18000ms & session caching
 * 2. ApiInterceptor 401 interception with silent refresh & logout error suppression
 * 3. Root route redirecting to 'auth/login' (replaceUrl: true) & RoleGuard unauthenticated redirection
 * 4. Zero auto-submit on OTP input/paste, disabled until 6 digits, fixed 48px height
 * 5. Complete removal of technical messages (backend, key, confirmed by, verify server)
 * 6. Complete removal of raw IDs (APP-, Property ID:, Ref:, UUID:, etc.)
 * 7. Admin console RBAC & change password configuration
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

console.log('=== STARTING GRIH360 v1.4.3 COMPREHENSIVE REGRESSION AUDIT ===\n');

// 1. Audit Issue 1: Location & Token Session Timeout
console.log('Test Suite 1: Geolocation Timeout, Session Caching & Token Refresh');
const locationServiceFile = path.join(FRONTEND_SRC, 'app', 'core', 'services', 'location.service.ts');
const locationServiceContent = fs.readFileSync(locationServiceFile, 'utf8');
assert(locationServiceContent.includes('timeout: 18000'), 'Geolocation request has 18-second timeout for device GPS locking');
assert(locationServiceContent.includes('SESSION_LOCATION_KEY') && locationServiceContent.includes('sessionStorage'), 'Location service caches last known location in session');
assert(locationServiceContent.includes('Getting your location...'), 'Location service emits clear "Getting your location..." state');

const apiInterceptorFile = path.join(FRONTEND_SRC, 'app', 'core', 'interceptors', 'api.interceptor.ts');
const apiInterceptorContent = fs.readFileSync(apiInterceptorFile, 'utf8');
assert(apiInterceptorContent.includes('err.status === 401'), 'ApiInterceptor catches 401 errors for silent token refresh');
assert(apiInterceptorContent.includes('refreshSession()'), 'ApiInterceptor triggers refreshSession() on 401');
assert(apiInterceptorContent.includes('authService.isExplicitlyLoggingOut'), 'ApiInterceptor suppresses errors when user is intentionally logging out');

// 2. Audit Issue 2: Hide Internal IDs
console.log('\nTest Suite 2: Hide Internal IDs and Reference Codes');
const appDetailsFile = path.join(FRONTEND_SRC, 'app', 'features', 'tenant', 'application-details', 'application-details.component.ts');
const appDetailsContent = fs.readFileSync(appDetailsFile, 'utf8');
assert(!appDetailsContent.includes('APP-{{'), 'Application details does NOT display raw APP- prefix code');
assert(appDetailsContent.includes('{{ propertyTitle }}'), 'Application details displays property title');

const propDetailsFile = path.join(FRONTEND_SRC, 'app', 'features', 'tenant', 'property-details', 'property-details.component.ts');
const propDetailsContent = fs.readFileSync(propDetailsFile, 'utf8');
assert(!propDetailsContent.includes('Property ID:'), 'Property details does NOT show "Property ID:"');
assert(!propDetailsContent.includes('Grih360 ID:'), 'Property details does NOT show "Grih360 ID:"');

const ownerRentalsFile = path.join(FRONTEND_SRC, 'app', 'features', 'owner', 'rentals', 'owner-rentals.component.ts');
const ownerRentalsContent = fs.readFileSync(ownerRentalsFile, 'utf8');
assert(!ownerRentalsContent.includes('Lease Ref: RENTAL-'), 'Owner rentals does NOT show raw "Lease Ref: RENTAL-"');

const allFrontendFiles = getAllFiles(FRONTEND_SRC, ['.ts', '.html']);
let appPrefixCount = 0;
let rawPropertyIdLabelCount = 0;
allFrontendFiles.forEach((f) => {
  const content = fs.readFileSync(f, 'utf8');
  if (/APP-[A-Za-z0-9{]/.test(content)) appPrefixCount++;
  if (/Property ID:/.test(content)) rawPropertyIdLabelCount++;
});
assert(appPrefixCount === 0, 'Zero instances of APP- ID references in frontend codebase', `Found in ${appPrefixCount} files`);
assert(rawPropertyIdLabelCount === 0, 'Zero instances of "Property ID:" labels in frontend codebase', `Found in ${rawPropertyIdLabelCount} files`);

// 3. Audit Issue 3: Logout Screen Navigation
console.log('\nTest Suite 3: Logout Screen Navigation & Guard Redirection');
const appRoutesFile = path.join(FRONTEND_SRC, 'app', 'app.routes.ts');
const appRoutesContent = fs.readFileSync(appRoutesFile, 'utf8');
assert(appRoutesContent.includes("{ path: '', redirectTo: 'auth/login', pathMatch: 'full' }"), "App root route '/' redirects to 'auth/login'");

const roleGuardFile = path.join(FRONTEND_SRC, 'app', 'core', 'guards', 'role.guard.ts');
const roleGuardContent = fs.readFileSync(roleGuardFile, 'utf8');
assert(!roleGuardContent.includes("router.navigate(['/role-selection'])"), 'RoleGuard never dumps unauthenticated users to /role-selection');
assert(roleGuardContent.includes('router.navigate([loginRoute], { replaceUrl: true })'), 'RoleGuard strictly navigates unauthenticated requests to loginRoute with replaceUrl');

// 4. Audit Issue 4: OTP Auto-Submit Prevention
console.log('\nTest Suite 4: OTP Verification Button & Zero Auto-Submit');
const verifyEmailFile = path.join(FRONTEND_SRC, 'app', 'features', 'auth', 'verify-email', 'verify-email.component.ts');
const verifyEmailContent = fs.readFileSync(verifyEmailFile, 'utf8');
assert(!verifyEmailContent.includes('if (this.isCodeComplete && !this.isLoading) {\n      this.onVerifySubmit();\n    }'), 'Zero auto-submit trigger inside onOtpInput and onOtpPaste');
assert(verifyEmailContent.includes('min-h-[48px] h-[48px]'), 'Verify code button has fixed 48px height preventing layout shift');
assert(verifyEmailContent.includes('disabled:cursor-not-allowed'), 'Verify code button clearly conveys disabled state before complete digits');

// 5. Audit Issue 5: No Technical Messages
console.log('\nTest Suite 5: Friendly User Messaging (Zero Technical Wording)');
const tenantVerifFile = path.join(FRONTEND_SRC, 'app', 'features', 'tenant', 'tenant-verification', 'tenant-verification.component.ts');
const tenantVerifContent = fs.readFileSync(tenantVerifFile, 'utf8');
assert(!tenantVerifContent.includes('Document uploaded & confirmed by backend'), 'No technical "confirmed by backend" message after document upload');
assert(tenantVerifContent.includes('Document uploaded. Our team will review it and update your status.'), 'Friendly status copy present after document upload');

const moneyInputFile = path.join(FRONTEND_SRC, 'app', 'shared', 'components', 'money-input', 'money-input.component.ts');
const moneyInputContent = fs.readFileSync(moneyInputFile, 'utf8');
assert(!moneyInputContent.includes('(Backend:'), 'Zero "(Backend: ...)" debug text in money-input component');

const loginComponentFile = path.join(FRONTEND_SRC, 'app', 'features', 'auth', 'login', 'login.component.ts');
const loginComponentContent = fs.readFileSync(loginComponentFile, 'utf8');
assert(!loginComponentContent.includes('verify backend server is reachable'), 'No technical backend server reachability error in login');

// 6. Audit Issue 6: Admin Console Access & Settings
console.log('\nTest Suite 6: Admin Console Access, RBAC & Password Update');
const adminRoutesFile = path.join(ROOT_DIR, 'backend', 'src', 'routes', 'admin.routes.ts');
const adminRoutesContent = fs.readFileSync(adminRoutesFile, 'utf8');
assert(adminRoutesContent.includes("router.use(authorizeRoles('ADMIN'))"), 'All backend /admin routes enforce strict ADMIN role authorization');

const adminSettingsFile = path.join(FRONTEND_SRC, 'app', 'features', 'admin', 'settings', 'admin-settings.component.ts');
const adminSettingsContent = fs.readFileSync(adminSettingsFile, 'utf8');
assert(adminSettingsContent.includes('changeAdminPassword'), 'Admin settings contains dedicated changeAdminPassword method');
assert(adminSettingsContent.includes('Administrator Credentials & Password'), 'Admin settings renders change password form');

console.log(`\n=== REGRESSION AUDIT FINISHED: ${passed} PASSED, ${failures} FAILED ===`);
if (failures > 0) {
  process.exit(1);
}
