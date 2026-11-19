const express = require("express");
const router = express.Router();

const DeliverySettings = require("../models/DeliverySettings");
const { protect, authorize } = require("../middleware/auth");

// =================================
// GET DELIVERY SETTINGS
// PUBLIC API
// =================================

router.get("/", async (req, res) => {
  try {
    let settings = await DeliverySettings.findOne({
      storeCode: "CHAIBASA_MAIN",
    });

    // CREATE DEFAULT SETTINGS IF NOT FOUND
    if (!settings) {
      settings = await DeliverySettings.create({
        storeCode: "CHAIBASA_MAIN",
        storeName: "ORGANIGO Chaibasa",
        hubLatitude: 22.5504,
        hubLongitude: 85.8025,
        deliveryRadiusKm: 10,
        isDeliveryActive: true,
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Delivery Settings Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch delivery settings.",
    });
  }
});

// =================================
// UPDATE DELIVERY SETTINGS
// ADMIN / SUPERADMIN ONLY
// =================================

router.patch(
  "/",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const {
        deliveryRadiusKm,
        isDeliveryActive,
        hubLatitude,
        hubLongitude,
      } = req.body;

      const updates = {};

      if (deliveryRadiusKm !== undefined) {
        const radius = Number(deliveryRadiusKm);

        if (!Number.isFinite(radius) || radius < 1 || radius > 100) {
          return res.status(400).json({
            success: false,
            message: "Delivery radius must be between 1 and 100 KM.",
          });
        }

        updates.deliveryRadiusKm = radius;
      }

      if (isDeliveryActive !== undefined) {
        if (typeof isDeliveryActive !== "boolean") {
          return res.status(400).json({
            success: false,
            message: "Invalid delivery availability setting.",
          });
        }

        updates.isDeliveryActive = isDeliveryActive;
      }

      if (hubLatitude !== undefined) {
        const lat = Number(hubLatitude);

        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          return res.status(400).json({
            success: false,
            message: "Invalid hub latitude.",
          });
        }

        updates.hubLatitude = lat;
      }

      if (hubLongitude !== undefined) {
        const lng = Number(hubLongitude);

        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          return res.status(400).json({
            success: false,
            message: "Invalid hub longitude.",
          });
        }

        updates.hubLongitude = lng;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid settings provided.",
        });
      }

      const settings = await DeliverySettings.findOneAndUpdate(
        { storeCode: "CHAIBASA_MAIN" },
        {
          $set: updates,
          $setOnInsert: {
            storeName: "ORGANIGO Chaibasa",
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      res.status(200).json({
        success: true,
        message: "Delivery settings updated successfully!",
        settings,
      });
    } catch (error) {
      console.error("Update Delivery Settings Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update delivery settings.",
      });
    }
  }
);

module.exports = router;