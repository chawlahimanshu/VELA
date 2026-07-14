import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function VoiceLine() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bars = Array.from(el.children);
    let raf, t = 0;
    const tick = () => {
      t += 0.045;
      bars.forEach((b, i) => {
        const env = Math.sin((i / bars.length) * Math.PI); // taper edges
        const n =
          Math.sin(i * 0.5 + t) * 0.6 +
          Math.sin(i * 0.18 + t * 1.6) * 0.4;
        const h = Math.max(3, Math.abs(n) * env * 30);
        b.style.height = h + "px";
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} style={{ marginTop: 96, display: "flex", alignItems: "center", gap: 3, height: 34, opacity: 0.55 }}>
      {Array.from({ length: 130 }).map((_, i) => (
        <span key={i} style={{ width: 2, height: 6, background: "rgba(139,92,246,0.65)", borderRadius: 2 }} />
      ))}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const goLogin = () => navigate("/login");

  return (
    <div style={{
      background: "#0a0a0b",
      minHeight: "100vh",
      color: "#fff",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
        .vlink { color: rgba(255,255,255,0.5); text-decoration: none; transition: color .15s; }
        .vlink:hover { color: #fff; }
        .vprimary { transition: transform .12s ease, opacity .15s; }
        .vprimary:hover { opacity: 0.9; transform: translateY(-1px); }
        .vghost { transition: border-color .15s, background .15s; }
        .vghost:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.03); }
      `}</style>

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 40px", maxWidth: 1120, width: "100%", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 20 20">
            <polygon points="10,2 18,18 2,18" fill="none" stroke="#8b5cf6" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "0.24em" }}>VELA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <a href="#" className="vlink" style={{ fontSize: 14 }}>Product</a>
          <a href="#" className="vlink" style={{ fontSize: 14 }}>Pricing</a>
          <span className="vlink" onClick={goLogin} style={{ fontSize: 14, cursor: "pointer" }}>Sign in</span>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "40px 24px 120px",
      }}>
        <h1 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: "clamp(44px, 7vw, 82px)",
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: "-0.015em",
          margin: 0,
          maxWidth: 820,
        }}>
          Know the right thing<br />to say, <span style={{ fontStyle: "italic", color: "#a78bfa" }}>as you say it.</span>
        </h1>

        <p style={{
          maxWidth: 460,
          fontSize: 17,
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.5)",
          margin: "28px 0 40px",
        }}>
          VELA listens to your live calls and quietly hands you the
          perfect response, right when it matters.
        </p>

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={goLogin} className="vprimary" style={{
            background: "#fff", color: "#0a0a0b",
            border: "none", borderRadius: 10,
            padding: "13px 26px", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Get started
          </button>
          <button className="vghost" style={{
            background: "transparent", color: "#fff",
            border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10,
            padding: "13px 24px", fontSize: 15, cursor: "pointer", fontFamily: "inherit",
          }}>
            Watch demo
          </button>
        </div>

        <VoiceLine />
      </div>
    </div>
  );
}