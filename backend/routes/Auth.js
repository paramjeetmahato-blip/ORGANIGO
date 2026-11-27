const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { rateLimit } = require("express-rate-limit");

const User = require("../models/User");
const SignupOTP = require("../models/SignupOTP");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
throw new Error("JWT_SECRET is missing in .env file");
}

// =====================================
// 1. AUTHENTICATION RATE LIMITERS
// =====================================

const signupLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
limit: 3,
standardHeaders: "draft-8",
legacyHeaders: false,
message: {
success: false,
message: "Too many signup requests. Try again after 15 minutes.",
},
});

const otpVerifyLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
limit: 10,
standardHeaders: "draft-8",
legacyHeaders: false,
message: {
success: false,
message: "Too many OTP verification attempts. Try again later.",
},
});

const loginLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
limit: 10,
standardHeaders: "draft-8",
legacyHeaders: false,
message: {
success: false,
message: "Too many login attempts. Try again later.",
},
});

const otpRequestLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
limit: 3,
standardHeaders: "draft-8",
legacyHeaders: false,
message: {
success: false,
message: "Too many OTP requests. Try again later.",
},
});

const passwordResetLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
limit: 5,
standardHeaders: "draft-8",
legacyHeaders: false,
message: {
success: false,
message: "Too many password reset attempts. Try again later.",
},
});

// =====================================
// 2. COMMON HELPERS
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

// New customer profile verification token
const createCustomerProfileToken = (phone) => {
return jwt.sign(
{
phone,
purpose: "customer-profile-setup",
},
JWT_SECRET,
{ expiresIn: "10m" }
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
// 3. VALIDATION HELPERS
// =====================================

const validName = (name) => {
if (typeof name !== "string") return false;

const clean = name.trim().replace(/\s+/g, " ");

if (clean.length < 3 || clean.length > 50) {
return false;
}

const namePattern =
/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

if (!namePattern.test(clean)) {
return false;
}

const blockedNames = [
"demo",
"test",
"testing",
"guest",
"unknown",
];

return !blockedNames.includes(clean.toLowerCase());
};

const cleanName = (name) => {
return name.trim().replace(/\s+/g, " ");
};

const validPhone = (phone) => {
return typeof phone === "string" && /^[6-9]\d{9}$/.test(phone);
};

const validOTP = (otp) => {
return typeof otp === "string" && /^\d{6}$/.test(otp);
};

const clearOTP = (user) => {
user.otpHash = null;
user.otpExpiresAt = null;
user.otpPurpose = null;
user.otpAttempts = 0;
};

// =====================================
// 4. CUSTOMER SIGNUP - REQUEST OTP
// =====================================

router.post(
"/request-signup-otp",
signupLimiter,
async (req, res) => {
try {
const { name, phone, email, password } = req.body;

  if (!validName(name)) {
    return res.status(400).json({
      success: false,
      message:
        "Please enter a valid name. Name must contain 3 to 50 letters.",
    });
  }

  if (!validPhone(phone) || typeof password !== "string" || !password) {
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

  const existingOTP = await SignupOTP.findOne({
    phone,
    purpose: "signup",
  });

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
      purpose: "signup",
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

}
);

// =====================================
// 5. CUSTOMER SIGNUP - VERIFY OTP
// =====================================

router.post(
"/verify-signup-otp",
otpVerifyLimiter,
async (req, res) => {
try {
const { phone, otp } = req.body;

  if (!validPhone(phone) || !validOTP(otp)) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number or OTP.",
    });
  }

  const pending = await SignupOTP.findOne({
    phone,
    purpose: "signup",
  });

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

}
);

// =====================================
// 6. CUSTOMER PASSWORDLESS OTP LOGIN
// =====================================

// REQUEST CUSTOMER LOGIN OTP

router.post(
"/request-customer-login-otp",
otpRequestLimiter,
async (req, res) => {
try {
const { phone } = req.body;

  if (!validPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid mobile number.",
    });
  }

  const existingUser = await User.findOne({ phone });

  if (existingUser && existingUser.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "This number is not registered as a customer.",
    });
  }

  if (existingUser && !existingUser.isActive) {
    return res.status(403).json({
      success: false,
      message: "Your customer account is inactive.",
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

  await SignupOTP.findOneAndUpdate(
    { phone },
    {
      $set: {
        phone,
        purpose: "login",
        otpHash: hashOTP(otp),
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        otpAttempts: 0,
        otpLastSentAt: new Date(),
      },
      $unset: {
        name: "",
        email: "",
        passwordHash: "",
      },
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
    "Login OTP sent successfully."
  );
} catch (error) {
  console.error("Customer Login OTP Error:", error);

  return res.status(500).json({
    success: false,
    message: "Unable to send login OTP.",
  });
}

}
);

// VERIFY CUSTOMER LOGIN OTP

router.post(
"/verify-customer-login-otp",
otpVerifyLimiter,
async (req, res) => {
try {
const { phone, otp } = req.body;

  if (!validPhone(phone) || !validOTP(otp)) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number or OTP.",
    });
  }

  const pending = await SignupOTP.findOne({
    phone,
    purpose: "login",
  });

  if (!pending) {
    return res.status(404).json({
      success: false,
      message: "OTP request not found. Please request a new OTP.",
    });
  }

  if (pending.otpExpiresAt < new Date()) {
    await SignupOTP.deleteOne({ _id: pending._id });

    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new OTP.",
    });
  }

  if (pending.otpAttempts >= 5) {
    await SignupOTP.deleteOne({ _id: pending._id });

    return res.status(429).json({
      success: false,
      message: "Too many incorrect attempts. Request a new OTP.",
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

  await SignupOTP.deleteOne({ _id: pending._id });

  // EXISTING CUSTOMER
  if (existingUser) {
    if (
      existingUser.role !== "customer" ||
      !existingUser.isActive
    ) {
      return res.status(403).json({
        success: false,
        message: "Customer account is unavailable.",
      });
    }

    return res.json({
      success: true,
      isNewCustomer: false,
      message: "Login successful!",
      token: createToken(existingUser),
      user: {
        id: existingUser._id,
        name: existingUser.name,
        phone: existingUser.phone,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  }

  // NEW CUSTOMER
  return res.json({
    success: true,
    isNewCustomer: true,
    message: "Mobile number verified. Please enter your name.",
    verificationToken: createCustomerProfileToken(phone),
  });
} catch (error) {
  console.error("Customer OTP Verification Error:", error);

  return res.status(500).json({
    success: false,
    message: "Unable to verify login OTP.",
  });
}

}
);

// COMPLETE NEW CUSTOMER PROFILE

router.post(
"/complete-customer-profile",
loginLimiter,
async (req, res) => {
try {
const { name, verificationToken } = req.body;

  if (!validName(name)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid name.",
    });
  }

  if (!verificationToken) {
    return res.status(400).json({
      success: false,
      message: "Mobile verification is required.",
    });
  }

  let verified;

  try {
    verified = jwt.verify(verificationToken, JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Mobile verification expired. Please verify again.",
    });
  }

  if (
    verified.purpose !== "customer-profile-setup" ||
    !validPhone(verified.phone)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid mobile verification.",
    });
  }

  const existingUser = await User.findOne({
    phone: verified.phone,
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "This mobile number is already registered.",
    });
  }

  // Customer does not need to know this internal password.
  const randomPassword = crypto.randomBytes(32).toString("hex");

  const passwordHash = await bcrypt.hash(
    randomPassword,
    12
  );

  const newUser = await User.create({
    name: cleanName(name),
    phone: verified.phone,
    password: passwordHash,
    role: "customer",
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    isNewCustomer: true,
    message: "Your ORGANIGO account has been created successfully!",
    token: createToken(newUser),
    user: {
      id: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
    },
  });
} catch (error) {
  console.error("Customer Profile Creation Error:", error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This mobile number is already registered.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unable to create customer account.",
  });
}

}
);

