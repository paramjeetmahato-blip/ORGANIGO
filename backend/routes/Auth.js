const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const SignupOTP = require("../models/SignupOTP");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env file");
}

// =====================================
// COMMON HELPERS
// =====================================

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOTP = (otp) => {
  return crypto
    .createHmac("sha256", JWT_SECRET)
    .update(otp)
    .digest("hex");
};

const compareOTP = (otp, storedHash) => {
  const submittedHash = Buffer.from(hashOTP(otp), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  return (
    submittedHash.length === savedHash.length &&
    crypto.timingSafeEqual(submittedHash, savedHash)
  );
};

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const createVerificationToken = (user, purpose) => {
  return jwt.sign(
    {
      userId: user._id,
      phone: user.phone,
      purpose,
    },
    JWT_SECRET,
    { expiresIn: "5m" }
  );
};

const sendOTPResponse = (res, otp, message) => {
  const response = {
    success: true,
    message,
  };

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.OTP_DEV_MODE === "true"
  ) {
    response.devOtp = otp;
  }

  return res.json(response);
};

// =====================================
// CUSTOMER NAME VALIDATION
// =====================================

const validName = (name) => {
  if (typeof name !== "string") return false;

  const cleanName = name.trim().replace(/\s+/g, " ");

  if (cleanName.length < 3 || cleanName.length > 50) {
    return false;
  }

  // English और Hindi अक्षर स्वीकार होंगे
  // Numbers और गलत special characters स्वीकार नहीं होंगे
  const namePattern =
    /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

  if (!namePattern.test(cleanName)) {
    return false;
  }

  const blockedNames = [
    "demo",
    "test",
    "testing",
    "guest",
    "unknown",
  ];

  if (blockedNames.includes(cleanName.toLowerCase())) {
    return false;
  }

  return true;
};

const cleanName = (name) => {
  return name.trim().replace(/\s+/g, " ");
};

const validPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone || "");
};

const validOTP = (otp) => {
  return /^\d{6}$/.test(otp || "");
};

const clearOTP = (user) => {
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpPurpose = null;
  user.otpAttempts = 0;
};

// =====================================
// 1. CUSTOMER SIGNUP - REQUEST OTP
// =====================================

router.post("/request-signup-otp", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!validName(name)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid name. Name must contain 3 to 50 letters.",
      });
    }

    if (!validPhone(phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Valid phone and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Mobile number is already registered.",
      });
    }

    const existingOTP = await SignupOTP.findOne({ phone });

    if (
      existingOTP &&
      Date.now() - existingOTP.otpLastSentAt.getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = generateOTP();
    const passwordHash = await bcrypt.hash(password, 12);

    await SignupOTP.findOneAndUpdate(
      { phone },
      {
        name: cleanName(name),
        phone,
        email: email || undefined,
        passwordHash,
        otpHash: hashOTP(otp),
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        otpAttempts: 0,
        otpLastSentAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return sendOTPResponse(
      res,
      otp,
      "Signup OTP generated successfully."
    );

  } catch (error) {
    console.error("Signup OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate signup OTP.",
    });
  }
});

// =====================================
// 2. CUSTOMER SIGNUP - VERIFY OTP
// =====================================

router.post("/verify-signup-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!validPhone(phone) || !validOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number or OTP.",
      });
    }

    const pending = await SignupOTP.findOne({ phone });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Signup request not found. Please register again.",
      });
    }

    if (!validName(pending.name)) {
      await SignupOTP.deleteOne({ _id: pending._id });

      return res.status(400).json({
        success: false,
        message: "Invalid customer name. Please register again.",
      });
    }

    if (pending.otpExpiresAt < new Date()) {
      await SignupOTP.deleteOne({ _id: pending._id });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please register again.",
      });
    }

    if (pending.otpAttempts >= 5) {
      await SignupOTP.deleteOne({ _id: pending._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please register again.",
      });
    }

    if (!compareOTP(otp, pending.otpHash)) {
      pending.otpAttempts += 1;
      await pending.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      await SignupOTP.deleteOne({ _id: pending._id });

      return res.status(409).json({
        success: false,
        message: "Mobile number is already registered.",
      });
    }

    await User.create({
      name: cleanName(pending.name),
      phone: pending.phone,
      email: pending.email || undefined,
      password: pending.passwordHash,
      role: "customer",
    });

    await SignupOTP.deleteOne({ _id: pending._id });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please login.",
    });

  } catch (error) {
    console.error("Signup Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify signup OTP.",
    });
  }
});

// =====================================
// 3. CUSTOMER LOGIN - PASSWORD ONLY
// =====================================

