# Grih360 Custom Domain Switch Checklist

When you are ready to connect your purchased custom domain (e.g. `grih360.com`, `grih360.in`, etc.), follow this concise checklist. It takes approximately **5 minutes** to execute.

---

## 1. Vercel Custom Domain Configuration
1. Open the [Vercel Dashboard](https://vercel.com) and navigate to your **Grih360** project.
2. Go to **Settings** > **Domains**.
3. Enter your domain (e.g. `yourdomain.com`) and click **Add**.
4. Select the recommended option to add both `yourdomain.com` and redirect `www.yourdomain.com` to `yourdomain.com`.

---

## 2. DNS Records at Your Domain Registrar
Log in to your DNS provider (e.g. Cloudflare, GoDaddy, Namecheap) and create:

| Type | Name / Host | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (root) | `76.76.21.21` | Auto / 300 |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 300 |

*Wait 2–5 minutes until Vercel shows a green checkmark and automatically provisions the free Let's Encrypt SSL/TLS certificate.*

---

## 3. Environment Variables (Vercel & Backend)
In **Vercel Dashboard** > **Settings** > **Environment Variables** (and `backend/.env` if self-hosting):

1. Set `SITE_URL` to your live domain:
   ```env
   SITE_URL=https://yourdomain.com
   ```
2. Set `FRONTEND_URL` to match:
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

*Note: The backend CORS handler in `backend/src/app.ts` dynamically allows any origin matching `SITE_URL` or `FRONTEND_URL` automatically.*

---

## 4. Frontend Code Configuration
Update the following files before triggering the production build:

### A. `frontend/src/environments/environment.prod.ts`
```typescript
const isBrowser = typeof window !== 'undefined' &&
  window.location &&
  !window.location.protocol.startsWith('capacitor') &&
  window.location.hostname !== 'localhost';

export const environment = {
  production: true,
  siteUrl: 'https://yourdomain.com',
  apiUrl: isBrowser ? `${window.location.origin}/api/v1` : 'https://yourdomain.com/api/v1',
};
```

### B. `frontend/src/index.html`
Uncomment and set the canonical and social sharing tags in the `<head>` section:
```html
<link rel="canonical" href="https://yourdomain.com">
<meta property="og:url" content="https://yourdomain.com">
<meta property="og:image" content="https://yourdomain.com/icon-512.png">
<meta name="twitter:url" content="https://yourdomain.com">
<meta name="twitter:image" content="https://yourdomain.com/icon-512.png">
```

---

## 5. Google Maps API Key Referrers
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Select your Maps API key (`AIzaSyDSkelUvGii5waZT4Edk2n8wsAg7tlEI54`).
3. Under **Application restrictions** > **Websites**, add:
   - `https://yourdomain.com/*`
   - `https://www.yourdomain.com/*`
4. Retain existing entries:
   - `https://grih360.vercel.app/*`
   - `http://localhost:*`
   - `https://localhost/*`
   - `capacitor://localhost/*`
5. Click **Save**.

---

## 6. Email Sender Domain & Transactional Delivery
- **If continuing with Gmail SMTP (`grih360@gmail.com`)**: No changes required.
- **If switching to custom domain email (`support@yourdomain.com`)**:
  1. In Vercel Environment Variables, set:
     ```env
     EMAIL_FROM=Grih360 Support <support@yourdomain.com>
     ```
  2. Configure DNS authentication records at your registrar:
     - **SPF**: `v=spf1 include:... ~all`
     - **DKIM**: Add the `CNAME` or `TXT` record provided by your mail provider.
     - **DMARC**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`

---

## 7. Legal Page Entities & Build Gate
Before running the final production build, populate the 12 bracket placeholders in `frontend/src/app/features/public/privacy/privacy.component.ts` and `terms.component.ts`:
- `[COMPANY_LEGAL_NAME]`
- `[REGISTERED_ADDRESS]`
- `[GRIEVANCE_OFFICER_NAME]`
- `[GRIEVANCE_OFFICER_EMAIL]`
- `[CONTACT_EMAIL]`

Verify that zero bracket placeholders remain:
```bash
npm --prefix frontend run check:legal
```

---

## 8. Build Validation & Deployment
1. Run strict production validation:
   ```bash
   npm --prefix frontend run build:prod
   ```
2. Commit your updates:
   ```bash
   git add frontend/ backend/ DOMAIN_SWITCH.md
   git commit -m "chore: configure custom domain cutover"
   ```
3. Trigger deployment:
   - If using Vercel CLI: `vercel --prod`
   - Or push to GitHub when ready: `git push origin main`
4. Verify endpoints:
   - Web application: `https://yourdomain.com`
   - Health check: `https://yourdomain.com/api/v1/health`
