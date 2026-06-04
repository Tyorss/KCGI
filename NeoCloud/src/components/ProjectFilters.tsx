"use client";

import {
  ALL_VALUE,
  contractStatusLabels,
  defaultFilters,
  locationAccuracyLabels,
  statusLabels,
  uniqueOptions
} from "@/lib/project-utils";
import type { ContractStatus, LocationAccuracy, Project, ProjectFilters, ProjectStatus } from "@/types/project";

type ProjectFiltersProps = {
  projects: Project[];
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  onExportCsv: () => void;
};

export default function ProjectFilters({ projects, filters, onChange, onExportCsv }: ProjectFiltersProps) {
  const companies = uniqueOptions(projects, (project) => project.company);
  const countries = uniqueOptions(projects, (project) => project.country);
  const states = uniqueOptions(projects, (project) => project.state);
  const customers = uniqueOptions(projects, (project) => project.customer);
  const gpuModels = uniqueOptions(projects, (project) => project.gpuModel).filter((value) => value !== "TBD");
  const statuses = Object.keys(statusLabels) as ProjectStatus[];
  const contractStatuses = Object.keys(contractStatusLabels) as ContractStatus[];
  const accuracies = Object.keys(locationAccuracyLabels) as LocationAccuracy[];

  function update<K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <section className="panel p-4" aria-label="Filters">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Filters</p>
          <h2 className="section-title">프로젝트 필터</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" type="button" onClick={() => onChange(defaultFilters)}>
            초기화
          </button>
          <button className="btn" type="button" onClick={onExportCsv}>
            필터 결과 CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <FilterSelect label="기업 / Company" value={filters.company} onChange={(value) => update("company", value)}>
          <option value={ALL_VALUE}>전체</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="진행 상태 / Status" value={filters.status} onChange={(value) => update("status", value)}>
          <option value={ALL_VALUE}>전체</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="국가 / Country" value={filters.country} onChange={(value) => update("country", value)}>
          <option value={ALL_VALUE}>전체</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="주·지역 / State" value={filters.state} onChange={(value) => update("state", value)}>
          <option value={ALL_VALUE}>전체</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="고객사 / Customer" value={filters.customer} onChange={(value) => update("customer", value)}>
          <option value={ALL_VALUE}>전체</option>
          {customers.map((customer) => (
            <option key={customer} value={customer}>
              {customer}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="GPU 모델 / GPU Model" value={filters.gpuModel} onChange={(value) => update("gpuModel", value)}>
          <option value={ALL_VALUE}>전체</option>
          {gpuModels.map((gpuModel) => (
            <option key={gpuModel} value={gpuModel}>
              {gpuModel}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="계약 상태 / Contract Status"
          value={filters.contractStatus}
          onChange={(value) => update("contractStatus", value)}
        >
          <option value={ALL_VALUE}>전체</option>
          {contractStatuses.map((status) => (
            <option key={status} value={status}>
              {contractStatusLabels[status]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="위치 정확도 / Location Accuracy"
          value={filters.locationAccuracy}
          onChange={(value) => update("locationAccuracy", value)}
        >
          <option value={ALL_VALUE}>전체</option>
          {accuracies.map((accuracy) => (
            <option key={accuracy} value={accuracy}>
              {locationAccuracyLabels[accuracy]}
            </option>
          ))}
        </FilterSelect>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[12px] font-black text-muted">
            최소 신뢰도 / Minimum Confidence Score: {filters.minimumConfidence}점
          </span>
          <input
            className="accent-teal"
            max={100}
            min={0}
            step={5}
            type="range"
            value={filters.minimumConfidence}
            onChange={(event) => update("minimumConfidence", Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
}

function FilterSelect({
  children,
  label,
  value,
  onChange
}: {
  children: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[12px] font-black text-muted">{label}</span>
      <select className="control" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}
