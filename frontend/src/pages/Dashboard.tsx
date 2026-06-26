import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { Certification } from "../types/certification";

export function Dashboard() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.certifications
      .list()
      .then(setCerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withExpiry = certs.filter(
    (c): c is Certification & { expirationDate: string } => !!c.expirationDate,
  );
  const expiringSoon = withExpiry.filter((c) => {
    const days = Math.ceil(
      (new Date(c.expirationDate).getTime() - today.getTime()) / 86400000,
    );
    return days >= 0 && days <= 30;
  });
  const expired = withExpiry.filter((c) => new Date(c.expirationDate) < today);

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>Dashboard</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          {
            label: "Total certifications",
            value: certs.length,
            color: "#1a1a2e",
          },
          {
            label: "Expiring in 30 days",
            value: expiringSoon.length,
            color: "#ca8a04",
          },
          { label: "Expired", value: expired.length, color: "#dc2626" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "1.25rem",
            }}
          >
            <div style={{ fontSize: "2rem", fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{
                color: "#6b7280",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {expiringSoon.length > 0 && (
        <section>
          <h2 style={{ marginBottom: "0.75rem", color: "#ca8a04" }}>
            Expiring soon
          </h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {expiringSoon.map((c) => (
              <li
                key={c.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "0.75rem 1rem",
                }}
              >
                <strong>{c.name}</strong> — expires {c.expirationDate}
              </li>
            ))}
          </ul>
        </section>
      )}

      {certs.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <p>No certifications yet.</p>
          <Link
            to="/certifications"
            style={{ color: "#1a1a2e", fontWeight: 500 }}
          >
            Add your first certification
          </Link>
        </div>
      )}
    </div>
  );
}
