export type LocationAccuracy =
  | "exact_site"
  | "city_level"
  | "county_level"
  | "state_level"
  | "unknown";

export type ProjectStatus =
  | "rumored"
  | "planned"
  | "under_construction"
  | "operating"
  | "delayed";

export type ProjectType =
  | "data_center"
  | "ai_factory"
  | "colocation"
  | "power_site"
  | "gpu_cloud_region";

export type ContractStatus = "rumored" | "loi" | "announced" | "signed";

export type Project = {
  id: string;
  company: string;
  projectName: string;
  country: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy: LocationAccuracy;
  status: ProjectStatus;
  projectType: ProjectType;
  powerMwPlanned?: number;
  powerMwSecured?: number;
  gpuModel?: string;
  gpuCount?: number;
  customer?: string;
  contractValueUsd?: number;
  contractStatus?: ContractStatus;
  announcedDate?: string;
  expectedOnlineDate?: string;
  lastUpdated: string;
  confidenceScore: number;
  sourceUrl?: string;
  notes?: string;
};

export type ContractRecord = {
  id: string;
  supplier?: string;
  customer?: string;
  linkedProjectId?: string;
  contractValueUsd?: number;
  potentialValueUsd?: number;
  contractStatus?: ContractStatus;
  gpuModel?: string;
  announcedDate?: string;
  expectedOnlineDate?: string;
  sourceUrl?: string;
  confidenceScore?: number;
  sourceConfidence?: number;
  notes?: string;
};

export type ProjectFilters = {
  company: string;
  status: string;
  country: string;
  state: string;
  customer: string;
  gpuModel: string;
  contractStatus: string;
  locationAccuracy: string;
  minimumConfidence: number;
};

export type CompanyMetric = {
  company: string;
  projectCount: number;
  plannedMw: number;
  securedMw: number;
  gpuCount: number;
  contractValueUsd: number;
  averageConfidence: number;
};

export type KpiMetric = {
  totalProjects: number;
  operatingProjects: number;
  underConstructionProjects: number;
  totalPlannedMw: number;
  totalSecuredMw: number;
  disclosedGpuCount: number;
  disclosedContractValueUsd: number;
};
