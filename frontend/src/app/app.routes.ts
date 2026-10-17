import { Routes } from '@angular/router';
import { RoleSelectionComponent } from './features/public/role-selection/role-selection.component';
import { RegisterComponent } from './features/public/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { TenantLayoutComponent } from './layouts/tenant/tenant-layout.component';
import { OwnerLayoutComponent } from './layouts/owner/owner-layout.component';
import { ProfessionalLayoutComponent } from './layouts/professional/professional-layout.component';
import { AdminLayoutComponent } from './layouts/admin/admin-layout.component';
import { TenantWorkspaceComponent } from './features/tenant/tenant-workspace.component';
import { TenantDashboardComponent } from './features/tenant/tenant-dashboard';
import { FindHomesComponent } from './features/tenant/find-homes/find-homes.component';
import { PropertyDetailsComponent } from './features/tenant/property-details/property-details.component';
import { SavedHomesComponent } from './features/tenant/saved-homes/saved-homes.component';
import { TenantApplicationsComponent } from './features/tenant/tenant-applications/tenant-applications.component';
import { ApplicationDetailsComponent } from './features/tenant/application-details/application-details.component';
import { TenantProfileComponent } from './features/tenant/tenant-profile/tenant-profile.component';
import { TenantNotificationsComponent } from './features/tenant/tenant-notifications/tenant-notifications.component';
import { OwnerWorkspaceComponent } from './features/owner/owner-workspace.component';
import { OwnerDashboardComponent } from './features/owner/dashboard/owner-dashboard.component';
import { OwnerPropertiesComponent } from './features/owner/properties/owner-properties.component';
import { AddPropertyComponent } from './features/owner/add-property/add-property.component';
import { OwnerPropertyDetailsComponent } from './features/owner/property-details/owner-property-details.component';
import { EditPropertyComponent } from './features/owner/edit-property/edit-property.component';
import { OwnerApplicantsComponent } from './features/owner/applicants/owner-applicants.component';
import { ApplicantDetailsComponent } from './features/owner/applicant-details/applicant-details.component';
import { OwnerTenantDetailsComponent } from './features/owner/tenant-details/owner-tenant-details.component';
import { OwnerRentalDetailsComponent } from './features/owner/rental-details/owner-rental-details.component';
import { OwnerRentTrackingComponent } from './features/owner/rent-tracking/owner-rent-tracking.component';
import { OwnerProfileComponent } from './features/owner/profile/owner-profile.component';
import { OwnerNotificationsComponent } from './features/owner/notifications/owner-notifications.component';
import { OwnerPropertyImagesComponent } from './features/owner/property-images/owner-property-images.component';
import { OwnerRentalsComponent } from './features/owner/rentals/owner-rentals.component';
import { OwnerSettingsComponent } from './features/owner/settings/owner-settings.component';
import { ProfessionalWorkspaceComponent } from './features/professional/professional-workspace.component';

import { TenantVerificationComponent } from './features/tenant/tenant-verification/tenant-verification.component';
import { TenantVerificationDetailsComponent } from './features/tenant/verification-details/tenant-verification-details.component';
import { TenantCurrentRentalComponent } from './features/tenant/tenant-rental/tenant-current-rental.component';
import { TenantSearchResultsComponent } from './features/tenant/search-results/search-results.component';
import { TenantRentTrackingComponent } from './features/tenant/rent-tracking/tenant-rent-tracking.component';
import { TenantDocumentsComponent } from './features/tenant/documents/tenant-documents.component';
import { TenantHandoverChecklistComponent } from './features/tenant/handover/tenant-handover-checklist.component';
import { TenantPropertyConditionComponent } from './features/tenant/property-condition/tenant-property-condition.component';
import { TenantSettingsComponent } from './features/tenant/settings/tenant-settings.component';

// Phase 7 Home Services & Professional Network Imports
import { TenantServicesComponent } from './features/tenant/tenant-services/tenant-services.component';
import { ServiceCategoryDetailsComponent } from './features/tenant/tenant-services/category-details.component';
import { CreateServiceRequestComponent } from './features/tenant/tenant-services/create-request.component';
import { TenantServiceRequestsComponent } from './features/tenant/tenant-services/tenant-service-requests.component';
import { TenantServiceDetailsComponent } from './features/tenant/tenant-services/tenant-service-details.component';
import { ProDashboardComponent } from './features/professional/dashboard/pro-dashboard.component';
import { ProRequestsComponent } from './features/professional/requests/pro-requests.component';
import { ProRequestDetailsComponent } from './features/professional/requests/pro-request-details.component';
import { ProActiveJobComponent } from './features/professional/active-job/pro-active-job.component';
import { ProHistoryComponent } from './features/professional/history/pro-history.component';
import { ProServicesComponent } from './features/professional/services/pro-services.component';
import { ProAvailabilityComponent } from './features/professional/availability/pro-availability.component';
import { ProServiceAreaComponent } from './features/professional/service-area/pro-service-area.component';
import { ProReviewsComponent } from './features/professional/reviews/pro-reviews.component';
import { ProProfileComponent } from './features/professional/profile/pro-profile.component';
import { ProNotificationsComponent } from './features/professional/notifications/pro-notifications.component';

