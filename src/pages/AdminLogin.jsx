import API_BASE_URL from "../services/api";
import { useState } from "react";
import { saveSession } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const API_URL = `${API_BASE_URL}/api/auth`;

function AdminLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  const [step, setStep] = useState("phone");
  const [message, setMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const cleanPhone = phone.replace(/\D/g, "");

  // STEP 1: REQUEST OTP
  const requestOTP = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setMessage("Enter valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/request-admin-login-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "OTP request failed.");
        return;
      }

      setDevOtp(data.devOtp || "");
      setStep("otp");
      setMessage(data.message);

    } catch (error) {
      setMessage("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Enter valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-admin-login-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleanPhone,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "OTP verification failed.");
        return;
      }

      setVerificationToken(data.verificationToken);
      setStep("password");
      setMessage("OTP verified successfully!");

    } catch (error) {
      setMessage("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: ADMIN LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          password,
          verificationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Admin login failed.");
        return;
      }

      if (!["admin", "superadmin"].includes(data.user?.role)) {
        setMessage("Admin account required.");
        return;
      }

      saveSession(data.token, data.user);

      setMessage("Admin Login Successful!");

      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 700);

    } catch (error) {
      setMessage("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organigo-login-page">

      {/* BACKGROUND DECORATION */}
      <div className="login-decoration login-decoration-one"></div>
      <div className="login-decoration login-decoration-two"></div>

      <div className="login-main-card">

        {/* LEFT BRANDING PANEL */}
        <div className="login-brand-panel">

          <Link to="/" className="login-brand-logo">
            <span className="brand-icon">🌿</span>
            <span>ORGANIGO</span>
          </Link>

          <div className="brand-content">

            <span className="brand-small-label">
              MANAGEMENT PORTAL
            </span>

            <h1>
              Manage your
              <br />
              business with
              <br />
              <span>confidence.</span>
            </h1>

            <p>
              Welcome to your ORGANIGO control center.
              Manage products, orders, customers and
              delivery operations from one place.
            </p>

            <div className="brand-features">

              <div className="brand-feature">
                <span>✓</span>
                Secure Admin Access
              </div>

              <div className="brand-feature">
                <span>✓</span>
                Smart Business Management
              </div>

              <div className="brand-feature">
                <span>✓</span>
                Real-time Operations
              </div>

            </div>

          </div>

          <div className="brand-footer">
            <span>GROW SMART. DELIVER FRESH.</span>
            <span>© 2026 ORGANIGO</span>
          </div>

        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="login-form-panel">

          <div className="login-mobile-logo">
            <span>🌿</span>
            ORGANIGO
          </div>

          <div className="login-form-content">

            <div className="login-security-badge">
              <span className="security-dot"></span>
              SECURE ADMIN PORTAL
            </div>

            <h2>
              {step === "phone" && "Welcome back!"}
              {step === "otp" && "Verify your number"}
              {step === "password" && "Almost there!"}
            </h2>

            <p className="login-description">
              {step === "phone" &&
                "Sign in to access your admin dashboard."}

              {step === "otp" &&
                "Enter the verification code sent to your mobile."}

              {step === "password" &&
                "Your number is verified. Enter your password."}
            </p>

            {/* STEP INDICATOR */}
            <div className="login-progress">

              <div className={`progress-step ${step === "phone" || step === "otp" || step === "password" ? "active" : ""}`}>
                <span>1</span>
                <small>Mobile</small>
              </div>

              <div className={`progress-line ${step !== "phone" ? "completed" : ""}`}></div>

              <div className={`progress-step ${step === "otp" || step === "password" ? "active" : ""}`}>
                <span>2</span>
                <small>Verify</small>
              </div>

              <div className={`progress-line ${step === "password" ? "completed" : ""}`}></div>

              <div className={`progress-step ${step === "password" ? "active" : ""}`}>
                <span>3</span>
                <small>Login</small>
              </div>

            </div>

            {/* PHONE STEP */}
            {step === "phone" && (

              <form onSubmit={requestOTP} className="login-form">

                <label>Mobile Number</label>

                <div className="login-input-wrapper">

                  <span className="country-code">🇮🇳 +91</span>

                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Continue with OTP"}
                  {!loading && <span>→</span>}
                </button>

              </form>

            )}

            {/* OTP STEP */}
            {step === "otp" && (

              <form onSubmit={verifyOTP} className="login-form">

                <label>6-Digit Verification Code</label>

                <div className="login-input-wrapper otp-input-wrapper">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    required
                  />
                </div>

                <p className="otp-phone-text">
                  Verification for +91 {cleanPhone}
                </p>

                {devOtp && (
                  <div className="dev-otp-box">
                    Development OTP: <strong>{devOtp}</strong>
                  </div>
                )}

                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                  {!loading && <span>→</span>}
                </button>

                <button
                  type="button"
                  className="login-back-btn"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setDevOtp("");
                    setMessage("");
                  }}
                >
                  ← Change mobile number
                </button>

              </form>

            )}

            {/* PASSWORD STEP */}
            {step === "password" && (

              <form onSubmit={handleLogin} className="login-form">

                <label>Admin Password</label>

                <div className="login-input-wrapper">

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                <button
                  type="submit"
                  className="login-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login to Dashboard"}
                  {!loading && <span>→</span>}
                </button>

                <button
                  type="button"
                  className="login-back-btn"
                  onClick={() => {
                    setStep("phone");
                    setPassword("");
                    setOtp("");
                    setVerificationToken("");
                    setMessage("");
                  }}
                >
                  ← Start again
                </button>

              </form>

            )}

            {message && (
              <div className={`auth-message ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("valid") || message.toLowerCase().includes("required") ? "error" : "success"}`}>
                {message}
              </div>
            )}

          </div>

          <div className="login-bottom">

            <div className="login-protected">
              <span>🔒</span>
              Protected Admin Access
            </div>

            <Link to="/" className="login-back-website">
              ← Back to Website
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminLogin;