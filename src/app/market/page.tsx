import DashboardFrame from "@/components/DashboardFrame";
import SiteNav from "@/components/SiteNav";

export default function MarketPage() {
  return (
    <>
      <SiteNav />
      <DashboardFrame
        description="월간 자산배분 전략과 시장 지표를 확인하는 화면입니다. 기존 Chart.js 산출물을 Next.js 라우트 안에서 보존합니다."
        kicker="Market Dashboard"
        src="/5월/market-dashboard.html"
        title="시장 자산배분 대시보드"
      />
    </>
  );
}
