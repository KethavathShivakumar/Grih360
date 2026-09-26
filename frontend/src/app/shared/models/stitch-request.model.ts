export type DesignStatus =
  | 'DESIGN_REFERENCE_AVAILABLE'
  | 'DESIGN_REQUIRED'
  | 'DESIGN_PENDING'
  | 'DESIGN_READY'
  | 'IMPLEMENTING'
  | 'API_PENDING'
  | 'TESTING'
  | 'COMPLETE';

export interface StitchDesignRequest {
  pageName: string;
  route: string;
  role: 'Tenant' | 'Owner' | 'Professional' | 'Admin' | 'Public';
  purpose: string;
  userEntersFrom: string;
  userCanNavigateTo: string[];
  existingStitchReferences: string[];
  requiredInformation: string[];
  requiredActions: string[];
  requiredComponents: string[];
  requiredStates: string[];
  responsiveRequirements: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  designRequirementNote: string;
  status: DesignStatus;
}
