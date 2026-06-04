import {
  contractStatusLabels,
  locationAccuracyLabels,
  statusColors,
  statusLabels
} from "@/lib/project-utils";
import type { ContractStatus, LocationAccuracy, ProjectStatus } from "@/types/project";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className="badge border-transparent text-white"
      style={{
        backgroundColor: statusColors[status]
      }}
    >
      {statusLabels[status]}
    </span>
  );
}

export function ContractBadge({ status }: { status?: ContractStatus }) {
  if (!status) return <span className="text-muted">N/A</span>;
  return <span className="badge border-[#d5decf] bg-white text-ink">{contractStatusLabels[status]}</span>;
}

export function LocationAccuracyBadge({ accuracy }: { accuracy: LocationAccuracy }) {
  const tone =
    accuracy === "exact_site"
      ? "border-teal/25 bg-teal/10 text-teal"
      : accuracy === "unknown"
        ? "border-coral/25 bg-coral/10 text-coral"
        : "border-gold/25 bg-gold/10 text-[#735318]";
  return <span className={`badge ${tone}`}>{locationAccuracyLabels[accuracy]}</span>;
}

export function ConfidenceBadge({ score }: { score?: number }) {
  const value = Number.isFinite(score) ? Number(score) : 0;
  const tone =
    value >= 65
      ? "border-teal/25 bg-teal/10 text-teal"
      : value >= 45
        ? "border-gold/25 bg-gold/10 text-[#735318]"
        : "border-coral/25 bg-coral/10 text-coral";
  return <span className={`badge ${tone}`}>{Math.round(value)}점</span>;
}
