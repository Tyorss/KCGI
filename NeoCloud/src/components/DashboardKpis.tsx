import { formatGpuCount, formatMw, formatUsd } from "@/lib/project-utils";
import type { KpiMetric } from "@/types/project";

type DashboardKpisProps = {
  metrics: KpiMetric;
};

export default function DashboardKpis({ metrics }: DashboardKpisProps) {
  const cards = [
    {
      label: "전체 프로젝트 / Total Projects",
      value: `${metrics.totalProjects}`,
      detail: "현재 필터 기준"
    },
    {
      label: "가동 중 프로젝트 / Operating",
      value: `${metrics.operatingProjects}`,
      detail: "status = operating"
    },
    {
      label: "건설 중 프로젝트 / Under Construction",
      value: `${metrics.underConstructionProjects}`,
      detail: "status = under_construction"
    },
    {
      label: "계획 전력 / Planned MW",
      value: formatMw(metrics.totalPlannedMw),
      detail: "campus 또는 site potential 포함"
    },
    {
      label: "확보 전력 / Secured MW",
      value: formatMw(metrics.totalSecuredMw),
      detail: "contracted 또는 critical IT load"
    },
    {
      label: "공개 GPU 수량 / GPU Count",
      value: formatGpuCount(metrics.disclosedGpuCount),
      detail: "미공개 값 제외"
    },
    {
      label: "공개 계약 규모 / Contract Value",
      value: formatUsd(metrics.disclosedContractValueUsd),
      detail: "base-term disclosed value"
    }
  ];

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7" aria-label="KPI cards">
      {cards.map((card) => (
        <article key={card.label} className="panel min-h-[118px] p-3">
          <span className="block text-[12px] font-black leading-5 text-muted">{card.label}</span>
          <strong className="mt-3 block text-[21px] font-black leading-tight text-navy">{card.value}</strong>
          <span className="mt-2 block text-[12px] leading-5 text-muted">{card.detail}</span>
        </article>
      ))}
    </section>
  );
}
