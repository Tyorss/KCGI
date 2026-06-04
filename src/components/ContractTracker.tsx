import { ConfidenceBadge, ContractBadge } from "@/components/Badges";
import { formatUsd, isHttpUrl, sourceLabel } from "@/lib/project-utils";
import type { ContractRecord, Project } from "@/types/project";

type ContractTrackerProps = {
  contracts: ContractRecord[];
  projects: Project[];
};

export default function ContractTracker({ contracts, projects }: ContractTrackerProps) {
  const visibleProjectIds = new Set(projects.map((project) => project.id));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const rows = contracts
    .filter((contract) => !contract.linkedProjectId || visibleProjectIds.has(contract.linkedProjectId))
    .sort((a, b) => (b.contractValueUsd || 0) - (a.contractValueUsd || 0));

  return (
    <section className="panel p-4" aria-label="Contract tracker">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Contract Tracker</p>
          <h2 className="section-title">계약 백로그 / Backlog</h2>
          <p className="subcopy mt-1">계약 규모, potential value, 고객사, 상태, 출처, 신뢰도 점수를 함께 보존합니다.</p>
        </div>
        <span className="text-[12px] font-black text-muted">{rows.length} rows</span>
      </div>
      <div className="table-wrap">
        <table className="data-table min-w-[1180px]">
          <thead>
            <tr>
              <th>공급사 / Supplier</th>
              <th>고객사 / Customer</th>
              <th>계약 규모 / Contract Value</th>
              <th>잠재 규모 / Potential Value</th>
              <th>계약 상태 / Contract Status</th>
              <th>GPU 모델 / GPU Model</th>
              <th>연결 프로젝트 / Linked Project</th>
              <th>발표일 / Announced</th>
              <th>가동 예정 / Expected Online</th>
              <th>데이터 출처 / Source</th>
              <th>신뢰도 / Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((contract) => {
                const linkedProject = contract.linkedProjectId ? projectById.get(contract.linkedProjectId) : undefined;
                return (
                  <tr key={contract.id}>
                    <td>
                      <strong>{contract.supplier || "미공개"}</strong>
                    </td>
                    <td>{contract.customer || "미공개"}</td>
                    <td>{formatUsd(contract.contractValueUsd)}</td>
                    <td>{formatUsd(contract.potentialValueUsd)}</td>
                    <td>
                      <ContractBadge status={contract.contractStatus} />
                    </td>
                    <td>{contract.gpuModel || "미공개"}</td>
                    <td>
                      {linkedProject ? (
                        <>
                          <strong>{linkedProject.projectName}</strong>
                          <br />
                          <span className="text-[12px] text-muted">{linkedProject.city || linkedProject.state || linkedProject.country}</span>
                        </>
                      ) : (
                        <span className="text-muted">프로젝트 위치 미공개</span>
                      )}
                    </td>
                    <td>{contract.announcedDate || "미공개"}</td>
                    <td>{contract.expectedOnlineDate || "미공개"}</td>
                    <td>
                      {isHttpUrl(contract.sourceUrl) ? (
                        <a className="font-bold text-teal underline-offset-2 hover:underline" href={contract.sourceUrl} rel="noreferrer" target="_blank">
                          Source
                        </a>
                      ) : (
                        <span className="font-mono text-[12px] text-muted">{sourceLabel(contract.sourceUrl)}</span>
                      )}
                    </td>
                    <td>
                      <ConfidenceBadge score={contract.confidenceScore || contract.sourceConfidence || 0} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="text-center text-muted">
                  현재 필터 조건에서 표시할 계약 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