// Phase 8 Admin Console & Platform Operations Imports
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminUserDetailsComponent } from './features/admin/users/admin-user-details.component';
import { AdminPropertiesComponent } from './features/admin/properties/admin-properties.component';
import { AdminPropertyDetailsComponent } from './features/admin/properties/admin-property-details.component';
import { AdminApplicationsComponent } from './features/admin/applications/admin-applications.component';
import { AdminApplicationDetailsComponent } from './features/admin/applications/admin-application-details.component';
import { AdminRentalsComponent } from './features/admin/rentals/admin-rentals.component';
import { AdminRentalDetailsComponent } from './features/admin/rentals/admin-rental-details.component';
import { AdminVerificationsComponent } from './features/admin/admin-verifications/admin-verifications.component';
import { AdminVerificationDetailsComponent } from './features/admin/admin-verifications/admin-verification-details.component';
import { AdminServicesComponent } from './features/admin/admin-services/admin-services.component';
import { AdminServiceRequestDetailsComponent } from './features/admin/admin-services/admin-service-request-details.component';
import { AdminProfessionalsComponent } from './features/admin/admin-professionals/admin-professionals.component';
import { AdminProfessionalDetailsComponent } from './features/admin/admin-professionals/admin-professional-details.component';
import { AdminNotificationsComponent } from './features/admin/notifications/admin-notifications.component';
import { AdminAuditComponent } from './features/admin/audit/admin-audit.component';
import { AdminSystemComponent } from './features/admin/system/admin-system.component';
import { AdminSettingsComponent } from './features/admin/settings/admin-settings.component';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

