import DashboardFrame from "@/components/DashboardFrame";
import SiteNav from "@/components/SiteNav";

export default function MarketArchivePage() {
  return (
    <>
      <SiteNav />
      <DashboardFrame
        description="4월 기준 시장 대시보드 아카이브입니다. 월간 자료 비교를 위해 별도 라우트로 보존합니다."
        kicker="Market Archive"
        src="/5월/market-dashboard-2026-04.html"
        title="4월 기준 시장 대시보드"
      />
    </>
  );
}
