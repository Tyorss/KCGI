"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ConfidenceBadge } from "@/components/Badges";
import {
  ALL_VALUE,
  aggregateCompanyMetrics,
  formatGpuCount,
  formatMw,
  formatUsd,
  getStatusMix,
  statusLabels
} from "@/lib/project-utils";
import type { Project } from "@/types/project";

type CompanySummaryProps = {
  projects: Project[];
  selectedCompany: string;
  onSelectCompany: (company: string) => void;
};

export default function CompanySummary({ projects, selectedCompany, onSelectCompany }: CompanySummaryProps) {
  const metrics = aggregateCompanyMetrics(projects);
  const detailCompany = selectedCompany !== ALL_VALUE ? selectedCompany : metrics[0]?.company;
  const detailProjects = detailCompany ? projects.filter((project) => project.company === detailCompany) : [];
  const statusMix = getStatusMix(detailProjects);
  const detailMetric = metrics.find((metric) => metric.company === detailCompany);

  return (
    <section className="panel p-4" aria-label="Company summary">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Company Summary</p>
          <h2 className="section-title">기업별 요약 / Peer Summary</h2>
          <p className="subcopy mt-1">기업 행을 클릭하면 해당 기업 필터와 상세 패널이 연결됩니다.</p>
        </div>
        {selectedCompany !== ALL_VALUE ? (
          <button className="btn" type="button" onClick={() => onSelectCompany(ALL_VALUE)}>
            기업 필터 해제
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="table-wrap">
          <table className="data-table min-w-[920px]">
            <thead>
              <tr>
                <th>기업 / Company</th>
                <th>프로젝트 수 / Project Count</th>
                <th>계획 전력 / Planned MW</th>
                <th>확보 전력 / Secured MW</th>
                <th>GPU 수량 / GPU Count</th>
                <th>계약 규모 / Contract Value</th>
                <th>평균 신뢰도 / Avg Confidence</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length ? (
                metrics.map((metric) => (
                  <tr
                    key={metric.company}
                    className={metric.company === selectedCompany ? "bg-[#edf7f2]" : "cursor-pointer"}
                    onClick={() => onSelectCompany(metric.company)}
                  >
                    <td>
                      <strong>{metric.company}</strong>
                    </td>
                    <td>{metric.projectCount}</td>
                    <td>{formatMw(metric.plannedMw)}</td>
                    <td>{formatMw(metric.securedMw)}</td>
                    <td>{formatGpuCount(metric.gpuCount)}</td>
                    <td>{formatUsd(metric.contractValueUsd)}</td>
                    <td>
                      <ConfidenceBadge score={metric.averageConfidence} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    표시할 기업 요약이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-lg border border-line bg-[#fbfcfa] p-4">
          {detailMetric ? (
            <>
              <div className="mb-3">
                <p className="kicker">Company Detail</p>
                <h3 className="text-lg font-black text-navy">{detailMetric.company}</h3>
                <p className="subcopy mt-1">선택 기업의 프로젝트, 전력, GPU, 계약 규모를 필터 기준으로 집계합니다.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <DetailMetric label="프로젝트" value={`${detailMetric.projectCount}`} />
                <DetailMetric label="계획 전력" value={formatMw(detailMetric.plannedMw)} />
                <DetailMetric label="확보 전력" value={formatMw(detailMetric.securedMw)} />
                <DetailMetric label="GPU 수량" value={formatGpuCount(detailMetric.gpuCount)} />
                <DetailMetric label="계약 규모" value={formatUsd(detailMetric.contractValueUsd)} />
                <DetailMetric label="평균 신뢰도" value={`${Math.round(detailMetric.averageConfidence)}점`} />
              </div>

              <div className="mt-4 h-[220px]">
                {statusMix.length ? (
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie data={statusMix} dataKey="count" innerRadius={48} nameKey="label" outerRadius={78} paddingAngle={2}>
                        {statusMix.map((item) => (
                          <Cell key={item.status} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}건`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-muted">상태 mix가 없습니다.</div>
                )}
              </div>

              <div className="mt-3 grid gap-2">
                {detailProjects.map((project) => (
                  <div key={project.id} className="rounded-lg border border-line bg-white p-3">
                    <strong className="text-sm text-navy">{project.projectName}</strong>
                    <p className="mt-1 text-[12px] leading-5 text-muted">
                      {statusLabels[project.status]} · {project.notes}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-[260px] place-items-center text-sm text-muted">기업을 선택하면 상세가 표시됩니다.</div>
          )}
        </aside>
      </div>
    </section>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <span className="block text-[12px] font-black text-muted">{label}</span>
      <strong className="mt-2 block text-base font-black text-navy">{value}</strong>
    </div>
  );
}
