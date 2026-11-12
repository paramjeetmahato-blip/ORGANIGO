import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Auth.css";

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || "/";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }

      localStorage.setItem("organigoToken", data.token);
      localStorage.setItem(
        "organigoUser",
        JSON.stringify(data.user)
      );

      setMessage("Account created successfully!");

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

        <h2>Create Account</h2>
        <p>Join ORGANIGO and enjoy fresh groceries.</p>

        <form onSubmit={handleSignup}>

          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Mobile Number</label>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength="10"
            required
          />

          <label>Email (Optional)</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create password (minimum 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        {message && <p>{message}</p>}

        <p>
          Already have an account?{" "}
          <Link
            to="/login"
            state={{ from: redirectPath }}
          >
            Login
          </Link>
        </p>

        <Link to="/">Back to Home</Link>

      </div>
    </div>
  );
}

export default Signup;