import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { sitePages } from "@/data/site-pages";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main className="hub-shell">
        <header className="mb-5 grid gap-5 rounded-lg border border-line bg-white p-6 shadow-panel lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="kicker">KCGI Research Dashboard</p>
            <h1 className="mt-2 text-[clamp(30px,4vw,52px)] font-black leading-tight text-navy">
              리서치 대시보드 홈
            </h1>
            <p className="mt-4 max-w-[860px] text-[15px] leading-7 text-muted">
              시장, AI 반도체, NeoCloud, SpaceX 스터디를 한 곳에서 선택해 들어가는 로컬 홈페이지입니다.
              개별 대시보드에서는 다른 페이지로 직접 이동하지 않고 홈으로만 돌아가도록 정리했습니다.
            </p>
          </div>
          <aside className="rounded-lg border border-teal/25 bg-[#f3faf7] p-4">
            <p className="text-[12px] font-black uppercase tracking-[0.08em] text-teal">Local Dev</p>
            <p className="mt-2 text-[14px] leading-6 text-ink">
              루트 폴더에서 <code className="font-mono">npm.cmd run dev</code> 실행 후
              <code className="ml-1 font-mono">http://localhost:3100</code>으로 접속합니다.
            </p>
          </aside>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Dashboard links">
          {sitePages.map((page) => (
            <Link key={page.href} className="panel block min-h-[210px] p-5 transition hover:border-teal hover:bg-[#fbfdfb]" href={page.href}>
              <p className="kicker">{page.kicker}</p>
              <h2 className="mt-2 text-[21px] font-black leading-tight text-navy">{page.title}</h2>
              <p className="mt-3 text-[13px] leading-6 text-muted">{page.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {page.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-line bg-white px-2 py-1 text-[12px] font-bold text-ink">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[12px] font-black text-teal">{page.status}</p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
