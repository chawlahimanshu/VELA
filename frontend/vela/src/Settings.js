  const handleLogin = () => {
  window.location.href = "http://localhost:5000/oauth/login"
}

function Settings() {
    return (
        <div>
            <h2>Settings</h2>
            <button onClick={handleLogin}>
              Login with Salesforce
            </button>

        </div>
    )
}

export default Settings;
