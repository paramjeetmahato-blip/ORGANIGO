
const mongoose = require("mongoose");

// =====================================
// CUSTOMER SAVED ADDRESS SCHEMA
// =====================================

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },

    fullName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    houseNo: {
      type: String,
      trim: true,
    },

    area: {
      type: String,
      trim: true,
    },

    landmark: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },

    // GPS COORDINATES
    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    // DEFAULT ADDRESS
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================
// MAIN USER SCHEMA
// =====================================

const userSchema = new mongoose.Schema(
  {
    // USER NAME
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // MOBILE NUMBER
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // EMAIL
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    // PASSWORD
    password: {
      type: String,
      required: true,
    },

    // =====================================
    // USER ROLE
    // =====================================

    role: {
      type: String,
      enum: ["customer", "admin", "superadmin", "rider"],
      default: "customer",
    },

    // ACCOUNT STATUS
    isActive: {
      type: Boolean,
      default: true,
    },

    // =====================================
    // SAVED DELIVERY ADDRESSES
    // =====================================

    addresses: {
      type: [addressSchema],
      default: [],
    },

    // =====================================
    // CURRENT SELECTED DELIVERY ADDRESS
    // =====================================

    selectedAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // =====================================
    // OTP SECURITY
    // =====================================

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

    // =====================================
    // ACCOUNT SECURITY
    // =====================================

    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================
// EXPORT USER MODEL
// =====================================

module.exports = mongoose.model("User", userSchema);
