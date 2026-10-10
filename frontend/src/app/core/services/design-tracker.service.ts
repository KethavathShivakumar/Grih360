import { Injectable } from '@angular/core';
import { StitchDesignRequest, DesignStatus } from '../../shared/models/stitch-request.model';

export interface PageDesignMapping {
  feature: string;
  page: string;
  route: string;
  role: 'Tenant' | 'Owner' | 'Professional' | 'Admin' | 'Public';
  stitchDesign: string;
  angularImplementation: string;
  apiStatus: string;
  status: DesignStatus;
  request?: StitchDesignRequest;
}

@Injectable({
  providedIn: 'root',
})
export class DesignTrackerService {
  private pageRegistry: PageDesignMapping[] = [
    {
      feature: 'Authentication & Session',
      page: 'Login & Authentication Page',
      route: '/auth/login',
      role: 'Public',
      stitchDesign: 'projects/1596135526498527550/screens/6495c2e395bb4ae999d214cec77b5888 (Grih360 Login & Authentication — Classic Architectural Bento)',
      angularImplementation: 'IMPLEMENTED (Phase 1 Source of Truth)',
      apiStatus: 'READY (/api/v1/auth/login)',
      status: 'DESIGN_REFERENCE_AVAILABLE',
    },
    {
      feature: 'Public Portal',
      page: 'Welcome & Role Selection',
      route: '/role-selection',
      role: 'Public',
      stitchDesign: 'DESIGN_REQUIRED (Pending exact Stitch screen)',
      angularImplementation: 'STRUCTURAL_FOUNDATION',
      apiStatus: 'N/A',
      status: 'DESIGN_REQUIRED',
      request: {
        pageName: 'Welcome & Role Selection',
        route: '/role-selection',
        role: 'Public',
        purpose: 'Entry page allowing users to choose "I’m a Property Owner" or "I’m Looking for a Home"',
        userEntersFrom: 'Landing URL / Root path',
        userCanNavigateTo: ['/auth/login', '/tenant/find-homes', '/owner/dashboard'],
        existingStitchReferences: ['projects/1596135526498527550/screens/6495c2e395bb4ae999d214cec77b5888'],
        requiredInformation: ['Role choices: Property Owner vs Home Seeker', 'Platform trust highlights', 'Cadastral & Dharani compliance badges'],
        requiredActions: ['Select "I’m a Property Owner"', 'Select "I’m Looking for a Home"', 'Login link'],
        requiredComponents: ['Bento action cards', 'Trust badges', 'Header navigation'],
        requiredStates: ['Normal', 'Mobile Drawer'],
        responsiveRequirements: {
          desktop: '2-column side-by-side bento card selection',
          tablet: 'Reflowing 2-column cards',
          mobile: 'Single column stacked touch-friendly bento cards',
        },
        designRequirementNote: 'Create a Grih360-specific Role Selection page using the existing Deccan Civic Bento design system.',
        status: 'DESIGN_REQUIRED',
      },
    },
    {
      feature: 'Tenant Workspace',
      page: 'Tenant Dashboard',
      route: '/tenant/dashboard',
      role: 'Tenant',
      stitchDesign: 'DESIGN_REQUIRED',
      angularImplementation: 'STRUCTURAL_FOUNDATION',
      apiStatus: 'READY (/api/v1/rentals, /api/v1/applications)',
      status: 'DESIGN_REQUIRED',
      request: {
        pageName: 'Tenant Dashboard',
        route: '/tenant/dashboard',
        role: 'Tenant',
        purpose: 'Main workspace for tenants to manage current rental, upcoming rent, saved properties, applications, and service requests',
        userEntersFrom: 'Login / Navigation',
        userCanNavigateTo: ['/tenant/find-homes', '/tenant/applications', '/tenant/current-rental', '/tenant/services'],
        existingStitchReferences: ['projects/1596135526498527550/screens/6495c2e395bb4ae999d214cec77b5888'],
        requiredInformation: ['Current rental details', 'Upcoming rent status', 'Active applications', 'Service requests summary'],
        requiredActions: ['Pay Rent (Mock)', 'Request Home Service', 'Find Homes', 'View Agreement'],
        requiredComponents: ['Bento summary grid', 'Status badges', 'Quick action floating dock', 'Verification status node'],
        requiredStates: ['Normal', 'Loading', 'Empty (No active rental)', 'Action required'],
        responsiveRequirements: {
          desktop: '12-column bento dashboard layout',
          tablet: '8-column reflowing cards',
          mobile: 'Stacked stream with sticky bottom action dock',
        },
        designRequirementNote: 'Maintain Deccan Civic Bento visual system. Do not generate a generic SaaS page.',
        status: 'DESIGN_REQUIRED',
      },
    },
    {
      feature: 'Owner Workspace',
      page: 'Owner Dashboard',
      route: '/owner/dashboard',
      role: 'Owner',
      stitchDesign: 'DESIGN_REQUIRED',
      angularImplementation: 'STRUCTURAL_FOUNDATION',
      apiStatus: 'READY (/api/v1/properties, /api/v1/applications)',
      status: 'DESIGN_REQUIRED',
      request: {
        pageName: 'Owner Dashboard',
        route: '/owner/dashboard',
        role: 'Owner',
        purpose: 'Main workspace for property owners to manage properties, applicants, active rentals, and rent tracking',
        userEntersFrom: 'Owner Login',
        userCanNavigateTo: ['/owner/properties', '/owner/add-property', '/owner/applicants', '/owner/tenants'],
        existingStitchReferences: ['projects/1596135526498527550/screens/6495c2e395bb4ae999d214cec77b5888'],
        requiredInformation: ['Total properties count', 'Occupied vs vacant count', 'Pending tenant applications', 'Rent collection ledger'],
        requiredActions: ['Add Property', 'Review Applicant', 'Manage Rentals', 'View Documents'],
        requiredComponents: ['Bento metrics grid', 'Property status list', 'Verification badges', 'Rent ledger card'],
        requiredStates: ['Normal', 'Loading', 'Empty (No properties)', 'Error'],
        responsiveRequirements: {
          desktop: '12-column bento analytics & management grid',
          tablet: 'Reflowing 8-column layout',
          mobile: 'Stacked bento cards with sticky add property CTA',
        },
        designRequirementNote: 'Do not show tenant-specific functionality inside owner workspace.',
        status: 'DESIGN_REQUIRED',
      },
    },
  ];

  public getPageRegistry(): PageDesignMapping[] {
    return this.pageRegistry;
  }
}
