import Link from "next/link";

export default function SiteNav() {
  return (
    <nav className="border-b border-line bg-white/95 backdrop-blur" aria-label="KCGI site navigation">
      <div className="mx-auto flex w-[min(1540px,calc(100%-28px))] flex-wrap items-center justify-between gap-3 py-3">
        <Link className="text-[15px] font-black text-navy transition hover:text-teal" href="/">
          KCGI Research Hub
        </Link>
        <Link
          className="inline-flex min-h-8 items-center rounded-lg border border-line bg-white px-3 py-1 text-[12px] font-black text-ink transition hover:border-teal hover:bg-[#f8fbf9]"
          href="/"
        >
          홈
        </Link>
      </div>
    </nav>
  );
}
