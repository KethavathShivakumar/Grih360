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

import { AdminLoginComponent } from './features/admin/auth/admin-login.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';

export const routes: Routes = [
  { path: '', redirectTo: 'role-selection', pathMatch: 'full' },
  { path: 'role-selection', component: RoleSelectionComponent },
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: 'verify-email', redirectTo: 'auth/verify-email', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/verify-email', component: VerifyEmailComponent },
  { path: 'admin/login', component: AdminLoginComponent },

  // Tenant Workspace Routes
  {
    path: 'tenant',
    component: TenantLayoutComponent,
    canActivate: [authGuard, roleGuard(['TENANT', 'ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TenantDashboardComponent },
      { path: 'homes', component: FindHomesComponent },
      { path: 'homes/search', component: TenantSearchResultsComponent },
      { path: 'homes/:id', component: PropertyDetailsComponent },
      { path: 'search', component: TenantSearchResultsComponent },
      { path: 'properties/:id', component: PropertyDetailsComponent },
      { path: 'saved', component: SavedHomesComponent },
      { path: 'applications', component: TenantApplicationsComponent },
      { path: 'applications/:id', component: ApplicationDetailsComponent },
      { path: 'applications/:id/verification', component: TenantVerificationComponent },
      { path: 'verification', component: TenantVerificationComponent },
      { path: 'verification/:id', component: TenantVerificationDetailsComponent },
      { path: 'rental', component: TenantCurrentRentalComponent },
      { path: 'rentals', component: TenantCurrentRentalComponent },
      { path: 'agreement', component: TenantCurrentRentalComponent },
      { path: 'agreements', component: TenantCurrentRentalComponent },
      { path: 'agreements/:id', component: TenantCurrentRentalComponent },
      { path: 'rent', component: TenantRentTrackingComponent },
      { path: 'rent-tracking', component: TenantRentTrackingComponent },
      { path: 'documents', component: TenantDocumentsComponent },
      { path: 'handover', component: TenantHandoverChecklistComponent },
      { path: 'checklist', component: TenantHandoverChecklistComponent },
      { path: 'condition', component: TenantPropertyConditionComponent },
      { path: 'property-condition', component: TenantPropertyConditionComponent },

      // Phase 7 Tenant Service Routes
      { path: 'services', component: TenantServicesComponent },
      { path: 'services/categories', component: TenantServicesComponent },
      { path: 'services/request', component: CreateServiceRequestComponent },
      { path: 'services/requests', component: TenantServiceRequestsComponent },
      { path: 'services/requests/:id', component: TenantServiceDetailsComponent },
      { path: 'services/history', component: TenantServiceRequestsComponent },
      { path: 'services/:category', component: ServiceCategoryDetailsComponent },

      { path: 'profile', component: TenantProfileComponent },
      { path: 'notifications', component: TenantNotificationsComponent },
      { path: 'settings', component: TenantSettingsComponent },
    ],
  },

  // Owner Workspace Routes
  {
    path: 'owner',
    component: OwnerLayoutComponent,
    canActivate: [authGuard, roleGuard(['OWNER', 'ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: OwnerDashboardComponent },
      { path: 'properties', component: OwnerPropertiesComponent },
      { path: 'properties/new', component: AddPropertyComponent },
      { path: 'properties/:id', component: OwnerPropertyDetailsComponent },
      { path: 'properties/:id/edit', component: EditPropertyComponent },
      { path: 'properties/:id/images', component: OwnerPropertyImagesComponent },
      { path: 'properties/:id/applicants', component: OwnerApplicantsComponent },
      { path: 'properties/:id/applicants/:applicationId', component: ApplicantDetailsComponent },
      { path: 'properties/:id/tenant', component: OwnerTenantDetailsComponent },
      { path: 'properties/:id/rental', component: OwnerRentalDetailsComponent },
      { path: 'properties/:id/rent', component: OwnerRentTrackingComponent },
      { path: 'rentals', component: OwnerRentalsComponent },
      { path: 'rentals/:id', component: OwnerRentalDetailsComponent },
      { path: 'rent-tracking', component: OwnerRentTrackingComponent },
      { path: 'applications', component: OwnerApplicantsComponent },
      { path: 'applications/:id', component: ApplicantDetailsComponent },
      { path: 'applicants', component: OwnerApplicantsComponent },
      { path: 'applicants/:id', component: ApplicantDetailsComponent },
      { path: 'tenants/:id', component: OwnerTenantDetailsComponent },
      { path: 'profile', component: OwnerProfileComponent },
      { path: 'settings', component: OwnerSettingsComponent },
      { path: 'notifications', component: OwnerNotificationsComponent },
    ],
  },

  // Professional Workspace Routes
  {
    path: 'professional',
    component: ProfessionalLayoutComponent,
    canActivate: [authGuard, roleGuard(['PROFESSIONAL', 'ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ProDashboardComponent },
      { path: 'requests', component: ProRequestsComponent },
      { path: 'requests/:id', component: ProRequestDetailsComponent },
      { path: 'active-job', component: ProActiveJobComponent },
      { path: 'active', component: ProActiveJobComponent },
      { path: 'history', component: ProHistoryComponent },
      { path: 'services', component: ProServicesComponent },
      { path: 'availability', component: ProAvailabilityComponent },
      { path: 'service-area', component: ProServiceAreaComponent },
      { path: 'reviews', component: ProReviewsComponent },
      { path: 'profile', component: ProProfileComponent },
      { path: 'notifications', component: ProNotificationsComponent },
    ],
  },

  // Phase 8+12 Admin Workspace Routes (fully wired detail components)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },

      { path: 'users', component: AdminUsersComponent },
      { path: 'users/:id', component: AdminUserDetailsComponent },

      { path: 'properties', component: AdminPropertiesComponent },
      { path: 'properties/:id', component: AdminPropertyDetailsComponent },

      { path: 'applications', component: AdminApplicationsComponent },
      { path: 'applications/:id', component: AdminApplicationDetailsComponent },

      { path: 'rentals', component: AdminRentalsComponent },
      { path: 'rentals/:id', component: AdminRentalDetailsComponent },

      { path: 'verification', component: AdminVerificationsComponent },
      { path: 'verifications', component: AdminVerificationsComponent },
      { path: 'verifications/:id', component: AdminVerificationDetailsComponent },

      { path: 'services', component: AdminServicesComponent },
      { path: 'services/requests', component: AdminServicesComponent },
      { path: 'services/requests/:id', component: AdminServiceRequestDetailsComponent },

      { path: 'professionals', component: AdminProfessionalsComponent },
      { path: 'professionals/:id', component: AdminProfessionalDetailsComponent },

      { path: 'notifications', component: AdminNotificationsComponent },
      { path: 'audit', component: AdminAuditComponent },
      { path: 'system', component: AdminSystemComponent },
      { path: 'settings', component: AdminSettingsComponent },
    ],
  },

  { path: '**', redirectTo: 'role-selection' },
];
