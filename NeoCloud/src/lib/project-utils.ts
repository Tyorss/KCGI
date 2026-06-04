import type {
  CompanyMetric,
  ContractStatus,
  KpiMetric,
  LocationAccuracy,
  Project,
  ProjectFilters,
  ProjectStatus,
  ProjectType
} from "@/types/project";

export const ALL_VALUE = "all";

export const defaultFilters: ProjectFilters = {
  company: ALL_VALUE,
  status: ALL_VALUE,
  country: ALL_VALUE,
  state: ALL_VALUE,
  customer: ALL_VALUE,
  gpuModel: ALL_VALUE,
  contractStatus: ALL_VALUE,
  locationAccuracy: ALL_VALUE,
  minimumConfidence: 0
};

export const statusLabels: Record<ProjectStatus, string> = {
  rumored: "루머 / Rumored",
  planned: "계획 / Planned",
  under_construction: "건설 중 / Under Construction",
  operating: "가동 중 / Operating",
  delayed: "지연 / Delayed"
};

export const statusColors: Record<ProjectStatus, string> = {
  rumored: "#8b95a5",
  planned: "#b8872f",
  under_construction: "#c8664b",
  operating: "#28776f",
  delayed: "#67558a"
};

export const projectTypeLabels: Record<ProjectType, string> = {
  data_center: "데이터센터 / Data Center",
  ai_factory: "AI 팩토리 / AI Factory",
  colocation: "Colocation",
  power_site: "전력 부지 / Power Site",
  gpu_cloud_region: "GPU 클라우드 리전 / GPU Cloud Region"
};

export const locationAccuracyLabels: Record<LocationAccuracy, string> = {
  exact_site: "정확한 부지 / Exact Site",
  city_level: "도시 단위 / City Level",
  county_level: "카운티 단위 / County Level",
  state_level: "주 단위 / State Level",
  unknown: "좌표 확인 필요 / Unknown"
};

export const contractStatusLabels: Record<ContractStatus, string> = {
  rumored: "루머 / Rumored",
  loi: "LOI",
  announced: "발표 / Announced",
  signed: "계약 체결 / Signed"
};

export function filterProjects(projects: Project[], filters: ProjectFilters) {
  return projects.filter((project) => {
    if (filters.company !== ALL_VALUE && project.company !== filters.company) return false;
    if (filters.status !== ALL_VALUE && project.status !== filters.status) return false;
    if (filters.country !== ALL_VALUE && project.country !== filters.country) return false;
    if (filters.state !== ALL_VALUE && (project.state || "") !== filters.state) return false;
    if (filters.customer !== ALL_VALUE && (project.customer || "") !== filters.customer) return false;
    if (filters.gpuModel !== ALL_VALUE && (project.gpuModel || "") !== filters.gpuModel) return false;
    if (filters.contractStatus !== ALL_VALUE && (project.contractStatus || "") !== filters.contractStatus) return false;
    if (filters.locationAccuracy !== ALL_VALUE && project.locationAccuracy !== filters.locationAccuracy) return false;
    return project.confidenceScore >= filters.minimumConfidence;
  });
}

