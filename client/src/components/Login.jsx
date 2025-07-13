import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/login", { username, password });
      localStorage.setItem("token", res.data.token);
      alert("Login successful!");
      navigate("/chat");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h2 style={styles.heading}>Login</h2>

        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} onClick={handleLogin}>
          Login
        </button>

        <p style={styles.linkText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

// ✅ Inline CSS Styles
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8f9fa",
  },
  formBox: {
    width: "100%",
    maxWidth: "360px",
    padding: "2rem",
    borderRadius: "8px",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  heading: {
    marginBottom: "1.5rem",
    color: "#343a40",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    margin: "0.5rem 0",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    fontSize: "1rem",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    marginTop: "1rem",
    backgroundColor: "#228be6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
  },
  linkText: {
    marginTop: "1rem",
    fontSize: "0.95rem",
    color: "#495057",
  },
  link: {
    color: "#228be6",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
