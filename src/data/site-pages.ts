export type SitePage = {
  title: string;
  kicker: string;
  href: string;
  legacyHref?: string;
  description: string;
  tags: string[];
  status: string;
};

export const sitePages: SitePage[] = [
  {
    title: "시장 자산배분 대시보드",
    kicker: "Market Dashboard",
    href: "/market",
    legacyHref: "/5월/market-dashboard.html",
    description: "월간 자산배분 전략과 시장 지표를 정리한 리서치 페이지입니다.",
    tags: ["자산배분", "시장", "월간 전략"],
    status: "Next route + legacy chart"
  },
  {
    title: "4월 기준 시장 대시보드",
    kicker: "Market Archive",
    href: "/market/2026-04",
    legacyHref: "/5월/market-dashboard-2026-04.html",
    description: "4월 기준 산출물을 보존한 아카이브 화면입니다.",
    tags: ["아카이브", "4월 기준", "시장"],
    status: "Next route + legacy chart"
  },
  {
    title: "AI 반도체 인프라",
    kicker: "Semiconductor",
    href: "/semiconductor",
    legacyHref: "/반도체/ai-semiconductor-dashboard.html",
    description: "HBM, CoWoS, ASIC, CPU, NAND, 유리기판을 한 화면에서 비교합니다.",
    tags: ["AI 반도체", "HBM", "CoWoS"],
    status: "Next route + legacy chart"
  },
  {
    title: "NeoCloud 프로젝트 지도",
    kicker: "Neocloud",
    href: "/neocloud",
    description: "AI 데이터센터, 전력, GPU, 계약, 위치 정확도, 신뢰도 점수를 추적합니다.",
    tags: ["지도", "AI 데이터센터", "계약"],
    status: "Native Next.js"
  },
  {
    title: "SpaceX S-1 분석",
    kicker: "Study",
    href: "/study/spacex",
    legacyHref: "/Study/SpaceX/spacex_s1_dashboard.html",
    description: "SpaceX S-1 관련 핵심 수치와 검증 메모를 정리한 스터디 페이지입니다.",
    tags: ["SpaceX", "S-1", "스터디"],
    status: "Next route + legacy chart"
  }
];
