import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] text-slate-800 flex flex-col justify-between">
      <header class="bg-[#0F2937] text-white py-4 px-6 border-b border-slate-800">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-[#0F2937] border border-amber-400 text-amber-400 flex items-center justify-center font-black text-sm">
              G
            </div>
            <span class="font-bold text-lg text-white">Grih<span class="text-[#2D7A5E]">360</span></span>
          </a>
          <a routerLink="/auth/login" class="text-xs font-bold text-slate-200 hover:text-white transition-colors">
            Back to Login
          </a>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        <div class="bg-white rounded-3xl border border-[#E8E6DF] p-6 sm:p-10 shadow-xs">
          <div class="mb-8 border-b border-slate-100 pb-6">
            <span class="text-xs font-bold uppercase tracking-wider text-[#2D7A5E]">Legal and Compliance</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#0F2937] mt-1">Privacy Policy</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-2">
              Effective Date: October 10, 2026. Last Updated: October 10, 2026.
            </p>
          </div>

          <div class="space-y-8 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">1. Introduction and Scope</h2>
              <p>
                This Privacy Policy describes how [COMPANY_LEGAL_NAME] ("Grih360", "we", "us", or "our") collects,
                uses, stores, and protects personal data obtained through the Grih360 web platform and mobile application.
                This policy outlines our transparent data handling principles and privacy practices.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">2. Data We Collect</h2>
              <p class="mb-2">We collect only personal data necessary to provide our property and rental facilitation services:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li><strong>Account Information:</strong> Name, email address, phone number, and user role (Tenant, Owner, Professional).</li>
                <li><strong>Authentication Data:</strong> One-time password (OTP) delivery logs and session tokens.</li>
                <li><strong>Identity Documents:</strong> Government-issued identity documents (Aadhaar card masked reference, Voter ID, Driving License, PAN, or Passport) submitted by tenants for profile verification. We do not collect salary slips, tax returns, or bank account statements.</li>
                <li><strong>Property and Tenancy Records:</strong> Property listings, rental agreements, move-in checklists, and rent payment tracking receipts.</li>
                <li><strong>Service Requests:</strong> Maintenance and repair requests, location coordinates, and category details.</li>
                <li><strong>Geographic Location:</strong> Device location and search coordinates when permitted for map-based property search.</li>
              </ul>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">3. How We Use Personal Data</h2>
              <ul class="list-disc pl-5 space-y-1">
                <li>To authenticate accounts and verify email addresses via secure OTP codes.</li>
                <li>To enable tenants and property owners to view listings, submit rental applications, and record rental payments.</li>
                <li>To conduct internal verification of submitted identity documents for safety and fraud prevention.</li>
                <li>To dispatch verified home service professionals based on submitted maintenance tickets.</li>
              </ul>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">4. Strict Access Controls on Identity Documents</h2>
              <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-[#0F2937]">
                <p class="font-bold mb-1">Strict Tenant Privacy Guarantee:</p>
                <p class="text-xs sm:text-sm text-slate-700">
                  Government identity documents and raw ID numbers submitted during the tenant verification process are
                  accessible solely by authorized Grih360 compliance personnel for verification review.
                  <strong>Property owners never receive or view raw tenant identity documents or ID numbers.</strong>
                  Owners only receive a verification status confirmation badge (Verified or Pending).
                </p>
              </div>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">5. Third-Party Service Providers (Processors)</h2>
              <p class="mb-2">We do not sell personal data. We engage vetted service providers under confidentiality agreements:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li><strong>Hosting Infrastructure:</strong> Vercel Inc. (web application hosting and serverless compute).</li>
                <li><strong>Database Infrastructure:</strong> MongoDB Atlas (cloud database servers).</li>
                <li><strong>Email Delivery:</strong> Google Workspace / Gmail SMTP for transactional email and login verification OTP codes.</li>
                <li><strong>Geographic Mapping:</strong> Google Maps Platform for displaying map coordinates and location autocomplete.</li>
              </ul>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">6. Platform Fees</h2>
              <p>
                Browsing property listings, searching for rentals, and registering an account on Grih360 are free of charge.
                If optional paid services or premium features are introduced, all fees will be clearly presented and confirmed prior to charging.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">7. Data Retention and Deletion</h2>
              <p>
                Personal data is retained only for the duration of your active account or as required to maintain tenancy records
                under applicable Indian tax and property regulations. You may request account deletion and data erasure at any time
                by contacting our Grievance Officer. Upon confirmed deletion, personal data is purged from active databases within 30 days.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">8. Your Privacy Rights and Account Controls</h2>
              <p class="mb-2">As a registered user of Grih360, you have the following rights and account controls:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li>Right to access summaries of personal data processed by Grih360.</li>
                <li>Right to correction, completion, and updating of inaccurate data.</li>
                <li>Right to erasure of personal data that is no longer necessary for the stated purpose.</li>
                <li>Right to grievance redressal through our designated Grievance Officer.</li>
              </ul>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">9. Grievance Officer and Contact Details</h2>
              <p class="mb-2">For inquiries, data requests, or complaints regarding this Privacy Policy, please contact:</p>
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs sm:text-sm">
                <p><strong>Grievance Officer:</strong> [GRIEVANCE_OFFICER_NAME]</p>
                <p><strong>Entity Name:</strong> [COMPANY_LEGAL_NAME]</p>
                <p><strong>Registered Address:</strong> [REGISTERED_ADDRESS]</p>
                <p><strong>Contact Email:</strong> [GRIEVANCE_OFFICER_EMAIL]</p>
                <p><strong>General Support:</strong> [CONTACT_EMAIL]</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer class="bg-white border-t border-[#E8E6DF] py-6 px-6 text-center text-xs text-slate-500">
        <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; 2026 Grih360. All rights reserved.</p>
          <div class="flex items-center gap-4 font-semibold">
            <a routerLink="/privacy" class="text-[#2D7A5E] hover:underline">Privacy Policy</a>
            <span class="text-slate-300">|</span>
            <a routerLink="/terms" class="text-slate-600 hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class PrivacyComponent {}
