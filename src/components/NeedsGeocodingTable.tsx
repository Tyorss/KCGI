import { ConfidenceBadge, LocationAccuracyBadge, StatusBadge } from "@/components/Badges";
import { formatLocation, formatMw, formatUsd, isHttpUrl, sourceLabel } from "@/lib/project-utils";
import type { Project } from "@/types/project";

type NeedsGeocodingTableProps = {
  projects: Project[];
};

export default function NeedsGeocodingTable({ projects }: NeedsGeocodingTableProps) {
  return (
    <section className="panel p-4" aria-label="Needs geocoding">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Needs Geocoding</p>
          <h2 className="section-title">좌표 확인 필요 / Needs Geocoding</h2>
          <p className="subcopy mt-1">좌표가 없는 프로젝트는 지도에 표시하지 않고 이 표에 보존합니다.</p>
        </div>
        <span className="text-[12px] font-black text-muted">{projects.length} rows</span>
      </div>
      <div className="table-wrap">
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>기업 / Company</th>
              <th>프로젝트 / Project</th>
              <th>위치 / Location</th>
              <th>상태 / Status</th>
              <th>계획 전력 / Planned MW</th>
              <th>계약 규모 / Contract Value</th>
              <th>위치 정확도 / Location Accuracy</th>
              <th>신뢰도 / Confidence</th>
              <th>데이터 출처 / Source</th>
            </tr>
          </thead>
          <tbody>
            {projects.length ? (
              projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.company}</strong>
                  </td>
                  <td>
                    <strong>{project.projectName}</strong>
                    <br />
                    <span className="text-[12px] text-muted">{project.notes}</span>
                  </td>
                  <td>{formatLocation(project)}</td>
                  <td>
                    <StatusBadge status={project.status} />
                  </td>
                  <td>{formatMw(project.powerMwPlanned)}</td>
                  <td>{formatUsd(project.contractValueUsd)}</td>
                  <td>
                    <LocationAccuracyBadge accuracy={project.locationAccuracy} />
                  </td>
                  <td>
                    <ConfidenceBadge score={project.confidenceScore} />
                  </td>
                  <td>
                    {isHttpUrl(project.sourceUrl) ? (
                      <a className="font-bold text-teal underline-offset-2 hover:underline" href={project.sourceUrl} rel="noreferrer" target="_blank">
                        Source
                      </a>
                    ) : (
                      <span className="font-mono text-[12px] text-muted">{sourceLabel(project.sourceUrl)}</span>
                    )}
                    <br />
                    <span className="text-[12px] text-muted">Updated {project.lastUpdated}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center text-muted">
                  현재 필터 조건에서 좌표 누락 프로젝트가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
