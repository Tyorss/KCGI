import AutoHeightFrame from "@/components/AutoHeightFrame";

type DashboardFrameProps = {
  title: string;
  kicker: string;
  description: string;
  src: string;
};

export default function DashboardFrame({ description, kicker, src, title }: DashboardFrameProps) {
  return (
    <main className="hub-shell">
      <div className="mb-4">
        <div>
          <p className="kicker">{kicker}</p>
          <h1 className="mt-2 text-[clamp(26px,2.6vw,38px)] font-black leading-tight text-navy">{title}</h1>
          <p className="mt-2 max-w-[820px] text-[14px] leading-6 text-muted">{description}</p>
        </div>
      </div>

      <section className="panel overflow-hidden" aria-label={title}>
        <AutoHeightFrame src={src} title={title} />
      </section>
    </main>
  );
}
