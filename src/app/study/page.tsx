import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export default function StudyPage() {
  return (
    <>
      <SiteNav />
      <main className="hub-shell">
        <header className="mb-4">
          <p className="kicker">Study</p>
          <h1 className="mt-2 text-[clamp(26px,3vw,40px)] font-black leading-tight text-navy">스터디 페이지</h1>
          <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-muted">분석 목적의 단일 주제 대시보드를 모아둔 공간입니다.</p>
        </header>
        <Link className="panel block max-w-[520px] p-5 transition hover:border-teal hover:bg-[#fbfdfb]" href="/study/spacex">
          <p className="kicker">SpaceX</p>
          <h2 className="mt-2 text-[21px] font-black text-navy">SpaceX S-1/A 분석</h2>
          <p className="mt-3 text-[13px] leading-6 text-muted">SpaceX S-1/A 관련 핵심 수치와 검증 메모를 정리한 화면입니다.</p>
        </Link>
      </main>
    </>
  );
}
