const mongoose = require("mongoose");

const deliverySettingsSchema = new mongoose.Schema(
  {
    // Store Identification
    storeCode: {
      type: String,
      required: true,
      unique: true,
      default: "CHAIBASA_MAIN",
      trim: true,
    },

    storeName: {
      type: String,
      default: "ORGANIGO Chaibasa",
      trim: true,
    },

    // Delivery Hub Coordinates
    hubLatitude: {
      type: Number,
      required: true,
      default: 22.5504,
    },

    hubLongitude: {
      type: Number,
      required: true,
      default: 85.8025,
    },

    // Admin Controlled Delivery Radius
    deliveryRadiusKm: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 100,
    },

    // Delivery Availability
    isDeliveryActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DeliverySettings",
  deliverySettingsSchema
);