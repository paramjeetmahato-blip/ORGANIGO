import API_BASE_URL from "../services/api";
import { useEffect, useState } from "react";
import { saveSession, clearSession } from "../utils/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Auth.css";
import Home from "./Home";
import Header from "../components/Header";

const API_URL = `${API_BASE_URL}/api/auth`;
const PRODUCT_API = `${API_BASE_URL}/api/products`;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState("login");
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");

  const [animationProducts, setAnimationProducts] = useState([]);

  const cleanPhone = phone.replace(/\D/g, "");

  // FETCH REAL PRODUCTS
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const response = await fetch(PRODUCT_API);

        if (!response.ok) {
          throw new Error("Products could not be loaded");
        }

        const data = await response.json();

        const productList = Array.isArray(data)
          ? data
          : data.products || data.data || [];

        const availableProducts = productList.filter(
          (product) =>
            product.image &&
            typeof product.image === "string" &&
            Number(product.stock ?? 1) > 0
        );

        if (isMounted) {
          setAnimationProducts(availableProducts);
        }
      } catch (error) {
        console.error("Login product animation error:", error);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // PRODUCT ANIMATION
  const renderProductRow = (reverse = false) => {
    if (!animationProducts.length) return null;

    const items = [
      ...animationProducts,
      ...animationProducts,
      ...animationProducts,
    ];

    return (
      <div className={`auth-product-track ${reverse ? "reverse" : ""}`}>
        {items.map((product, index) => (
          <div
            className="auth-product-item"
            key={`${product._id || product.name}-${index}`}
          >
            <img
              src={product.image}
              alt={product.name || "Grocery product"}
              loading={index < 6 ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => {
                e.currentTarget.parentElement.style.display = "none";
              }}
            />
            <span>{product.name}</span>
          </div>
        ))}
      </div>
    );
  };

  // CONTINUE WITH PHONE
  const handleContinue = (e) => {
    e.preventDefault();
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setShowPasswordStep(true);
  };

  // CUSTOMER LOGIN
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

  // REQUEST RESET OTP
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

  // RESET PASSWORD
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
      setShowPasswordStep(false);

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

  // BACK TO LOGIN
  const backToLogin = () => {
    setStep("login");
    setShowPasswordStep(false);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setDevOtp("");
    setMessage("");
  };

  // BACK TO PHONE
  const backToPhone = () => {
    setShowPasswordStep(false);
    setPassword("");
    setMessage("");
  };

  return (
    <div className="auth-page">

      {/* DESKTOP HOME BACKGROUND */}
    <div className="auth-desktop-background">
  <Header />
  <Home />
</div>

      {/* LOGIN OVERLAY */}
      <div className="auth-container">

        {/* MOBILE PRODUCT ANIMATION */}
        {animationProducts.length > 0 && (
          <div className="auth-mobile-showcase">
            <div className="auth-animation-row">
              {renderProductRow(false)}
            </div>

            <div className="auth-animation-row">
              {renderProductRow(true)}
            </div>

            <div className="auth-animation-row">
              {renderProductRow(false)}
            </div>

            <div className="auth-animation-row">
              {renderProductRow(true)}
            </div>
          </div>
        )}

        {/* LOGIN CARD */}
        <div className="auth-card">

          <button
            type="button"
            className="auth-back-button"
            onClick={() => {
              if (step !== "login") {
                backToLogin();
              } else if (showPasswordStep) {
                backToPhone();
              } else {
                navigate("/");
              }
            }}
          >
            ←
          </button>

          <div className="auth-brand">
            <img src="/organigo-logo.png" alt="ORGANIGO" />
          </div>

          {/* LOGIN */}
          {step === "login" && (
            <>
              <h2>
                {showPasswordStep
                  ? "Welcome Back!"
                  : "India's Fresh Grocery App"}
              </h2>

              <p className="auth-subtitle">
                {showPasswordStep
                  ? "Enter your password to continue"
                  : "Log in or Sign up"}
              </p>

              {!showPasswordStep ? (
                <form onSubmit={handleContinue}>
                  <div className="phone-input-wrapper">
                    <span>+91</span>

                    <input
                      id="login-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => {
                        setPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        );
                        setMessage("");
                      }}
                      maxLength={10}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="auth-primary-button"
                    disabled={loading}
                  >
                    Continue
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin}>
                  <div className="auth-phone-display">
                    <span>+91 {cleanPhone}</span>
                    <button type="button" onClick={backToPhone}>
                      Change
                    </button>
                  </div>

                  <label>Password</label>

                  <div className="password-input-wrapper">
                    <input
                      id="login-password"
                      name="password"
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

                  <button
                    type="submit"
                    className="auth-primary-button"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>

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
                </form>
              )}

              {!showPasswordStep && (
                <p className="auth-create-account">
                  Don't have an account?{" "}
                  <Link to="/signup">Create Account</Link>
                </p>
              )}
            </>
          )}

          {/* FORGOT PASSWORD */}
          {step === "forgot" && (
            <>
              <h2>Forgot Password?</h2>

              <p className="auth-subtitle">
                Enter your registered mobile number.
              </p>

              <form onSubmit={requestResetOTP}>
                <div className="phone-input-wrapper">
                  <span>+91</span>

                  <input
                    id="forgot-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter mobile number"
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

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
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

              <p className="auth-subtitle">
                Enter OTP sent to +91 {cleanPhone}
              </p>

              <form onSubmit={resetPassword}>
                <label>6-Digit OTP</label>

                <input
                  id="reset-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
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
                    id="new-password"
                    name="newPassword"
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
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
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
          {message && <p className="auth-message">{message}</p>}

          {/* TERMS */}
          <div className="auth-terms">
            By continuing, you agree to our{" "}
            <Link to="/about">Terms of Service</Link>
            {" & "}
            <Link to="/about">Privacy Policy</Link>.
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;