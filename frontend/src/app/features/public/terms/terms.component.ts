import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#FAF9F5] text-slate-800 flex flex-col justify-between">
      <header class="bg-[#0F2937] text-white py-4 px-6 border-b border-slate-800">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-[#0F2937] border border-amber-400 text-amber-400 flex items-center justify-center font-semibold text-sm">
              G
            </div>
            <span class="font-bold text-lg text-white">Grih<span class="text-[#2D7A5E]">360</span></span>
          </a>
          <a routerLink="/login" class="text-xs font-bold text-slate-200 hover:text-white transition-colors">
            Back to Sign In
          </a>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        <div class="bg-white rounded-xl border border-[#E8E6DF] p-6 sm:p-10 shadow-xs">
          <div class="mb-8 border-b border-slate-100 pb-6">
            <span class="text-xs font-bold uppercase tracking-wider text-[#2D7A5E]">Legal and Compliance</span>
            <h1 class="text-2xl sm:text-3xl font-semibold text-[#0F2937] mt-1">Terms and Conditions</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-2">
              Effective Date: October 10, 2026. Last Updated: October 10, 2026.
            </p>
          </div>

          <div class="space-y-8 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">1. Agreement to Terms</h2>
              <p>
                By accessing or using the Grih360 website or mobile application, operated by Grih360 Technologies Private Limited
                ("Grih360", "we", "us", or "our"), you agree to be bound by these Terms and Conditions.
                If you do not agree to these terms, do not access or use the platform.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">2. Nature of Service and Role of Grih360</h2>
              <p>
                Grih360 is a technology platform connecting residential property owners, prospective tenants, and home service
                professionals. Grih360 facilitates direct communication, online rental applications, digital tenancy records,
                and rent collection tracking. Grih360 is not a real estate broker, property manager, landlord, or escrow agent.
                All rental agreements are executed directly between property owners and tenants.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">3. User Accounts and Authentication</h2>
              <p class="mb-2">
                Users must register using accurate contact information and complete email verification via one time password or through Continue with Google.
                Users are solely responsible for safeguarding their login credentials and device sessions.
              </p>
              <p class="mb-2">
                When authenticating via Continue with Google, you authorize Google LLC as an authentication processor to share your basic verified profile information (name, email address, and profile photo) with Grih360. Grih360 never receives or stores your Google account password.
              </p>
              <p>
                Tenants may submit government identity documents for verification badges. Submitting fraudulent, forged, or expired documents will result in immediate account suspension and potential notification to civil authorities.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">4. Property Listings and Content Integrity</h2>
              <p>
                Property owners warrant that all property details, rent amounts, security deposits, and photographs submitted
                accurately represent the premises and that they possess legal authority to lease the property. Grih360 reserves
                the right to remove inaccurate, deceptive, or discriminatory listings without prior notice.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">5. Fees and Payment Policy</h2>
              <p>
                Account creation, browsing listings, and connecting on Grih360 are free of charge. Grih360 does not levy brokerage fees.
                If optional premium features or paid convenience services are introduced in the future, all fees and applicable taxes will be
                explicitly displayed and authorized prior to payment.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">6. Rent Records and Payment Tracking</h2>
              <p>
                Rent payment tracking on Grih360 records transactions for accounting and documentation purposes.
                Digital receipts issued on the platform reflect ledger confirmations recorded by the respective parties.
                Grih360 is not liable for banking delays, UPI failures, or direct financial disputes between landlords and tenants.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">7. Home Services Marketplace</h2>
              <p>
                Home maintenance professionals on the platform operate as independent service providers.
                Grih360 facilitates booking requests, scope tracking, and review recording. Grih360 does not guarantee
                third party workmanship and is not liable for property damage incurred during independent maintenance visits.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">8. Limitation of Liability and Jurisdiction</h2>
              <p>
                To the fullest extent permitted by Indian law, Grih360 and Grih360 Technologies Private Limited shall not be liable for
                indirect, punitive, or consequential damages resulting from platform usage.
                These terms are governed by the laws of India. Any disputes arising hereunder shall be subject to the
                exclusive jurisdiction of the courts at Hyderabad, Telangana, India.
              </p>
            </section>

            <section>
              <h2 class="text-base font-bold text-[#0F2937] mb-2">9. Contact Information</h2>
              <p class="mb-2">For legal notices or questions regarding these Terms, contact:</p>
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs sm:text-sm">
                <p><strong>Entity Name:</strong> Grih360 Technologies Private Limited</p>
                <p><strong>Registered Address:</strong> Hyderabad, Telangana, India</p>
                <p><strong>Legal Inquiries:</strong> support@grih360.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer class="bg-white border-t border-[#E8E6DF] py-6 px-6 text-center text-xs text-slate-500">
        <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; 2026 Grih360. All rights reserved.</p>
          <div class="flex items-center gap-4 font-semibold">
            <a routerLink="/privacy" class="text-slate-600 hover:underline">Privacy Policy</a>
            <span class="text-slate-300">|</span>
            <a routerLink="/terms" class="text-[#2D7A5E] hover:underline">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class TermsComponent {}
