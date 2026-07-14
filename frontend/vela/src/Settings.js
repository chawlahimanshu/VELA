import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./FireBase/firebase";
import { doSignOut } from "./FireBase/auth";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PROVIDERS = [
  {
    id: "anthropic",
    label: "Claude (Anthropic)",
    hint: "sk-ant-…",
    desc: "Powers the live response suggestions.",
    link: "https://console.anthropic.com/settings/keys",
    steps: [
      "Go to console.anthropic.com and sign in.",
      "Open Settings → API Keys.",
      "Click “Create Key”, name it, and copy it.",
      "Paste it here — it starts with sk-ant-.",
    ],
  },
  {
    id: "deepgram",
    label: "Deepgram",
    hint: "your Deepgram key",
    desc: "Transcribes the call in real time.",
    link: "https://console.deepgram.com/",
    steps: [
      "Go to console.deepgram.com and sign in.",
      "Open the API Keys tab.",
      "Click “Create a New API Key” and copy it.",
      "Paste it here.",
    ],
  },
];

function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [values, setValues] = useState({});
  const [status, setStatus] = useState({});
  const [openInfo, setOpenInfo] = useState({});
  const [prefs, setPrefs] = useState({ autoSuggest: true, saveTranscripts: false, language: "en-US" });

  const handleLogin = () => { window.location.href = `${API}/oauth/login`; };

  const logout = async () => {
    await doSignOut();
    navigate("/");
  };

  const saveKey = async (provider) => {
    const key = (values[provider] || "").trim();
    if (!key) {
      setStatus((s) => ({ ...s, [provider]: { type: "err", msg: "Enter a key first." } }));
      return;
    }
    setStatus((s) => ({ ...s, [provider]: { type: "load", msg: "Saving…" } }));
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API}/save-key`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus((s) => ({ ...s, [provider]: { type: "ok", msg: "Connected" } }));
        setValues((v) => ({ ...v, [provider]: "" }));
      } else {
        setStatus((s) => ({ ...s, [provider]: { type: "err", msg: data.error || "Could not save." } }));
      }
    } catch (e) {
      setStatus((s) => ({ ...s, [provider]: { type: "err", msg: "Backend unreachable." } }));
    }
  };

  const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase();

  const card = {
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
    padding: 22, marginBottom: 16, background: "rgba(255,255,255,0.02)",
  };
  const sectionLabel = {
    fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)", margin: "34px 0 14px",
  };

  return (
    <div style={{ background: "#0a0a0b", minHeight: "100vh", color: "#fff",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
        .s-input:focus { border-color: rgba(255,255,255,0.4) !important; }
        .s-save:hover { opacity: .9; }
        .s-link { color: rgba(255,255,255,0.5); cursor: pointer; transition: color .15s; }
        .s-link:hover { color: #fff; }
        .s-i { transition: background .15s, color .15s; }
        .s-i:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .s-out:hover { border-color: rgba(255,80,112,0.6) !important; color: #ff8095 !important; }
        a.doc { color: #fff; text-decoration: underline; text-underline-offset: 2px; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "34px 24px 90px" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="17" height="17" viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" /></svg>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.24em" }}>VELA</span>
          </div>
          <span className="s-link" onClick={() => navigate("/home")} style={{ fontSize: 13.5 }}>← Back</span>
        </div>

        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: 34, margin: "18px 0 0", letterSpacing: "-0.01em" }}>Settings</h1>

        {/* ACCOUNT */}
        <div style={sectionLabel}>Account</div>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#26262c",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600 }}>
              {initial}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600 }}>{user?.displayName || "VELA Agent"}</div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.45)" }}>{user?.email || "Not signed in"}</div>
          </div>
          <button onClick={logout} className="s-out" style={{
            padding: "9px 18px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5,
            background: "transparent", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)",
            transition: "border-color .15s, color .15s",
          }}>
            Sign out
          </button>
        </div>

        {/* API KEYS */}
        <div style={sectionLabel}>API Keys</div>
        {PROVIDERS.map((p) => {
          const st = status[p.id];
          const info = openInfo[p.id];
          return (
            <div key={p.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600 }}>{p.label}</span>
                  <button
                    className="s-i"
                    onClick={() => setOpenInfo((o) => ({ ...o, [p.id]: !o[p.id] }))}
                    title="How to get this key"
                    style={{ width: 20, height: 20, borderRadius: "50%", border: "none", cursor: "pointer",
                      background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 12,
                      fontStyle: "italic", fontFamily: "Georgia, serif", lineHeight: 1 }}
                  >i</button>
                </div>
                {st?.type === "ok" && (
                  <span style={{ fontSize: 12.5, color: "#4ade80", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} /> Connected
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>{p.desc}</p>

              {/* info popover */}
              {info && (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.7)" }}>
                    How to get your {p.label} key
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
                    {p.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  <a className="doc" href={p.link} target="_blank" rel="noreferrer"
                    style={{ display: "inline-block", marginTop: 10, fontSize: 13 }}>
                    Open {p.label} console →
                  </a>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <input className="s-input" type="password" placeholder={p.hint}
                  value={values[p.id] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                  style={{ flex: 1, padding: "11px 14px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
                    color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                <button className="s-save" onClick={() => saveKey(p.id)} style={{
                  padding: "11px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: "#fff", color: "#0a0a0b", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
                  Save
                </button>
              </div>
              {st && st.type !== "ok" && (
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: st.type === "err" ? "#ff8095" : "rgba(255,255,255,0.5)" }}>{st.msg}</p>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}



export default Settings;