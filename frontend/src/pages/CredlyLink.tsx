import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { UserProfile } from "../types/user";
import type { CredlyPreviewResponse } from "../types/certification";

const VENDOR_LABELS: Record<string, string> = {
  microsoft: "Microsoft",
  aws: "AWS",
  comptia: "CompTIA",
  hashicorp: "HashiCorp",
  other: "Other",
};

// Accept a raw username or a pasted profile URL and extract the vanity handle.
function parseHandle(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/credly\.com\/users\/([^/?#]+)/i);
  return (match ? match[1] : trimmed).replace(/^@/, "");
}

export function CredlyLink() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<CredlyPreviewResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.users
      .getProfile()
      .then((p) => {
        setProfile(p);
        if (p.credlyUsername) setInput(p.credlyUsername);
      })
      .catch(() => setProfile(null));
  }, []);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    const handle = parseHandle(input);
    if (!handle) {
      setError("Enter your Credly username or profile URL.");
      return;
    }
    try {
      setError(null);
      setBusy(true);
      setPreview(null);
      const result = await api.credly.preview(handle);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLink() {
    if (!preview) return;
    try {
      setError(null);
      setBusy(true);
      await api.certifications.sync(preview.username);
      navigate("/certifications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Linking failed.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "1rem",
    flex: 1,
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ marginTop: 0 }}>Connect Credly</h1>
      <p style={{ color: "#4b5563" }}>
        Link your Credly profile to automatically import and refresh your AWS,
        CompTIA and HashiCorp certifications. Your Credly badges must be{" "}
        <strong>public</strong> for CertWatch to read them.
      </p>

      {profile?.credlyUsername && (
        <p style={{ color: "#3730a3", fontSize: "0.875rem" }}>
          Currently linked as <strong>{profile.credlyUsername}</strong>
          {profile.credlyLastSyncedAt && (
            <>
              {" "}
              · last synced{" "}
              {new Date(profile.credlyLastSyncedAt).toLocaleString()}
            </>
          )}
        </p>
      )}

      <form
        onSubmit={handlePreview}
        style={{ display: "flex", gap: "0.5rem", margin: "1.5rem 0" }}
      >
        <input
          style={inputStyle}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="your-credly-username or profile URL"
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "0.5rem 1.25rem",
            background: "#1a1a2e",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "..." : "Preview"}
        </button>
      </form>

      {error && (
        <div
          style={{
            color: "#dc2626",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {preview && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.25rem",
            background: "#fff",
          }}
        >
          <p style={{ marginTop: 0 }}>
            Found <strong>{preview.count}</strong> public badge
            {preview.count === 1 ? "" : "s"} for{" "}
            <strong>{preview.username}</strong>.
          </p>

          {preview.count === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              No public badges found. Check the username and that your Credly
              profile is set to public.
            </p>
          ) : (
            <ul style={{ paddingLeft: "1.25rem", color: "#374151" }}>
              {preview.badges.map((b, i) => (
                <li key={i} style={{ marginBottom: "0.25rem" }}>
                  {b.name}{" "}
                  <span style={{ color: "#6b7280" }}>
                    ({VENDOR_LABELS[b.vendor] ?? b.vendor}
                    {b.expiresAt ? ` · expires ${b.expiresAt}` : " · no expiry"}
                    )
                  </span>
                </li>
              ))}
            </ul>
          )}

          {preview.count > 0 && (
            <button
              onClick={handleLink}
              disabled={busy}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1.25rem",
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: busy ? "default" : "pointer",
              }}
            >
              {busy ? "Importing..." : "Link & import"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
