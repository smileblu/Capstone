// 기업 활동 관련 타입 (추후 확장)

export type CompanyIndustry =
  | "MANUFACTURING"
  | "IT"
  | "DISTRIBUTION"
  | "CONSTRUCTION"
  | "SERVICE"
  | "FINANCE"
  | "OTHER";

export type CompanyEmployeeRange =
  | "lt10"
  | "10to50"
  | "50to100"
  | "100to300"
  | "gt300";

export type CompanyEmissionCategory =
  | "ELECTRICITY"
  | "FUEL"
  | "LOGISTICS"
  | "BUSINESS_TRIP"
  | "WASTE";

export type CompanyManagementPurpose =
  | "INTERNAL"
  | "CLIENT_SUBMISSION"
  | "ESG_COMPLIANCE";

export type CompanyOnboardingData = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  managerName?: string;
  department?: string;
  companyName?: string;
  businessNumber?: string;
  industry?: CompanyIndustry;
  employeeRange?: CompanyEmployeeRange;
  workplaceCount?: string;
  emissionCategories?: CompanyEmissionCategory[];
  managementPurpose?: CompanyManagementPurpose;
};
