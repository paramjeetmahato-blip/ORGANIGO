import { useState } from "react";
import { saveSession } from "../utils/auth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

const API_URL = "http://localhost:5000/api/auth";

function AdminLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
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

      // SAVE ADMIN SESSION IN CURRENT TAB ONLY
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
    <div className="auth-container">
      <div className="auth-card">

        <h1>ORGANIGO</h1>
        <p>Admin Control Panel</p>

        {step === "phone" && (
          <>
            <h2>Admin Login</h2>
            <p>Enter your registered mobile number.</p>

            <form onSubmit={requestOTP}>
              <label>Mobile Number</label>

              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <h2>Verify OTP</h2>
            <p>OTP verification for +91 {cleanPhone}</p>

            {devOtp && (
              <p>
                Development OTP: <strong>{devOtp}</strong>
              </p>
            )}

            <form onSubmit={verifyOTP}>
              <label>6-Digit OTP</label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          </>
        )}

        {step === "password" && (
          <>
            <h2>Enter Password</h2>
            <p>OTP verified. Now enter your admin password.</p>

            <form onSubmit={handleLogin}>
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login to Dashboard"}
              </button>
            </form>
          </>
        )}

        {message && <p className="auth-message">{message}</p>}

        <Link to="/">Back to Website</Link>

      </div>
    </div>
  );
}

export default AdminLogin;