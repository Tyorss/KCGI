"use client";

import { useEffect, useMemo, useState } from "react";
import CompanySummary from "@/components/CompanySummary";
import ContractTracker from "@/components/ContractTracker";
import DashboardKpis from "@/components/DashboardKpis";
import NeedsGeocodingTable from "@/components/NeedsGeocodingTable";
import ProjectFilters from "@/components/ProjectFilters";
import ProjectMap from "@/components/ProjectMap";
import ProjectTable from "@/components/ProjectTable";
import {
  ALL_VALUE,
  aggregateKpis,
  defaultFilters,
  filterProjects,
  projectsWithoutCoordinates,
  projectsWithCoordinates,
  toCsv
} from "@/lib/project-utils";
import type { ContractRecord, Project, ProjectFilters as ProjectFiltersType } from "@/types/project";

type DashboardShellProps = {
  projects: Project[];
  contracts: ContractRecord[];
};

export default function DashboardShell({ contracts, projects }: DashboardShellProps) {
  const [filters, setFilters] = useState<ProjectFiltersType>(defaultFilters);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [mapExpanded, setMapExpanded] = useState(false);

  const filteredProjects = useMemo(() => filterProjects(projects, filters), [filters, projects]);
  const kpis = useMemo(() => aggregateKpis(filteredProjects), [filteredProjects]);
  const plottedProjects = useMemo(() => projectsWithCoordinates(filteredProjects), [filteredProjects]);
  const geocodingProjects = useMemo(() => projectsWithoutCoordinates(filteredProjects), [filteredProjects]);

  useEffect(() => {
    if (!mapExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMapExpanded(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mapExpanded]);

  function handleProjectSelect(project: Project) {
    setSelectedProjectId(project.id);
  }

  function handleCompanySelect(company: string) {
    setFilters((current) => ({ ...current, company }));
    setSelectedProjectId(undefined);
  }

  function handleExportCsv() {
    const csv = `\ufeff${toCsv(filteredProjects)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "neocloud_filtered_projects.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page-shell">
      <header className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div>
          <p className="kicker">Neocloud / AI Infrastructure</p>
          <h1 className="mt-2 text-[clamp(28px,3vw,42px)] font-black leading-tight text-navy">
            네오클라우드 인프라 프로젝트 대시보드
          </h1>
          <p className="mt-3 max-w-[940px] text-[15px] leading-7 text-muted">
            AI data center, GPU cloud, 전력 용량, customer contract, location accuracy, confidence score를 한 화면에서 추적합니다.
          </p>
        </div>
        <div className="rounded-lg border border-teal/25 bg-white px-4 py-3 text-[13px] font-black text-teal shadow-panel">
          Source-indexed seed dataset · 검증 전
        </div>
      </header>

      <section className="mb-4 rounded-lg border border-gold/30 bg-[#fff8e8] p-4 text-[13px] leading-6 text-[#6f4f16]">
        <strong className="block text-[14px] text-[#553b0f]">데이터 검증 고지</strong>
        현재 데이터는 회사 발표, SEC exhibit, Reuters/AP 보도, 회사 hardware page를 섞은 MVP seed입니다. 투자·리서치 활용 전
        재무, GPU, 전력, 계약, 위치 데이터는 원문 source로 재확인해야 합니다.
      </section>

      <div className="grid gap-4">
        <ProjectFilters projects={projects} filters={filters} onChange={setFilters} onExportCsv={handleExportCsv} />
        <DashboardKpis metrics={kpis} />

        <section
          aria-label="Interactive map"
          aria-modal={mapExpanded ? true : undefined}
          className={
            mapExpanded
              ? "fixed inset-3 z-[1000] overflow-auto rounded-lg border border-line bg-panel p-4 shadow-panel md:inset-6"
              : "panel p-4"
          }
          role={mapExpanded ? "dialog" : undefined}
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Interactive Map</p>
              <h2 className="section-title">프로젝트 지도 / Project Map</h2>
              <p className="subcopy mt-1">
                좌표가 있는 {plottedProjects.length}개 프로젝트만 표시합니다. 좌표가 없는 항목은 하단 표에서 따로 관리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px] font-black text-muted">
              <span className="rounded-full border border-line bg-white px-3 py-2">색상 = 진행 상태</span>
              <span className="rounded-full border border-line bg-white px-3 py-2">크기 = MW</span>
              <span className="rounded-full border border-line bg-white px-3 py-2">투명도 = 신뢰도</span>
              <button className="btn min-h-8 px-3 py-1 text-[12px]" type="button" onClick={() => setMapExpanded((current) => !current)}>
                {mapExpanded ? "크게 보기 닫기" : "지도 크게 보기"}
              </button>
            </div>
          </div>
          <ProjectMap
            expanded={mapExpanded}
            projects={filteredProjects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
          />
        </section>

        <CompanySummary
          projects={filteredProjects}
          selectedCompany={filters.company || ALL_VALUE}
          onSelectCompany={handleCompanySelect}
        />

        <ProjectTable projects={filteredProjects} onProjectSelect={handleProjectSelect} />
        <NeedsGeocodingTable projects={geocodingProjects} />
        <ContractTracker contracts={contracts} projects={filteredProjects} />
      </div>
    </main>
  );
}
