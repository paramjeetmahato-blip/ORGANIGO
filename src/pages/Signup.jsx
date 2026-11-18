import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Auth.css";

const API_URL = "http://localhost:5000/api/auth";

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || "/";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================
  // SEND SIGNUP OTP
  // =====================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/request-signup-otp`,
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
        setMessage(data.message || "Unable to send OTP.");
        return;
      }

      setOtpSent(true);

      if (data.devOtp) {
        setMessage(`Development OTP: ${data.devOtp}`);
      } else {
        setMessage("OTP sent successfully. Please check your mobile.");
      }

    } catch (error) {
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // VERIFY SIGNUP OTP
  // =====================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-signup-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "OTP verification failed.");
        return;
      }

      setMessage("Account created successfully!");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            from: redirectPath,
            registered: true,
          },
        });
      }, 1000);

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

        <p>
          {otpSent
            ? "Verify your mobile number to create your account."
            : "Join ORGANIGO and enjoy fresh groceries."}
        </p>

        {!otpSent ? (

          <form onSubmit={handleSendOTP}>

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
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              maxLength={10}
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

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create password (minimum 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

          </form>

        ) : (

          <form onSubmit={handleVerifyOTP}>

            <label>Mobile Number</label>

            <input
              type="tel"
              value={phone}
              disabled
            />

            <label>Enter OTP</label>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP & Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setMessage("");
              }}
              disabled={loading}
            >
              Change Details
            </button>

          </form>

        )}

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

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