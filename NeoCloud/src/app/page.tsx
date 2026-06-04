import DashboardShell from "@/components/DashboardShell";
import contracts from "@/data/contracts.json";
import projects from "@/data/projects.json";
import type { ContractRecord, Project } from "@/types/project";

export default function Home() {
  return <DashboardShell contracts={contracts as ContractRecord[]} homeHref="http://localhost:3100/" projects={projects as Project[]} />;
}
