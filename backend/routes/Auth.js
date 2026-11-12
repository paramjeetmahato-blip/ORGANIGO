const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ==========================
// CUSTOMER REGISTRATION
// ==========================

router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Required fields check
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and password are required.",
      });
    }

    // Phone validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check existing customer
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create customer
    const newUser = await User.create({
      name,
      phone,
      email: email || undefined,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
});

// ==========================
// CUSTOMER LOGIN
// ==========================

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required.",
      });
    }

    // Find customer
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password.",
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
});

module.exports = router;