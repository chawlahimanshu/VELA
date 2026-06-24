import { useEffect, useRef } from "react";

function Waveform() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId, t = 0;
    function draw() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 90, bw = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        const n = Math.sin(i * 0.25 + t) * 0.45 + Math.sin(i * 0.6 + t * 1.4) * 0.3 + Math.sin(i * 0.12 + t * 0.6) * 0.25;
        const h = Math.max(3, Math.abs(n) * canvas.height * 0.85);
        const p = i / bars;
        const r = p < 0.5 ? Math.round(120 + (220 - 120) * (p * 2)) : Math.round(220 + (249 - 220) * ((p - 0.5) * 2));
        const g = p < 0.5 ? Math.round(60 + (40 - 60) * (p * 2)) : Math.round(40 + (120 - 40) * ((p - 0.5) * 2));
        const b = p < 0.5 ? Math.round(240 + (120 - 240) * (p * 2)) : Math.round(120 + (22 - 120) * ((p - 0.5) * 2));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * bw + 1, (canvas.height - h) / 2, bw - 2, h);
      }
      t += 0.025;
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "110px", display: "block" }} />;
}

export default function Landing() {
  const login = () => { window.location.href = "http://localhost:5000/oauth/login"; };

  return (
    <div style={{ background: "#080810", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden", position: "relative" }}>

      {/* Dot grid background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* Arch glow */}
      <div style={{
        position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
        width: 700, height: 700, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(100,60,200,0.18) 0%, transparent 70%)",
      }} />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 56px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(8,8,16,0.8)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs>
            <polygon points="10,1 19,19 1,19" fill="url(#vg)" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.2em" }}>VELA</span>
        </div>
        <div style={{ display: "flex", gap: 36 }}>
          {["Product", "How It Works", "Security", "Pricing"].map(l => (
            <a key={l} href="#" style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textDecoration: "none", letterSpacing: "0.02em" }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
            >{l}</a>
          ))}
        </div>
        <button onClick={login} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 18px", background: "transparent",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
          color: "#fff", fontSize: 13, cursor: "pointer",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#00A1E0" /><text x="7" y="10.5" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">SF</text></svg>
          Login with Salesforce
        </button>
      </nav>

      {/* HERO */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 160, paddingLeft: 24, paddingRight: 24 }}>
        {/* Headline line 1 */}
        <h1 style={{ margin: "0 0 6px", fontSize: "clamp(50px, 8.5vw, 92px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.03, color: "#fff" }}>
          The right words.
        </h1>

        {/* Headline line 2 — gradient text fix */}
        <h1 style={{ margin: "0 0 36px", fontSize: "clamp(50px, 8.5vw, 92px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.03 }}>
          <span style={{
            background: "linear-gradient(95deg, #a78bfa, #f472b6, #fb923c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            display: "inline",
          }}>In real time.</span>
        </h1>

        {/* Sub */}
        <p style={{ maxWidth: 390, fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.4)", margin: "0 0 52px", fontWeight: 400 }}>
          VELA listens to live conversations, understands your client,
          and gives you the perfect response before you need it.
        </p>

        {/* CTA */}
        <button onClick={login} style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "14px 32px", background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10,
          color: "#fff", fontSize: 15, cursor: "pointer", marginBottom: 72,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="17" height="17" viewBox="0 0 17 17"><circle cx="8.5" cy="8.5" r="8.5" fill="#00A1E0" /><text x="8.5" y="12.5" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">SF</text></svg>
          Login with Salesforce
        </button>

        {/* Waveform */}
        <div style={{ width: "100%", maxWidth: 960 }}><Waveform /></div>

        {/* Trusted */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 36, marginBottom: 52, color: "rgba(255,255,255,0.2)", fontSize: 13, letterSpacing: "0.04em" }}>
          <div style={{ height: 1, width: 56, background: "rgba(255,255,255,0.08)" }} />
          Trusted by modern insurance teams
          <div style={{ height: 1, width: 56, background: "rgba(255,255,255,0.08)" }} />
        </div>
      </div>
    </div>
  );
}