export function uniqueOptions(projects: Project[], accessor: (project: Project) => string | undefined) {
  return [...new Set(projects.map(accessor).filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function hasCoordinates(project: Project): project is Project & { latitude: number; longitude: number } {
  return Number.isFinite(project.latitude) && Number.isFinite(project.longitude);
}

export function projectsWithCoordinates(projects: Project[]) {
  return projects.filter(hasCoordinates);
}

export function projectsWithoutCoordinates(projects: Project[]) {
  return projects.filter((project) => !hasCoordinates(project));
}

export function aggregateKpis(projects: Project[]): KpiMetric {
  return projects.reduce<KpiMetric>(
    (metrics, project) => {
      metrics.totalProjects += 1;
      if (project.status === "operating") metrics.operatingProjects += 1;
      if (project.status === "under_construction") metrics.underConstructionProjects += 1;
      metrics.totalPlannedMw += project.powerMwPlanned || 0;
      metrics.totalSecuredMw += project.powerMwSecured || 0;
      metrics.disclosedGpuCount += project.gpuCount || 0;
      metrics.disclosedContractValueUsd += project.contractValueUsd || 0;
      return metrics;
    },
    {
      totalProjects: 0,
      operatingProjects: 0,
      underConstructionProjects: 0,
      totalPlannedMw: 0,
      totalSecuredMw: 0,
      disclosedGpuCount: 0,
      disclosedContractValueUsd: 0
    }
  );
}

export function aggregateCompanyMetrics(projects: Project[]): CompanyMetric[] {
  const metrics = new Map<string, CompanyMetric & { confidenceTotal: number }>();
  projects.forEach((project) => {
    const current =
      metrics.get(project.company) ||
      ({
        company: project.company,
        projectCount: 0,
        plannedMw: 0,
        securedMw: 0,
        gpuCount: 0,
        contractValueUsd: 0,
        averageConfidence: 0,
        confidenceTotal: 0
      } satisfies CompanyMetric & { confidenceTotal: number });

    current.projectCount += 1;
    current.plannedMw += project.powerMwPlanned || 0;
    current.securedMw += project.powerMwSecured || 0;
    current.gpuCount += project.gpuCount || 0;
    current.contractValueUsd += project.contractValueUsd || 0;
    current.confidenceTotal += project.confidenceScore;
    current.averageConfidence = current.confidenceTotal / current.projectCount;
    metrics.set(project.company, current);
  });

  return [...metrics.values()]
    .map((metric) => ({
      company: metric.company,
      projectCount: metric.projectCount,
      plannedMw: metric.plannedMw,
      securedMw: metric.securedMw,
      gpuCount: metric.gpuCount,
      contractValueUsd: metric.contractValueUsd,
      averageConfidence: metric.averageConfidence
    }))
    .sort((a, b) => b.contractValueUsd - a.contractValueUsd || b.plannedMw - a.plannedMw);
}

export function getStatusMix(projects: Project[]) {
  const counts = new Map<ProjectStatus, number>();
  projects.forEach((project) => counts.set(project.status, (counts.get(project.status) || 0) + 1));
  return [...counts.entries()].map(([status, count]) => ({
    status,
    label: statusLabels[status],
    count,
    color: statusColors[status]
  }));
}

export function confidenceToOpacity(confidenceScore: number) {
  return Math.max(0.28, Math.min(1, 0.28 + (confidenceScore / 100) * 0.72));
}

export function markerRadius(project: Project) {
  const mw = project.powerMwSecured || project.powerMwPlanned || 25;
  return Math.max(7, Math.min(28, Math.sqrt(mw) * 1.05));
}

export function formatNumber(value?: number, fractionDigits = 0) {
  if (!Number.isFinite(value)) return "N/A";
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  });
}

export function formatMw(value?: number) {
  if (!Number.isFinite(value) || value === 0) return "미공개";
  return `${formatNumber(value)} MW`;
}

export function formatGpuCount(value?: number) {
  if (!Number.isFinite(value) || value === 0) return "미공개";
  return `${formatNumber(value)} GPUs`;
}

export function formatUsd(value?: number) {
  const amount = value ?? Number.NaN;
  if (!Number.isFinite(amount) || amount === 0) return "미공개";
  if (amount >= 1_000_000_000) return `$${formatNumber(amount / 1_000_000_000, 1)}bn`;
  if (amount >= 1_000_000) return `$${formatNumber(amount / 1_000_000, 1)}mn`;
  return `$${formatNumber(amount)}`;
}

export function formatConfidence(value?: number) {
  if (!Number.isFinite(value)) return "N/A";
  return `${formatNumber(value, 0)}점`;
}

export function formatLocation(project: Project) {
  return [project.city, project.state, project.country].filter(Boolean).join(", ") || "위치 미공개";
}

export function isHttpUrl(value?: string) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function sourceLabel(value?: string) {
  return value || "Source pending";
}

export function toCsv(projects: Project[]) {
  const headers = [
    "company",
    "projectName",
    "country",
    "state",
    "city",
    "status",
    "projectType",
    "powerMwPlanned",
    "powerMwSecured",
    "gpuModel",
    "gpuCount",
    "customer",
    "contractValueUsd",
    "contractStatus",
    "expectedOnlineDate",
    "locationAccuracy",
    "confidenceScore",
    "lastUpdated",
    "sourceUrl",
    "notes"
  ];
  const body = projects.map((project) => headers.map((header) => csvCell(project[header as keyof Project])).join(","));
  return [headers.join(","), ...body].join("\n");
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