router.post("/customer-login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!validPhone(phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Valid phone and password are required.",
      });
    }

    const user = await User.findOne({
      phone,
      role: "customer",
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or inactive account.",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Incorrect phone number or password.",
      });
    }

    return res.json({
      success: true,
      message: "Customer login successful!",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Customer Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
});

// =====================================
// 4. ADMIN / SUPER ADMIN - REQUEST OTP
// =====================================

router.post("/request-admin-login-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!validPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid mobile number.",
      });
    }

    const user = await User.findOne({
      phone,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found or inactive.",
      });
    }

    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = generateOTP();

    user.otpHash = hashOTP(otp);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    user.otpPurpose = "admin-login";
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();

    await user.save();

    return sendOTPResponse(
      res,
      otp,
      "Admin login OTP generated successfully."
    );

  } catch (error) {
    console.error("Admin Login OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate admin OTP.",
    });
  }
});

// =====================================
// 5. ADMIN / SUPER ADMIN - VERIFY OTP
// =====================================

router.post("/verify-admin-login-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!validPhone(phone) || !validOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number or OTP.",
      });
    }

    const user = await User.findOne({
      phone,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    if (
      user.otpPurpose !== "admin-login" ||
      !user.otpHash ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request a new OTP.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    if (!compareOTP(otp, user.otpHash)) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    clearOTP(user);
    await user.save();

    return res.json({
      success: true,
      message: "Admin mobile verified successfully.",
      verificationToken: createVerificationToken(
        user,
        "admin-login-verified"
      ),
    });

  } catch (error) {
    console.error("Admin OTP Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin OTP.",
    });
  }
});

// =====================================
// 6. ADMIN / SUPER ADMIN LOGIN
// =====================================

router.post("/admin-login", async (req, res) => {
  try {
    const { phone, password, verificationToken } = req.body;

    if (!validPhone(phone) || !password || !verificationToken) {
      return res.status(400).json({
        success: false,
        message: "Phone, password and OTP verification are required.",
      });
    }

    let verified;

    try {
      verified = jwt.verify(verificationToken, JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "OTP verification expired. Please verify again.",
      });
    }

    if (
      verified.purpose !== "admin-login-verified" ||
      verified.phone !== phone
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP verification.",
      });
    }

    const user = await User.findOne({
      _id: verified.userId,
      phone,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account unavailable.",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    return res.json({
      success: true,
      message: "Admin login successful!",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
});

// =====================================
// 7. RIDER LOGIN - PASSWORD ONLY
// =====================================

router.post("/rider-login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!validPhone(phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Valid phone and password are required.",
      });
    }

    const user = await User.findOne({
      phone,
      role: "rider",
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Rider account not found or inactive.",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    return res.json({
      success: true,
      message: "Rider login successful!",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Rider Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
});

// =====================================
// 8. CUSTOMER - REQUEST RESET OTP
// =====================================

router.post("/request-reset-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!validPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid mobile number.",
      });
    }

    const user = await User.findOne({
      phone,
      role: "customer",
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found.",
      });
    }

    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = generateOTP();

    user.otpHash = hashOTP(otp);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    user.otpPurpose = "reset-password";
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();

    await user.save();

    return sendOTPResponse(
      res,
      otp,
      "Customer password reset OTP generated."
    );

  } catch (error) {
    console.error("Customer Reset OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate reset OTP.",
    });
  }
});

// =====================================
// 9. ADMIN - REQUEST RESET OTP
// =====================================

router.post("/request-admin-reset-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!validPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid mobile number.",
      });
    }

    const user = await User.findOne({
      phone,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = generateOTP();

    user.otpHash = hashOTP(otp);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    user.otpPurpose = "reset-password";
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();

    await user.save();

    return sendOTPResponse(
      res,
      otp,
      "Admin password reset OTP generated."
    );

  } catch (error) {
    console.error("Admin Reset OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate admin reset OTP.",
    });
  }
});

// =====================================
// 10. CUSTOMER / ADMIN PASSWORD RESET
// =====================================

const resetPassword = async (req, res, allowedRoles) => {
  try {
    const {
      phone,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!validPhone(phone) || !validOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number or OTP.",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const user = await User.findOne({
      phone,
      role: { $in: allowedRoles },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (
      user.otpPurpose !== "reset-password" ||
      !user.otpHash ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request a new OTP.",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    if (!compareOTP(otp, user.otpHash)) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();

    clearOTP(user);

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully. Please login.",
    });

  } catch (error) {
    console.error("Password Reset Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
};

// Customer password reset
router.post("/reset-password", (req, res) => {
  return resetPassword(req, res, ["customer"]);
});

// Admin and Super Admin password reset
router.post("/admin-reset-password", (req, res) => {
  return resetPassword(req, res, ["admin", "superadmin"]);
});

// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;