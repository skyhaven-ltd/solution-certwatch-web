import { useState } from "react";
import {
  Certification,
  CreateCertificationRequest,
  CertificationVendor,
} from "../../types/certification";

interface Props {
  initial?: Certification;
  onSubmit: (data: CreateCertificationRequest) => Promise<void>;
  onCancel: () => void;
}

const VENDORS: { value: CertificationVendor; label: string }[] = [
  { value: "microsoft", label: "Microsoft" },
  { value: "aws", label: "Amazon Web Services" },
  { value: "comptia", label: "CompTIA" },
  { value: "hashicorp", label: "HashiCorp" },
  { value: "other", label: "Other" },
];

export function CertForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState<CertificationVendor>(
    initial?.vendor ?? "microsoft",
  );
  const [vendorCertId, setVendorCertId] = useState(initial?.vendorCertId ?? "");
  const [expirationDate, setExpirationDate] = useState(
    initial?.expirationDate ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        vendor,
        vendorCertId: vendorCertId || undefined,
        expirationDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  };
  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "1rem",
  };
  const labelStyle = {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#374151",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: "480px",
      }}
    >
      <div style={fieldStyle}>
        <label style={labelStyle}>Certification name *</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. AZ-104"
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Vendor *</label>
        <select
          style={inputStyle}
          value={vendor}
          onChange={(e) => setVendor(e.target.value as CertificationVendor)}
        >
          {VENDORS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Vendor cert ID (optional)</label>
        <input
          style={inputStyle}
          value={vendorCertId}
          onChange={(e) => setVendorCertId(e.target.value)}
          placeholder="e.g. MS-12345"
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Expiration date *</label>
        <input
          style={inputStyle}
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          required
        />
      </div>
      {error && (
        <div style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.5rem 1.25rem",
            background: "#1a1a2e",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {submitting ? "Saving..." : initial ? "Update" : "Add certification"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
