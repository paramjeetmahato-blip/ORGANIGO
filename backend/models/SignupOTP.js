const mongoose = require("mongoose");

const signupOTPSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: undefined,
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
    },

    passwordHash: {
      type: String,
      default: undefined,
    },

    purpose: {
      type: String,
      enum: ["signup", "login"],
      default: "signup",
    },

    otpHash: {
      type: String,
      required: true,
    },

    otpExpiresAt: {
      type: Date,
      required: true,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    otpLastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired OTP records
signupOTPSchema.index(
  { otpExpiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("SignupOTP", signupOTPSchema);