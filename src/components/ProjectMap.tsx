"use client";

import dynamic from "next/dynamic";
import type { Project } from "@/types/project";

const LeafletMapInner = dynamic(() => import("@/components/LeafletMapInner"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[640px] place-items-center rounded-lg border border-line bg-[#e7ece9] text-sm font-bold text-muted">
      지도 로딩 중
    </div>
  )
});

type ProjectMapProps = {
  expanded?: boolean;
  projects: Project[];
  selectedProjectId?: string;
  onProjectSelect: (project: Project) => void;
};

export default function ProjectMap(props: ProjectMapProps) {
  return <LeafletMapInner {...props} />;
}
