import { useState } from "react";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from "./FireBase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await doSignInWithEmailAndPassword(email, password);
      navigate("/home");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await doSignInWithGoogle();
      navigate("/home");
    } catch (err) {
      setError("Google sign in failed");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    marginBottom: 12,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s",
  };

  return (
    <div style={{
      background: "#0a0a0b",
      minHeight: "100vh",
      color: "#fff",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
        .li-input:focus { border-color: rgba(167,139,250,0.6) !important; }
        .li-primary { transition: opacity .15s, transform .12s; }
        .li-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .li-ghost { transition: border-color .15s, background .15s; }
        .li-ghost:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.03); }
        .li-link { color: rgba(255,255,255,0.45); transition: color .15s; cursor: pointer; }
        .li-link:hover { color: #fff; }
      `}</style>

      {/* logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30 }}>
        <svg width="20" height="20" viewBox="0 0 20 20">
          <polygon points="10,2 18,18 2,18" fill="none" stroke="#8b5cf6" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "0.24em" }}>VELA</span>
      </div>

      {/* card */}
      <div style={{
        width: "100%",
        maxWidth: 380,
        padding: 32,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <h1 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 400,
          fontSize: 30,
          textAlign: "center",
          margin: "0 0 6px",
          letterSpacing: "-0.01em",
        }}>
          Welcome <span style={{ fontStyle: "italic", color: "#a78bfa" }}>back.</span>
        </h1>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 14, margin: "0 0 26px" }}>
          Sign in to your VELA workspace
        </p>

        {error && (
          <p style={{
            color: "#ff8095", textAlign: "center", fontSize: 13.5,
            background: "rgba(255,84,112,0.08)", border: "1px solid rgba(255,84,112,0.2)",
            borderRadius: 8, padding: "8px 12px", marginBottom: 16,
          }}>{error}</p>
        )}

        <form onSubmit={handleEmailLogin}>
          <input
            className="li-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            className="li-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 18 }}
          />
          <button type="submit" className="li-primary" style={{
            width: "100%", padding: 13, background: "#fff", color: "#0a0a0b",
            border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Sign in
          </button>
        </form>

        {/* divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        <button onClick={handleGoogleLogin} className="li-ghost" style={{
          width: "100%", padding: 12, background: "transparent", color: "#fff",
          border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, fontSize: 14.5,
          cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
        }}>
          <svg width="17" height="17" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.1l3.02-2.34z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <p style={{ marginTop: 22, fontSize: 13.5, color: "rgba(255,255,255,0.4)" }}>
        New here? <span className="li-link" onClick={() => navigate("/signup")} style={{ color: "#a78bfa" }}>Create an account</span>
      </p>
    </div>
  );
}