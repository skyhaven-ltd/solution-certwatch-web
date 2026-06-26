import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function AppLayout() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          marginTop: "4rem",
        }}
      >
        <h2>Authentication Error</h2>
        <p style={{ color: "#666" }}>{error}</p>
        <a
          href="/.auth/login/aad"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            background: "#1a1a2e",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Try signing in
        </a>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          marginTop: "4rem",
        }}
      >
        <h1>CertWatch</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Track your certification renewals and get reminders before they
          expire.
        </p>
        <a
          href="/.auth/login/aad"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "#1a1a2e",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        >
          Sign in with Microsoft
        </a>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      <nav
        style={{
          background: "#1a1a2e",
          color: "#fff",
          padding: "0.75rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>CertWatch</span>
        <Link to="/" style={{ color: "#ccc", textDecoration: "none" }}>
          Dashboard
        </Link>
        <Link
          to="/certifications"
          style={{ color: "#ccc", textDecoration: "none" }}
        >
          Certifications
        </Link>
        <Link to="/settings" style={{ color: "#ccc", textDecoration: "none" }}>
          Settings
        </Link>
        <span
          style={{ marginLeft: "auto", fontSize: "0.875rem", color: "#aaa" }}
        >
          {user.userDetails}
        </span>
        <a
          href="/logout"
          style={{
            color: "#ccc",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          Sign out
        </a>
      </nav>
      <main style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
