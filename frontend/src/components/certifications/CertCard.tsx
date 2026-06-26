import { Certification } from "../../types/certification";

interface Props {
  cert: Certification;
  onEdit: (cert: Certification) => void;
  onDelete: (id: string) => void;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil(
    (new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

const VENDOR_LABELS: Record<string, string> = {
  microsoft: "Microsoft",
  aws: "AWS",
  comptia: "CompTIA",
  hashicorp: "HashiCorp",
  other: "Other",
};

export function CertCard({ cert, onEdit, onDelete }: Props) {
  const isCredly = cert.source === "credly";
  const hasExpiry = !!cert.expirationDate;
  const days = hasExpiry ? daysUntil(cert.expirationDate as string) : null;
  const isExpired = days !== null && days < 0;
  const isUrgent = days !== null && days >= 0 && days <= 14;
  const isWarning = days !== null && days > 14 && days <= 30;

  const statusColor = !hasExpiry
    ? "#6b7280"
    : isExpired
      ? "#dc2626"
      : isUrgent
        ? "#ea580c"
        : isWarning
          ? "#ca8a04"
          : "#16a34a";

  const expiryLabel = !hasExpiry
    ? "No expiry"
    : isExpired
      ? `Expired ${Math.abs(days as number)} days ago`
      : `Expires in ${days} days (${cert.expirationDate})`;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "1rem 1.25rem",
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 600,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {cert.name}
          {isCredly && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#3730a3",
                background: "#e0e7ff",
                borderRadius: "999px",
                padding: "0.1rem 0.5rem",
              }}
            >
              via Credly
            </span>
          )}
        </div>
        <div
          style={{
            color: "#6b7280",
            fontSize: "0.875rem",
            marginTop: "0.2rem",
          }}
        >
          {VENDOR_LABELS[cert.vendor] ?? cert.vendor}
        </div>
        <div
          style={{
            marginTop: "0.4rem",
            fontSize: "0.875rem",
            color: statusColor,
            fontWeight: 500,
          }}
        >
          {expiryLabel}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        {/* Credly-sourced certs are read-only — Credly is the source of truth. */}
        {!isCredly && (
          <button
            onClick={() => onEdit(cert)}
            style={{
              fontSize: "0.8rem",
              padding: "0.3rem 0.6rem",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        )}
        <button
          onClick={() => onDelete(cert.id)}
          style={{
            fontSize: "0.8rem",
            padding: "0.3rem 0.6rem",
            cursor: "pointer",
            color: "#dc2626",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
