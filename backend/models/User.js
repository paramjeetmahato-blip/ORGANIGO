const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    password: {
      type: String,
      required: true,
    },

    // USER ROLE
    role: {
      type: String,
      enum: ["customer", "admin", "superadmin", "rider"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // OTP SECURITY
    otpHash: {
      type: String,
      default: null,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
    },

    otpPurpose: {
      type: String,
      enum: [
        "signup",
        "admin-login",
        "reset-password",
        "login",
        null,
      ],
      default: null,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    otpLastSentAt: {
      type: Date,
      default: null,
    },

    // ACCOUNT SECURITY
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);