// =====================================
// 7. OLD CUSTOMER PASSWORD LOGIN
// =====================================

router.post(
"/customer-login",
loginLimiter,
async (req, res) => {
try {
const { phone, password } = req.body;

  if (!validPhone(phone) || typeof password !== "string" || !password) {
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

}
);

// =====================================
// 8. ADMIN LOGIN - REQUEST OTP
// =====================================

router.post(
"/request-admin-login-otp",
otpRequestLimiter,
async (req, res) => {
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

}
);

// =====================================
// 9. ADMIN LOGIN - VERIFY OTP
// =====================================

router.post(
"/verify-admin-login-otp",
otpVerifyLimiter,
async (req, res) => {
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

}
);

// =====================================
// 10. ADMIN / SUPER ADMIN LOGIN
// =====================================

router.post(
"/admin-login",
loginLimiter,
async (req, res) => {
try {
const { phone, password, verificationToken } = req.body;

  if (
    !validPhone(phone) ||
    typeof password !== "string" ||
    !password ||
    !verificationToken
  ) {
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

}
);

// =====================================
// 11. RIDER LOGIN
// =====================================

router.post(
"/rider-login",
loginLimiter,
async (req, res) => {
try {
const { phone, password } = req.body;

  if (!validPhone(phone) || typeof password !== "string" || !password) {
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

}
);

// =====================================
// 12. CUSTOMER - REQUEST RESET OTP
// =====================================

router.post(
"/request-reset-otp",
otpRequestLimiter,
async (req, res) => {
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

}
);

// =====================================
// 13. ADMIN - REQUEST RESET OTP
// =====================================

router.post(
"/request-admin-reset-otp",
otpRequestLimiter,
async (req, res) => {
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

}
);

// =====================================
// 14. COMMON PASSWORD RESET
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

if (
  typeof newPassword !== "string" ||
  newPassword.length < 6
) {
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

// =====================================
// 15. CUSTOMER PASSWORD RESET
// =====================================

router.post(
"/reset-password",
passwordResetLimiter,
(req, res) => {
return resetPassword(req, res, ["customer"]);
}
);

// =====================================
// 16. ADMIN PASSWORD RESET
// =====================================

router.post(
"/admin-reset-password",
passwordResetLimiter,
(req, res) => {
return resetPassword(req, res, ["admin", "superadmin"]);
}
);

// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;