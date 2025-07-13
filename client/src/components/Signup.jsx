import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault(); // prevent page refresh
    try {
      const res = await API.post("/signup", { username, password });
      localStorage.setItem("token", res.data.token);
      alert("Signup successful!");
      navigate("/chat");
    } catch (err) {
      console.error("Signup failed:", err);
      alert("Signup failed!");
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSignup}>
        <h2>Sign Up</h2>

        <label style={styles.label}>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          required
        />

        <label style={styles.label}>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>Sign Up</button>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f1f1f1"
  },
  form: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "300px"
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    marginTop: "1rem"
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    fontSize: "1rem"
  },
  button: {
    marginTop: "1.5rem",
    width: "100%",
    padding: "0.7rem",
    background: "#007bff",
    color: "#fff",
    border: "none",
    fontSize: "1rem",
    borderRadius: "5px",
    cursor: "pointer"
  }
};
