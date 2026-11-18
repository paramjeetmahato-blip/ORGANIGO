import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://10.124.82.244:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      // Check Admin Role
      if (data.user?.role !== "admin") {
        setMessage("Access Denied! Admin account required.");
        return;
      }

      // Save Admin Login
      localStorage.setItem("organigoToken", data.token);
      localStorage.setItem(
        "organigoUser",
        JSON.stringify(data.user)
      );

      setMessage("Admin Login Successful!");

      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 800);

    } catch (error) {
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h1>ORGANIGO</h1>
        <p>Admin Control Panel</p>

        <h2>Admin Login</h2>
        <p>Login to manage ORGANIGO.</p>

        <form onSubmit={handleLogin}>

          <label>Mobile Number</label>

          <input
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength="10"
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Admin Login"}
          </button>

        </form>

        {message && <p>{message}</p>}

        <Link to="/">Back to Website</Link>

      </div>
    </div>
  );
}

export default AdminLogin;