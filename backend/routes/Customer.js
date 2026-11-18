const express = require("express");

const User = require("../models/User");
const authenticateCustomer = require("../middleware/authenticateCustomer");

const router = express.Router();

// =====================================
// GET CUSTOMER PROFILE
// =====================================

router.get("/profile", authenticateCustomer, async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Customer profile loaded successfully.",
      user: {
        id: req.user._id,
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email || "",
        role: req.user.role,
      },
    });

  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load customer profile.",
    });
  }
});

// =====================================
// UPDATE CUSTOMER PROFILE
// =====================================

router.put("/profile", authenticateCustomer, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (name.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 60 characters.",
      });
    }

    if (email && email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name: name.trim(),
          email: email ? email.trim().toLowerCase() : "",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "-password -otpHash -otpExpiresAt -otpPurpose -otpAttempts -otpLastSentAt"
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email || "",
        role: updatedUser.role,
      },
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
});

module.exports = router;