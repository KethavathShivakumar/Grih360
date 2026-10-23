import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface RouteSeoConfig {
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private defaultDescription = 'Grih360: Unified Property, Rental & Home Ecosystem for Tier-2 & Tier-3 India. Zero brokerage, verified properties, digital agreements, and automated rent tracking.';

  private routeDescriptions: Record<string, string> = {
    '/login': 'Sign in securely to your Grih360 workspace with 256-bit encryption and two-step verification.',
    '/register': 'Create a verified Grih360 account as a tenant, property owner, or service professional.',
    '/role-selection': 'Select your workspace persona on Grih360: Property Owner, Tenant, or Trade Professional.',
    '/auth/login': 'Sign in securely to your Grih360 workspace with 256-bit encryption and two-step verification.',
    '/auth/register': 'Create a verified Grih360 account as a tenant, property owner, or service professional.',
    '/auth/verify-email': 'Verify your email address with the one-time authentication code dispatched to your inbox.',
    '/admin/login': 'Administrative console access for authorized Grih360 platform operations personnel.',
    '/privacy': 'Grih360 Privacy Policy: Learn how your personal data, tenancy records, and documents are protected.',
    '/terms': 'Grih360 Terms of Service: Platform usage guidelines, lease record management, and user agreements.',
    '/tenant/dashboard': 'Manage active tenancies, rent receipts, saved listings, and service requests from your resident portal.',
    '/tenant/homes': 'Search verified direct rental listings with interactive Google Maps across Hyderabad and Telangana.',
    '/tenant/verification': 'Submit government identity documents for secure tenant verification badge review.',
    '/tenant/rent-tracking': 'Track monthly rent payments and download official receipts for HRA tax documentation.',
    '/tenant/documents': 'Access digital lease agreements, move-in checklists, and verified rent payment receipts.',
    '/tenant/services': 'Book verified electricians, plumbers, and technicians with transparent pricing.',
    '/owner/dashboard': 'Manage properties, review rental applicants, track collections, and create digital lease agreements.',
    '/owner/properties': 'View and manage all active property listings, vacancy status, and property images.',
    '/owner/properties/new': 'List a new residential property with address autocomplete, photo gallery, and lease terms.',
    '/professional/dashboard': 'Accept on-demand home maintenance requests, track service jobs, and manage availability.',
    '/admin/dashboard': 'Grih360 administrative operations console: user verification, listings audit, and system metrics.',
  };

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router
  ) {}

  public init(): void {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects.split('?')[0];
      const desc = this.routeDescriptions[url] || this.defaultDescription;
      this.metaService.updateTag({ name: 'description', content: desc });
      this.metaService.updateTag({ property: 'og:description', content: desc });
      this.metaService.updateTag({ name: 'twitter:description', content: desc });
    });
  }
}
