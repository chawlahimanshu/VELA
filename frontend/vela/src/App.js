import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [transcript, setTranscript] = useState([])
  const [suggestion, setSuggestion] = useState("")
  const resetCall = () => {
  setTranscript([])
  setSuggestion("")
}

  useEffect(() => {
    socket.on("live_transcript", (data) => {
      setTranscript(prev => [...prev, data])
    })
    socket.on("suggestion", (data) => {
      setSuggestion(data.text)
    })

    return () => {
      socket.off("live_transcript")
      socket.off("suggestion")
    }
  }, [])

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#1a1a2e" }}>VELA</h1>
      <p style={{ textAlign: "center", color: "#666" }}>Voice Enabled Life Agent</p>

      <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>

        <div style={{ flex: 1 }}>
          <h3>Live Transcript</h3>
          <div style={{ height: "400px", overflowY: "auto", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
            {transcript.map((item, index) => (
              <p key={index} style={{ color: item.speaker === 0 ? "#1a1a2e" : "#e63946" }}>
                <strong>{item.speaker === 0 ? "Agent" : "Client"}:</strong> {item.sentence}
              </p>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3>VELA Suggests</h3>
          <div style={{ height: "400px", padding: "15px", backgroundColor: "#f0f4ff", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px", lineHeight: "1.6" }}>
            {suggestion || "VELA will suggest responses here as the client speaks..."}
          </div>
          <button onClick={resetCall} style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#e63946", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            New Client
          </button>
        </div>

      </div>
    </div>
  )
}

export default App;