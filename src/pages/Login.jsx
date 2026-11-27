import API_BASE_URL from "../services/api";
import { useEffect, useState } from "react";
import { saveSession, clearSession } from "../utils/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/CustomerAuth.css";

import Home from "./Home";
import Header from "../components/Header";

const API_URL = `${API_BASE_URL}/api/auth`;
const PRODUCT_API = `${API_BASE_URL}/api/products`;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // =====================================
  // STATES
  // =====================================

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");

  const [step, setStep] = useState("login");
  const [verificationToken, setVerificationToken] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [devOtp, setDevOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const [animationProducts, setAnimationProducts] = useState([]);

  const cleanPhone = phone.replace(/\D/g, "");

  // =====================================
  // FETCH PRODUCTS FOR MOBILE ANIMATION
  // =====================================

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

  // =====================================
  // OTP RESEND TIMER
  // =====================================

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setTimeout(() => {
      setResendTimer((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendTimer]);

  // =====================================
  // PRODUCT ANIMATION ROW
  // =====================================

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

  // =====================================
  // FINISH CUSTOMER LOGIN
  // =====================================

  const finishLogin = (data) => {
    if (!data.token || data.user?.role !== "customer") {
      setMessage("Customer authentication failed.");
      return;
    }

    clearSession();
    saveSession(data.token, data.user);

    window.dispatchEvent(new Event("organigoAuthChanged"));

    setMessage("Login successful!");

    const redirectPath = location.state?.from || "/";

    setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 700);
  };

  // =====================================
  // STEP 1: REQUEST OTP
  // =====================================

  const handleContinue = async (e) => {
    e.preventDefault();

    setMessage("");
    setDevOtp("");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/request-customer-login-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: cleanPhone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to send OTP.");
        return;
      }

      setStep("otp");
      setOtp("");
      setResendTimer(60);

      setMessage(data.message || "OTP sent successfully.");

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
    } catch (error) {
      console.error("Customer OTP Request Error:", error);
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // STEP 2: VERIFY OTP
  // =====================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/verify-customer-login-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

      // EXISTING CUSTOMER
      if (!data.isNewCustomer) {
        finishLogin(data);
        return;
      }

      // NEW CUSTOMER
      if (data.isNewCustomer && data.verificationToken) {
        setVerificationToken(data.verificationToken);
        setStep("profile");
        setMessage("Mobile number verified successfully!");
        return;
      }

      setMessage("Unable to verify customer account.");
    } catch (error) {
      console.error("OTP Verification Error:", error);
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // STEP 3: COMPLETE CUSTOMER PROFILE
  // =====================================

  const handleCompleteProfile = async (e) => {
    e.preventDefault();

    setMessage("");

    const cleanName = name.trim().replace(/\s+/g, " ");

    if (cleanName.length < 3 || cleanName.length > 50) {
      setMessage("Please enter a name between 3 and 50 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/complete-customer-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cleanName,
            verificationToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to create account.");
        return;
      }

      finishLogin(data);
    } catch (error) {
      console.error("Customer Profile Error:", error);
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // RESEND OTP
  // =====================================

  const resendOTP = async () => {
    if (resendTimer > 0 || loading) return;

    setMessage("");
    setDevOtp("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/request-customer-login-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: cleanPhone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to resend OTP.");
        return;
      }

      setOtp("");
      setResendTimer(60);

      setMessage("A new OTP has been sent.");

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // BACK TO PHONE
  // =====================================

  const backToPhone = () => {
    setStep("login");
    setOtp("");
    setDevOtp("");
    setVerificationToken("");
    setResendTimer(0);
    setMessage("");
  };

  // =====================================
  // BACK TO LOGIN
  // =====================================

  const backToLogin = () => {
    setStep("login");
    setPhone("");
    setOtp("");
    setName("");
    setDevOtp("");
    setVerificationToken("");
    setResendTimer(0);
    setMessage("");
  };

  // =====================================
  // MAIN UI
  // =====================================

  return (
    <div className="auth-page">

      {/* DESKTOP BACKGROUND */}

      <div className="auth-desktop-background">
        <Header />
        <Home />
      </div>

      {/* DARK BACKDROP */}

      <div className="auth-backdrop"></div>

      {/* LOGIN CONTAINER */}

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

          {/* BACK BUTTON */}

          <button
            type="button"
            className="auth-back-button"
            onClick={() => {
              if (step === "login") {
                navigate("/");
              } else if (step === "profile") {
                backToPhone();
              } else {
                backToLogin();
              }
            }}
          >
            ←
          </button>

          {/* BRAND */}

          <div className="auth-brand">
            <img src="/organigo_logo.svg" alt="ORGANIGO" />
          </div>

          {/* =====================================
              STEP 1: PHONE NUMBER
          ===================================== */}

          {step === "login" && (
            <>
              <h2>India's Fresh Grocery App</h2>

              <p className="auth-subtitle">
                Log in or Sign up
              </p>

              <form onSubmit={handleContinue}>
                <div className="phone-input-wrapper">
                  <span>+91</span>

                  <input
                    id="login-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
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
                  {loading ? "Sending OTP..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* =====================================
              STEP 2: OTP VERIFICATION
          ===================================== */}

          {step === "otp" && (
            <>
              <h2>Verify Mobile Number</h2>

              <p className="auth-subtitle">
                Enter the 6-digit OTP sent to
              </p>

              <div className="auth-phone-display">
                <span>+91 {cleanPhone}</span>

                <button type="button" onClick={backToPhone}>
                  Change
                </button>
              </div>

              <form onSubmit={handleVerifyOTP}>
                <label htmlFor="login-otp">6-Digit OTP</label>

                <input
                  id="login-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                    setMessage("");
                  }}
                  maxLength={6}
                  required
                />

                {devOtp && (
                  <p className="dev-otp">
                    Development OTP: <strong>{devOtp}</strong>
                  </p>
                )}

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <div className="auth-resend-section">
                {resendTimer > 0 ? (
                  <p>
                    Resend OTP in <strong>{resendTimer}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={resendOTP}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {/* =====================================
              STEP 3: NEW CUSTOMER PROFILE
          ===================================== */}

          {step === "profile" && (
            <>
              <h2>Welcome to ORGANIGO!</h2>

              <p className="auth-subtitle">
                Let's create your account.
              </p>

              <div className="auth-phone-display">
                <span>+91 {cleanPhone}</span>
                <span>✓ Verified</span>
              </div>

              <form onSubmit={handleCompleteProfile}>
                <label htmlFor="customer-name">Your Name</label>

                <input
                  id="customer-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setMessage("");
                  }}
                  maxLength={50}
                  required
                />

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <p className="auth-subtitle">
                Your mobile number is your login ID.
              </p>
            </>
          )}

          {/* MESSAGE */}

          {message && (
            <p
              className="auth-message"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          {/* TERMS */}

          <div className="auth-terms">
            By continuing, you agree to our{" "}

            <Link to="/about">
              Terms of Service
            </Link>

            {" & "}

            <Link to="/about">
              Privacy Policy
            </Link>.
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;