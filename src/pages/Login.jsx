import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

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
        "http://localhost:5000/api/auth/login",
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

      localStorage.setItem("organigoToken", data.token);
      localStorage.setItem(
        "organigoUser",
        JSON.stringify(data.user)
      );

      setMessage("Login successful!");

      const redirectPath = location.state?.from || "/";

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
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
        <p>Eat Healthy. Live Fresh.</p>

        <h2>Welcome Back!</h2>
        <p>Login to continue shopping.</p>

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
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {message && <p>{message}</p>}

        <p>
          Don't have an account?{" "}
          <Link to="/signup">Create Account</Link>
        </p>

        <Link to="/">Back to Home</Link>

      </div>
    </div>
  );
}

export default Login;