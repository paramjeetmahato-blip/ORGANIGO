import { useState } from "react";
import { saveSession, clearSession } from "../utils/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Auth.css";

const API_URL = "http://localhost:5000/api/auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState("login");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const cleanPhone = phone.replace(/\D/g, "");

  // =====================================
  // CUSTOMER LOGIN
  // =====================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/customer-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      if (data.user?.role !== "customer") {
        setMessage("Customer account required.");
        return;
      }

     clearSession();
saveSession(data.token, data.user);
      setMessage("Login successful!");

      const redirectPath = location.state?.from || "/";

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 700);

    } catch (error) {
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // REQUEST RESET OTP
  // =====================================

  const requestResetOTP = async (e) => {
    e.preventDefault();

    setMessage("");
    setDevOtp("");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/request-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to send OTP.");
        return;
      }

      setStep("reset");
      setMessage(data.message || "Reset OTP sent successfully.");

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

    } catch (error) {
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // RESET PASSWORD
  // =====================================

  const resetPassword = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: cleanPhone,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Password reset failed.");
        return;
      }

      setStep("login");

      setOtp("");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDevOtp("");

      setMessage("Password changed successfully. Please login.");

    } catch (error) {
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // BACK TO LOGIN
  // =====================================

  const backToLogin = () => {
    setStep("login");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setDevOtp("");
    setMessage("");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h1>ORGANIGO</h1>
        <p>Eat Healthy. Live Fresh.</p>

        {/* LOGIN */}

        {step === "login" && (
          <>
            <h2>Welcome Back!</h2>
            <p>Login to continue shopping.</p>

            <form onSubmit={handleLogin}>

              <label>Mobile Number</label>

              <div className="phone-input-wrapper">
                <span>+91</span>

                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  maxLength={10}
                  required
                />
              </div>

              <label>Password</label>

              <div className="password-input-wrapper">
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

              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>

            </form>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                setStep("forgot");
                setMessage("");
              }}
            >
              Forgot Password?
            </button>

            <p>
              Don't have an account?{" "}
              <Link to="/signup">Create Account</Link>
            </p>
          </>
        )}

        {/* FORGOT PASSWORD */}

        {step === "forgot" && (
          <>
            <h2>Forgot Password?</h2>
            <p>Enter your registered mobile number.</p>

            <form onSubmit={requestResetOTP}>
              <label>Mobile Number</label>

              <div className="phone-input-wrapper">
                <span>+91</span>

                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  maxLength={10}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Send Reset OTP"}
              </button>
            </form>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={backToLogin}
            >
              Back to Login
            </button>
          </>
        )}

        {/* RESET PASSWORD */}

        {step === "reset" && (
          <>
            <h2>Reset Password</h2>
            <p>Enter OTP sent to +91 {cleanPhone}</p>

            <form onSubmit={resetPassword}>

              <label>6-Digit OTP</label>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                maxLength={6}
                required
              />

              {devOtp && (
                <p className="dev-otp">
                  Development OTP: <strong>{devOtp}</strong>
                </p>
              )}

              <label>New Password</label>

              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label>Confirm New Password</label>

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </button>

            </form>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={backToLogin}
            >
              Back to Login
            </button>
          </>
        )}

        {/* MESSAGE */}

        {message && (
          <p className="auth-message">{message}</p>
        )}

        <Link to="/">Back to Home</Link>

      </div>
    </div>
  );
}

export default Login;