import { AdminLoginComponent } from './features/admin/auth/admin-login.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';
import { PrivacyComponent } from './features/public/privacy/privacy.component';
import { TermsComponent } from './features/public/terms/terms.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'role-selection', component: RoleSelectionComponent, canActivate: [guestGuard], title: 'Select Workspace Persona | Grih360' },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: 'verify-email', redirectTo: 'auth/verify-email', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent, canActivate: [guestGuard], title: 'Sign In | Grih360' },
  { path: 'auth/register', component: RegisterComponent, canActivate: [guestGuard], title: 'Create Account | Grih360' },
  { path: 'auth/verify-email', component: VerifyEmailComponent, canActivate: [guestGuard], title: 'Verify Email OTP | Grih360' },
  { path: 'admin/login', component: AdminLoginComponent, canActivate: [guestGuard], title: 'Admin Console Sign In | Grih360' },
  { path: 'privacy', component: PrivacyComponent, title: 'Privacy Policy | Grih360' },
  { path: 'terms', component: TermsComponent, title: 'Terms of Service | Grih360' },

  // Tenant Workspace Routes
  {
    path: 'tenant',
    component: TenantLayoutComponent,
    canActivate: [authGuard, roleGuard(['TENANT', 'ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TenantDashboardComponent, title: 'Tenant Dashboard | Grih360' },
      { path: 'homes', component: FindHomesComponent, title: 'Find Verified Rental Homes | Grih360' },
      { path: 'homes/search', component: TenantSearchResultsComponent, title: 'Search Homes | Grih360' },
      { path: 'homes/:id', component: PropertyDetailsComponent, title: 'Property Details | Grih360' },
      { path: 'search', component: TenantSearchResultsComponent, title: 'Search Homes | Grih360' },
      { path: 'properties/:id', component: PropertyDetailsComponent, title: 'Property Details | Grih360' },
      { path: 'saved', component: SavedHomesComponent, title: 'Saved Homes | Grih360' },
      { path: 'applications', component: TenantApplicationsComponent, title: 'My Applications | Grih360' },
      { path: 'applications/:id', component: ApplicationDetailsComponent, title: 'Application Details | Grih360' },
      { path: 'applications/:id/verification', component: TenantVerificationComponent, title: 'Tenant Verification | Grih360' },
      { path: 'verification', component: TenantVerificationComponent, title: 'Tenant Verification | Grih360' },
      { path: 'verification/:id', component: TenantVerificationDetailsComponent, title: 'Verification Details | Grih360' },
      { path: 'rental', component: TenantCurrentRentalComponent, title: 'Active Tenancy | Grih360' },
      { path: 'rentals', component: TenantCurrentRentalComponent, title: 'Active Tenancy | Grih360' },
      { path: 'agreement', component: TenantCurrentRentalComponent, title: 'Lease Agreement | Grih360' },
      { path: 'agreements', component: TenantCurrentRentalComponent, title: 'Lease Agreement | Grih360' },
      { path: 'agreements/:id', component: TenantCurrentRentalComponent, title: 'Lease Agreement | Grih360' },
      { path: 'rent', component: TenantRentTrackingComponent, title: 'Rent Payment Tracking | Grih360' },
      { path: 'rent-tracking', component: TenantRentTrackingComponent, title: 'Rent Payment Tracking | Grih360' },
      { path: 'documents', component: TenantDocumentsComponent, title: 'Tenancy Documents & Receipts | Grih360' },
      { path: 'handover', component: TenantHandoverChecklistComponent, title: 'Move-In Handover Checklist | Grih360' },
      { path: 'checklist', component: TenantHandoverChecklistComponent, title: 'Move-In Handover Checklist | Grih360' },
      { path: 'condition', component: TenantPropertyConditionComponent, title: 'Property Condition Assessment | Grih360' },
      { path: 'property-condition', component: TenantPropertyConditionComponent, title: 'Property Condition Assessment | Grih360' },

      // Phase 7 Tenant Service Routes
      { path: 'services', component: TenantServicesComponent, title: 'Home Services Marketplace | Grih360' },
      { path: 'services/categories', component: TenantServicesComponent, title: 'Service Categories | Grih360' },
      { path: 'services/request', component: CreateServiceRequestComponent, title: 'Request Home Service | Grih360' },
      { path: 'services/requests', component: TenantServiceRequestsComponent, title: 'My Service Requests | Grih360' },
      { path: 'services/requests/:id', component: TenantServiceDetailsComponent, title: 'Service Request Details | Grih360' },
      { path: 'services/history', component: TenantServiceRequestsComponent, title: 'Service History | Grih360' },
      { path: 'services/:category', component: ServiceCategoryDetailsComponent, title: 'Category Services | Grih360' },

      { path: 'profile', component: TenantProfileComponent, title: 'Tenant Profile | Grih360' },
      { path: 'notifications', component: TenantNotificationsComponent, title: 'Notifications | Grih360' },
      { path: 'settings', component: TenantSettingsComponent, title: 'Account Settings | Grih360' },
    ],
  },

  // Owner Workspace Routes
  {
    path: 'owner',
    component: OwnerLayoutComponent,
    canActivate: [authGuard, roleGuard(['OWNER', 'ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: OwnerDashboardComponent, title: 'Property Owner Dashboard | Grih360' },
      { path: 'properties', component: OwnerPropertiesComponent, title: 'My Properties | Grih360' },
      { path: 'properties/new', component: AddPropertyComponent, title: 'List New Property | Grih360' },
      { path: 'properties/:id', component: OwnerPropertyDetailsComponent, title: 'Property Details | Grih360' },
      { path: 'properties/:id/edit', component: EditPropertyComponent, title: 'Edit Property Listing | Grih360' },
      { path: 'properties/:id/images', component: OwnerPropertyImagesComponent, title: 'Property Photos | Grih360' },
      { path: 'properties/:id/applicants', component: OwnerApplicantsComponent, title: 'Property Applicants | Grih360' },
      { path: 'properties/:id/applicants/:applicationId', component: ApplicantDetailsComponent, title: 'Applicant Dossier | Grih360' },
      { path: 'properties/:id/tenant', component: OwnerTenantDetailsComponent, title: 'Tenant Details | Grih360' },
      { path: 'properties/:id/rental', component: OwnerRentalDetailsComponent, title: 'Tenancy Details | Grih360' },
      { path: 'properties/:id/rent', component: OwnerRentTrackingComponent, title: 'Rent Collections | Grih360' },
      { path: 'rentals', component: OwnerRentalsComponent, title: 'Active Rentals | Grih360' },
      { path: 'rentals/:id', component: OwnerRentalDetailsComponent, title: 'Rental Agreement Details | Grih360' },
      { path: 'rent-tracking', component: OwnerRentTrackingComponent, title: 'Rent Collections Tracker | Grih360' },
      { path: 'applications', component: OwnerApplicantsComponent, title: 'Rental Applications | Grih360' },
      { path: 'applications/:id', component: ApplicantDetailsComponent, title: 'Applicant Dossier | Grih360' },
      { path: 'applicants', component: OwnerApplicantsComponent, title: 'Rental Applications | Grih360' },
      { path: 'applicants/:id', component: ApplicantDetailsComponent, title: 'Applicant Dossier | Grih360' },
      { path: 'tenants/:id', component: OwnerTenantDetailsComponent, title: 'Tenant Details | Grih360' },
      { path: 'profile', component: OwnerProfileComponent, title: 'Owner Profile | Grih360' },
      { path: 'settings', component: OwnerSettingsComponent, title: 'Owner Settings | Grih360' },
      { path: 'notifications', component: OwnerNotificationsComponent, title: 'Owner Notifications | Grih360' },
    ],
  },

  // Professional Workspace Routes
  {
    path: 'professional',
    component: ProfessionalLayoutComponent,
    canActivate: [authGuard, roleGuard(['PROFESSIONAL', 'ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ProDashboardComponent, title: 'Trade Professional Dashboard | Grih360' },
      { path: 'requests', component: ProRequestsComponent, title: 'Incoming Service Requests | Grih360' },
      { path: 'requests/:id', component: ProRequestDetailsComponent, title: 'Service Job Details | Grih360' },
      { path: 'active-job', component: ProActiveJobComponent, title: 'Active Job Workspace | Grih360' },
      { path: 'active', component: ProActiveJobComponent, title: 'Active Job Workspace | Grih360' },
      { path: 'history', component: ProHistoryComponent, title: 'Job History & Earnings | Grih360' },
      { path: 'services', component: ProServicesComponent, title: 'My Trade Services | Grih360' },
      { path: 'availability', component: ProAvailabilityComponent, title: 'Availability Schedule | Grih360' },
      { path: 'service-area', component: ProServiceAreaComponent, title: 'Operational Service Area | Grih360' },
      { path: 'reviews', component: ProReviewsComponent, title: 'Resident Reviews & Ratings | Grih360' },
      { path: 'profile', component: ProProfileComponent, title: 'Professional Profile | Grih360' },
      { path: 'notifications', component: ProNotificationsComponent, title: 'Pro Notifications | Grih360' },
    ],
  },

  // Phase 8+12 Admin Workspace Routes (fully wired detail components)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent, title: 'Admin Operations Dashboard | Grih360' },

      { path: 'users', component: AdminUsersComponent, title: 'User Management | Grih360 Admin' },
      { path: 'users/:id', component: AdminUserDetailsComponent, title: 'User Account Details | Grih360 Admin' },

      { path: 'properties', component: AdminPropertiesComponent, title: 'Property Listings Audit | Grih360 Admin' },
      { path: 'properties/:id', component: AdminPropertyDetailsComponent, title: 'Property Audit Details | Grih360 Admin' },

      { path: 'applications', component: AdminApplicationsComponent, title: 'Application Operations | Grih360 Admin' },
      { path: 'applications/:id', component: AdminApplicationDetailsComponent, title: 'Application Audit | Grih360 Admin' },

      { path: 'rentals', component: AdminRentalsComponent, title: 'Platform Tenancies | Grih360 Admin' },
      { path: 'rentals/:id', component: AdminRentalDetailsComponent, title: 'Tenancy Audit | Grih360 Admin' },

      { path: 'verification', component: AdminVerificationsComponent, title: 'Verification Compliance | Grih360 Admin' },
      { path: 'verifications', component: AdminVerificationsComponent, title: 'Verification Compliance | Grih360 Admin' },
      { path: 'verifications/:id', component: AdminVerificationDetailsComponent, title: 'Verification Review | Grih360 Admin' },

      { path: 'services', component: AdminServicesComponent, title: 'Home Services Dispatch | Grih360 Admin' },
      { path: 'services/requests', component: AdminServicesComponent, title: 'Service Requests | Grih360 Admin' },
      { path: 'services/requests/:id', component: AdminServiceRequestDetailsComponent, title: 'Service Dispatch Details | Grih360 Admin' },

      { path: 'professionals', component: AdminProfessionalsComponent, title: 'Trade Professionals Directory | Grih360 Admin' },
      { path: 'professionals/:id', component: AdminProfessionalDetailsComponent, title: 'Trade Pro Verification | Grih360 Admin' },

      { path: 'notifications', component: AdminNotificationsComponent, title: 'System Notifications | Grih360 Admin' },
      { path: 'audit', component: AdminAuditComponent, title: 'Platform Security Audit Log | Grih360 Admin' },
      { path: 'system', component: AdminSystemComponent, title: 'System Health & Metrics | Grih360 Admin' },
      { path: 'settings', component: AdminSettingsComponent, title: 'Platform Configuration | Grih360 Admin' },
    ],
  },

  { path: '**', redirectTo: 'role-selection' },
];
