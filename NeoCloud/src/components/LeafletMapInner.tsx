"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import {
  confidenceToOpacity,
  contractStatusLabels,
  formatConfidence,
  formatGpuCount,
  formatLocation,
  formatMw,
  formatUsd,
  hasCoordinates,
  isHttpUrl,
  locationAccuracyLabels,
  markerRadius,
  projectTypeLabels,
  sourceLabel,
  statusColors,
  statusLabels
} from "@/lib/project-utils";
import type { Project } from "@/types/project";

type LeafletMapInnerProps = {
  expanded?: boolean;
  projects: Project[];
  selectedProjectId?: string;
  onProjectSelect: (project: Project) => void;
};

export default function LeafletMapInner({ expanded = false, projects, selectedProjectId, onProjectSelect }: LeafletMapInnerProps) {
  const plottedProjects = projects.filter(hasCoordinates);
  const selectedProject = plottedProjects.find((project) => project.id === selectedProjectId);

  return (
    <div className="relative">
      <MapContainer center={[39, -98]} zoom={4} scrollWheelZoom className={expanded ? "leaflet-expanded shadow-panel" : "shadow-panel"}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizeObserver expanded={expanded} />
        <MapFocus project={selectedProject} />
        {plottedProjects.map((project) => {
          const selected = project.id === selectedProjectId;
          return (
            <CircleMarker
              key={project.id}
              center={[project.latitude, project.longitude]}
              eventHandlers={{
                click: () => onProjectSelect(project)
              }}
              pathOptions={{
                color: selected ? "#172554" : statusColors[project.status],
                fillColor: statusColors[project.status],
                fillOpacity: confidenceToOpacity(project.confidenceScore),
                opacity: selected ? 1 : 0.8,
                weight: selected ? 4 : 2
              }}
              radius={markerRadius(project) + (selected ? 3 : 0)}
            >
              <Tooltip direction="top" offset={[0, -4]}>
                {project.company} · {project.projectName}
              </Tooltip>
              <Popup>
                <ProjectPopup project={project} />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-[400] rounded-lg border border-line bg-white/95 px-3 py-2 text-[12px] text-muted shadow-panel">
        marker size = MW, color = status, opacity = confidence
      </div>
    </div>
  );
}

function MapResizeObserver({ expanded }: { expanded: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timers = [0, 180, 420].map((delay) =>
      window.setTimeout(() => {
        map.invalidateSize();
      }, delay)
    );
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [expanded, map]);

  return null;
}

function MapFocus({ project }: { project?: Project & { latitude: number; longitude: number } }) {
  const map = useMap();
  useEffect(() => {
    if (project) {
      map.flyTo([project.latitude, project.longitude], Math.max(map.getZoom(), 6), { duration: 0.8 });
    }
  }, [map, project]);
  return null;
}

function ProjectPopup({ project }: { project: Project }) {
  const source = sourceLabel(project.sourceUrl);
  return (
    <div className="map-popup">
      <h3>{project.projectName}</h3>
      <dl>
        <dt>기업</dt>
        <dd>{project.company}</dd>
        <dt>위치</dt>
        <dd>{formatLocation(project)}</dd>
        <dt>위치 정확도</dt>
        <dd>{locationAccuracyLabels[project.locationAccuracy]}</dd>
        <dt>진행 상태</dt>
        <dd>{statusLabels[project.status]}</dd>
        <dt>프로젝트 유형</dt>
        <dd>{projectTypeLabels[project.projectType]}</dd>
        <dt>계획 전력</dt>
        <dd>{formatMw(project.powerMwPlanned)}</dd>
        <dt>확보 전력</dt>
        <dd>{formatMw(project.powerMwSecured)}</dd>
        <dt>GPU 모델</dt>
        <dd>{project.gpuModel || "미공개"}</dd>
        <dt>GPU 수량</dt>
        <dd>{formatGpuCount(project.gpuCount)}</dd>
        <dt>고객사</dt>
        <dd>{project.customer || "미공개"}</dd>
        <dt>계약 규모</dt>
        <dd>{formatUsd(project.contractValueUsd)}</dd>
        <dt>계약 상태</dt>
        <dd>{project.contractStatus ? contractStatusLabels[project.contractStatus] : "N/A"}</dd>
        <dt>가동 예정일</dt>
        <dd>{project.expectedOnlineDate || "미공개"}</dd>
        <dt>신뢰도</dt>
        <dd>{formatConfidence(project.confidenceScore)}</dd>
        <dt>최종 업데이트</dt>
        <dd>{project.lastUpdated}</dd>
        <dt>데이터 출처</dt>
        <dd>
          {isHttpUrl(project.sourceUrl) ? (
            <a href={project.sourceUrl} rel="noreferrer" target="_blank">
              Source
            </a>
          ) : (
            source
          )}
        </dd>
        <dt>메모</dt>
        <dd>{project.notes || "N/A"}</dd>
      </dl>
    </div>
  );
}
