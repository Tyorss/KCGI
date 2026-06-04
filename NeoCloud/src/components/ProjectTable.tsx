"use client";

import { useMemo, useState } from "react";
import { ConfidenceBadge, ContractBadge, LocationAccuracyBadge, StatusBadge } from "@/components/Badges";
import {
  formatGpuCount,
  formatLocation,
  formatMw,
  formatUsd,
  hasCoordinates,
  isHttpUrl,
  projectTypeLabels,
  sourceLabel
} from "@/lib/project-utils";
import type { Project } from "@/types/project";

type SortKey =
  | "company"
  | "projectName"
  | "status"
  | "powerMwPlanned"
  | "powerMwSecured"
  | "gpuCount"
  | "contractValueUsd"
  | "expectedOnlineDate"
  | "confidenceScore";

type ProjectTableProps = {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
};

export default function ProjectTable({ projects, onProjectSelect }: ProjectTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("contractValueUsd");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => compareProject(a, b, sortKey, direction));
  }, [direction, projects, sortKey]);

  function updateSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setDirection(direction === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextKey);
    setDirection("desc");
  }

  return (
    <section className="panel p-4" aria-label="Project table">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Project Pipeline</p>
          <h2 className="section-title">프로젝트 현황 / Project Pipeline</h2>
          <p className="subcopy mt-1">행을 클릭하면 좌표가 있는 프로젝트는 지도 중심이 해당 위치로 이동합니다.</p>
        </div>
        <span className="text-[12px] font-black text-muted">{sortedProjects.length} rows</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="기업 / Company" active={sortKey === "company"} direction={direction} onClick={() => updateSort("company")} />
              <SortableTh
                label="프로젝트 / Project"
                active={sortKey === "projectName"}
                direction={direction}
                onClick={() => updateSort("projectName")}
              />
              <th>위치 / Location</th>
              <SortableTh label="진행 상태 / Status" active={sortKey === "status"} direction={direction} onClick={() => updateSort("status")} />
              <SortableTh
                label="계획 전력 / Planned MW"
                active={sortKey === "powerMwPlanned"}
                direction={direction}
                onClick={() => updateSort("powerMwPlanned")}
              />
              <SortableTh
                label="확보 전력 / Secured MW"
                active={sortKey === "powerMwSecured"}
                direction={direction}
                onClick={() => updateSort("powerMwSecured")}
              />
              <th>GPU 모델 / GPU Model</th>
              <SortableTh label="GPU 수량 / GPU Count" active={sortKey === "gpuCount"} direction={direction} onClick={() => updateSort("gpuCount")} />
              <th>고객사 / Customer</th>
              <SortableTh
                label="계약 규모 / Contract Value"
                active={sortKey === "contractValueUsd"}
                direction={direction}
                onClick={() => updateSort("contractValueUsd")}
              />
              <th>계약 상태 / Contract Status</th>
              <SortableTh
                label="가동 예정일 / Expected Online"
                active={sortKey === "expectedOnlineDate"}
                direction={direction}
                onClick={() => updateSort("expectedOnlineDate")}
              />
              <SortableTh
                label="신뢰도 / Confidence"
                active={sortKey === "confidenceScore"}
                direction={direction}
                onClick={() => updateSort("confidenceScore")}
              />
              <th>데이터 출처 / Source</th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.length ? (
              sortedProjects.map((project) => (
                <tr
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => onProjectSelect(project)}
                  title={hasCoordinates(project) ? "지도에서 위치 보기" : "좌표 확인 필요"}
                >
                  <td>
                    <strong>{project.company}</strong>
                    <br />
                    <span className="text-[12px] text-muted">{projectTypeLabels[project.projectType]}</span>
                  </td>
                  <td>
                    <strong>{project.projectName}</strong>
                    <br />
                    <span className="text-[12px] text-muted">{project.notes}</span>
                  </td>
                  <td>
                    {formatLocation(project)}
                    <div className="mt-1">
                      <LocationAccuracyBadge accuracy={project.locationAccuracy} />
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={project.status} />
                  </td>
                  <td>{formatMw(project.powerMwPlanned)}</td>
                  <td>{formatMw(project.powerMwSecured)}</td>
                  <td>{project.gpuModel || "미공개"}</td>
                  <td>{formatGpuCount(project.gpuCount)}</td>
                  <td>{project.customer || "미공개"}</td>
                  <td>{formatUsd(project.contractValueUsd)}</td>
                  <td>
                    <ContractBadge status={project.contractStatus} />
                  </td>
                  <td>{project.expectedOnlineDate || "미공개"}</td>
                  <td>
                    <ConfidenceBadge score={project.confidenceScore} />
                  </td>
                  <td>
                    <SourceCell sourceUrl={project.sourceUrl} />
                    <div className="mt-1 text-[12px] text-muted">Updated {project.lastUpdated}</div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={14} className="text-center text-muted">
                  조건에 맞는 프로젝트가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SortableTh({
  label,
  active,
  direction,
  onClick
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th>
      <button className="text-left text-[12px] font-black text-muted" type="button" onClick={onClick}>
        {label} {active ? (direction === "asc" ? "▲" : "▼") : ""}
      </button>
    </th>
  );
}

function SourceCell({ sourceUrl }: { sourceUrl?: string }) {
  if (isHttpUrl(sourceUrl)) {
    return (
      <a className="font-bold text-teal underline-offset-2 hover:underline" href={sourceUrl} rel="noreferrer" target="_blank">
        Source
      </a>
    );
  }
  return <span className="font-mono text-[12px] text-muted">{sourceLabel(sourceUrl)}</span>;
}

function compareProject(a: Project, b: Project, sortKey: SortKey, direction: "asc" | "desc") {
  const aValue = sortValue(a, sortKey);
  const bValue = sortValue(b, sortKey);
  const multiplier = direction === "asc" ? 1 : -1;
  if (typeof aValue === "number" && typeof bValue === "number") {
    return (aValue - bValue) * multiplier;
  }
  return String(aValue).localeCompare(String(bValue)) * multiplier;
}

function sortValue(project: Project, sortKey: SortKey) {
  const value = project[sortKey];
  if (typeof value === "number") return value;
  return value || "";
}
