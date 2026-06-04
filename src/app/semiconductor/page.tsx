import DashboardFrame from "@/components/DashboardFrame";
import SiteNav from "@/components/SiteNav";

export default function SemiconductorPage() {
  return (
    <>
      <SiteNav />
      <DashboardFrame
        description="HBM, CoWoS, ASIC, CPU, NAND, 유리기판 관련 시장 규모와 플레이어 노출도를 정리한 리서치 화면입니다."
        kicker="AI Semiconductor"
        src="/반도체/ai-semiconductor-dashboard.html"
        title="AI 반도체 인프라 대시보드"
      />
    </>
  );
}
