import DashboardFrame from "@/components/DashboardFrame";
import SiteNav from "@/components/SiteNav";

export default function SpacexStudyPage() {
  return (
    <>
      <SiteNav />
      <DashboardFrame
        description="SpaceX S-1/A 관련 핵심 수치, 사업부, 리스크, 소스 메모를 정리한 스터디 화면입니다."
        kicker="SpaceX Study"
        src="/Study/SpaceX/spacex_s1_dashboard.html"
        title="SpaceX S-1/A 분석"
      />
    </>
  );
}
