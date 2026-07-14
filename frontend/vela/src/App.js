import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Routes, Route, useNavigate } from "react-router-dom";
import { auth } from "./FireBase/firebase";
import Settings from "./Settings";
import Login from "./Login";
import Landing from "./Landing";

const socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");

// ── audio helpers ─────────────────────────────────────────────────────────────

function downsample(buffer, inRate, outRate) {
  if (outRate >= inRate) return buffer;
  const ratio = inRate / outRate;
  const newLen = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLen);
  let iResult = 0, iBuffer = 0;
  while (iResult < newLen) {
    const next = Math.round((iResult + 1) * ratio);
    let acc = 0, cnt = 0;
    for (let i = iBuffer; i < next && i < buffer.length; i++) { acc += buffer[i]; cnt++; }
    result[iResult] = cnt ? acc / cnt : 0;
    iResult++; iBuffer = next;
  }
  return result;
}

function floatTo16BitPCM(input) {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out.buffer;
}

// ── main page ─────────────────────────────────────────────────────────────────

function MainPage() {
  const [transcript, setTranscript] = useState([]);
  const [suggestion, setSuggestion] = useState("");
  const [listening, setListening] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const navigate = useNavigate();
  const feedRef = useRef(null);
  const audioRef = useRef({});

  // authenticate the socket with firebase token
  useEffect(() => {
    const sendAuth = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (token) socket.emit("authenticate", { token });
    };
    sendAuth();
  }, []);

  // transcript + suggestion listeners
  useEffect(() => {
    socket.on("live_transcript", (d) => setTranscript((p) => [...p, d]));
    socket.on("suggestion", (d) => setSuggestion(d.text));
    return () => {
      socket.off("live_transcript");
      socket.off("suggestion");
    };
  }, []);

  // auto scroll transcript
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [transcript]);

  // call timer — only runs while listening
  useEffect(() => {
    if (!listening) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [listening]);

  // start / stop browser mic capture when listening changes
  useEffect(() => {
    if (listening) {
      startCapture();
    } else {
      stopCapture();
    }
  }, [listening]);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(ctx.destination);
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const down = downsample(input, ctx.sampleRate, 16000);
        socket.emit("audio", floatTo16BitPCM(down));
      };
      socket.emit("start_stream", { language: "en-US" });
      audioRef.current = { ctx, stream, source, processor };
    } catch (e) {
      console.error("Mic error:", e);
      setListening(false);
    }
  };

  const stopCapture = () => {
    const a = audioRef.current;
    if (a.processor) a.processor.disconnect();
    if (a.source) a.source.disconnect();
    if (a.stream) a.stream.getTracks().forEach((t) => t.stop());
    if (a.ctx && a.ctx.state !== "closed") a.ctx.close();
    socket.emit("stop_stream");
    audioRef.current = {};
  };

  const resetCall = () => {
    stopCapture();
    setListening(false);
    setTranscript([]);
    setSuggestion("");
    setSeconds(0);
  };

  const lastClient = [...transcript].reverse().find((t) => t.speaker === 1);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{
      background: "#070708", minHeight: "100vh", color: "#fff",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap');
        @keyframes ring { 0% { transform: scale(1); opacity: .4; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .lnk { color: rgba(255,255,255,0.45); cursor: pointer; transition: color .2s; font-size: 13.5px; }
        .lnk:hover { color: #fff; }
        .feed::-webkit-scrollbar { width: 5px; }
        .feed::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 3px; }
      `}</style>

      {/* header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "26px 44px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="17" height="17" viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "0.26em" }}>VELA</span>
        </div>
        {listening && (
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontVariantNumeric: "tabular-nums" }}>
            On call · {mm}:{ss}
          </span>
        )}
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <span className="lnk" onClick={() => setShowTranscript((s) => !s)}>
            {showTranscript ? "Hide transcript" : "Transcript"}
          </span>
          <span className="lnk" onClick={() => navigate("/settings")}>Settings</span>
        </div>
      </header>

      {/* stage */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "0 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 660, width: "100%", textAlign: "left" }}>

          {/* client line */}
          {lastClient ? (
            <div key={lastClient.sentence} style={{ marginBottom: 26, animation: "fadeUp .4s ease" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Client</div>
              <div style={{ fontSize: 19, lineHeight: 1.55, color: "rgba(255,255,255,0.65)" }}>"{lastClient.sentence}"</div>
            </div>
          ) : (
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Client</div>
              <div style={{ fontSize: 19, lineHeight: 1.55, color: "rgba(255,255,255,0.22)" }}>
                {listening ? "Waiting for your client to speak…" : "Start the mic to begin the call."}
              </div>
            </div>
          )}

          {/* vela line */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff",
                opacity: listening ? 1 : 0.35, transition: "opacity .3s" }} />
              VELA says
            </div>
            <div key={suggestion} style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(24px, 3.2vw, 30px)", lineHeight: 1.45,
              color: suggestion ? "#fff" : "rgba(255,255,255,0.22)",
              minHeight: 130, letterSpacing: "-0.01em",
              animation: suggestion ? "fadeUp .45s ease" : "none",
            }}>
              {suggestion || "Your next line will appear here."}
            </div>
          </div>
        </div>
      </div>

      {/* mic control */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        paddingBottom: 44, position: "relative", zIndex: 2 }}>
        <div style={{ position: "relative", width: 74, height: 74, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {listening && <>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,0.14)", animation: "ring 2s ease-out infinite" }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,0.14)", animation: "ring 2s ease-out infinite 1s" }} />
          </>}
          <button
            onClick={() => setListening((l) => !l)}
            style={{
              width: 64, height: 64, borderRadius: "50%", border: listening ? "none" : "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer", background: listening ? "#fff" : "rgba(255,255,255,0.1)",
              boxShadow: listening ? "0 8px 28px rgba(255,255,255,0.18)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: listening ? "breathe 2.6s ease-in-out infinite" : "none",
              transition: "background .2s, box-shadow .2s", position: "relative", zIndex: 1,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke={listening ? "#070708" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" fill={listening ? "#070708" : "#fff"} stroke="none" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </button>
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: "rgba(255,255,255,0.4)", letterSpacing: "0.02em" }}>
          {listening ? "Listening — tap to pause" : "Tap to start"}
        </div>
        <button onClick={resetCall} className="lnk" style={{ marginTop: 16, background: "none", border: "none", fontFamily: "inherit" }}>
          New client
        </button>
      </div>

      {/* transcript panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width: 340,
        background: "rgba(7,7,8,0.94)", backdropFilter: "blur(20px)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        transform: showTranscript ? "translateX(0)" : "translateX(100%)",
        transition: "transform .32s cubic-bezier(.4,0,.2,1)",
        padding: "28px 24px", zIndex: 5, display: "flex", flexDirection: "column", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Transcript</span>
          <span className="lnk" style={{ fontSize: 12 }} onClick={() => setTranscript([])}>Clear</span>
        </div>
        <div ref={feedRef} className="feed" style={{ flex: 1, overflowY: "auto" }}>
          {transcript.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Nothing yet.</p>}
          {transcript.map((item, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{item.speaker === 0 ? "You" : "Client"}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.8)" }}>{item.sentence}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── app routes ────────────────────────────────────────────────────────────────

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<MainPage />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;