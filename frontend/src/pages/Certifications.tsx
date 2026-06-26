import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import {
  Certification,
  CreateCertificationRequest,
} from "../types/certification";
import type { UserProfile } from "../types/user";
import { CertCard } from "../components/certifications/CertCard";
import { CertForm } from "../components/certifications/CertForm";

export function Certifications() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [data, prof] = await Promise.all([
        api.certifications.list(),
        api.users.getProfile().catch(() => null),
      ]);
      setCerts(data);
      setProfile(prof);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load certifications",
      );
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleSyncNow() {
    try {
      setError(null);
      setSyncing(true);
      const result = await api.certifications.sync();
      await load();
      alert(
        `Credly sync complete. Created ${result.created}, updated ${result.updated}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credly sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleUnlink() {
    if (
      !confirm(
        "Unlink your Credly profile? This removes all certifications imported from it.",
      )
    )
      return;
    try {
      setError(null);
      setSyncing(true);
      await api.credly.unlink();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink Credly");
    } finally {
      setSyncing(false);
    }
  }

  // Editing remains for any legacy manually-added certs; Credly-sourced certs
  // are read-only (CertCard hides the Edit button for them).
  async function handleUpdate(data: CreateCertificationRequest) {
    if (!editing) return;
    try {
      setError(null);
      await api.certifications.update(editing.id, data);
      await load();
      setEditing(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update certification",
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this certification?")) return;
    try {
      setError(null);
      await api.certifications.remove(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete certification",
      );
    }
  }

  if (loading) return <p>Loading...</p>;

  const credlyLinked = !!profile?.credlyUsername;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Certifications</h1>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {credlyLinked ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            fontSize: "0.875rem",
          }}
        >
          <div style={{ color: "#3730a3" }}>
            Linked to Credly as <strong>{profile?.credlyUsername}</strong>
            {profile?.credlyLastSyncedAt && (
              <>
                {" "}
                · last synced{" "}
                {new Date(profile.credlyLastSyncedAt).toLocaleString()}
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              style={{
                padding: "0.3rem 0.75rem",
                cursor: syncing ? "default" : "pointer",
              }}
            >
              {syncing ? "Syncing..." : "Sync now"}
            </button>
            <Link
              to="/credly"
              style={{
                padding: "0.3rem 0.75rem",
                background: "#1a1a2e",
                color: "#fff",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              Manage
            </Link>
            <button
              onClick={handleUnlink}
              disabled={syncing}
              style={{
                padding: "0.3rem 0.75rem",
                color: "#dc2626",
                cursor: syncing ? "default" : "pointer",
              }}
            >
              Unlink
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "1.5rem",
            marginBottom: "1.5rem",
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem", color: "#3730a3" }}>
            Connect your Credly profile
          </h2>
          <p
            style={{
              margin: "0 auto 1.25rem",
              maxWidth: "440px",
              color: "#4b5563",
              fontSize: "0.9rem",
            }}
          >
            CertWatch imports and refreshes your AWS, CompTIA and HashiCorp
            certifications automatically from your public Credly badges — no
            manual entry needed.
          </p>
          <Link
            to="/credly"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              background: "#1a1a2e",
              color: "#fff",
              borderRadius: "4px",
              textDecoration: "none",
            }}
          >
            Connect Credly
          </Link>
        </div>
      )}

      {editing && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 1rem" }}>Edit certification</h2>
          <CertForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {credlyLinked && certs.length === 0 && (
        <p style={{ color: "#6b7280", textAlign: "center", marginTop: "3rem" }}>
          No certifications found on your Credly profile yet. Try{" "}
          <strong>Sync now</strong>.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {certs.map((cert) => (
          <CertCard
            key={cert.id}
            cert={cert}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
