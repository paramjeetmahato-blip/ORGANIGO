const mongoose = require("mongoose");

// =====================================
// BULK PRICE TIERS
// =====================================

const bulkPriceTierSchema = new mongoose.Schema(
  {
    minQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    maxQuantity: {
      type: Number,
      default: null,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

// =====================================
// PRODUCT VARIANTS / PACK SIZES
// =====================================

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      trim: true,
      default: "",
    },

    unit: {
      type: String,
      default: "1 kg",
      trim: true,
    },

    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    bulkPriceTiers: {
      type: [bulkPriceTierSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// =====================================
// MAIN PRODUCT SCHEMA
// =====================================

const productSchema = new mongoose.Schema(
  {
    // BASIC INFORMATION

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    // CATEGORY SYSTEM

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Old category field for compatibility

    category: {
      type: String,
      required: true,
      trim: true,
    },

    // PRODUCT TYPE

    productType: {
      type: String,
      enum: ["retail", "wholesale", "both"],
      default: "retail",
    },

    // PRODUCT PRICING

    pricingMode: {
      type: String,
      enum: ["single", "tiered", "variants"],
      default: "single",
    },

    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    unit: {
      type: String,
      default: "1 kg",
      trim: true,
    },

    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    bulkPriceTiers: {
      type: [bulkPriceTierSchema],
      default: [],
    },

    // PACK SIZE VARIANTS

    variants: {
      type: [variantSchema],
      default: [],
    },

    // INVENTORY

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // SELLER INFORMATION

    sellerType: {
      type: String,
      enum: ["ORGANIGO", "PARTNER"],
      default: "ORGANIGO",
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // PRODUCT FLAGS

    isSpecial: {
      type: Boolean,
      default: false,
    },

    isDemanding: {
      type: Boolean,
      default: false,
    },

    isOnOffer: {
      type: Boolean,
      default: false,
    },

    // PRODUCT STATUS

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================
// EXPORT MODEL
// =====================================

module.exports = mongoose.model("Product", productSchema);