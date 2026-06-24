import { useState } from "react";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from "./FireBase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    try {
      await doSignInWithEmailAndPassword(email, password)
      navigate('/')
    } catch (err) {
      setError("Invalid email or password")
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await doSignInWithGoogle()
      navigate('/')
    } catch (err) {
      setError("Google sign in failed")
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "40px", fontFamily: "sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", borderRadius: "12px" }}>
      <h1 style={{ textAlign: "center", color: "#1a1a2e" }}>VELA</h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>Voice Engine for Live Insurance Agent</p>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" }}
        />
        <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}>
          Login
        </button>
      </form>

      <div style={{ textAlign: "center", margin: "20px 0", color: "#666" }}>or</div>

      <button onClick={handleGoogleLogin} style={{ width: "100%", padding: "12px", backgroundColor: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}>
        Sign in with Google
      </button>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={() => window.location.href = "http://localhost:5000/oauth/login"} style={{ width: "100%", padding: "12px", backgroundColor: "#0070d2", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", marginTop: "10px" }}>
          Login with Salesforce
        </button>
      </div>
    </div>
  )
}

export default Login;