const express = require("express");
const authenticateCustomer = require("../middleware/authenticateCustomer");

const router = express.Router();

// =====================================
// GET ALL SAVED ADDRESSES
// =====================================

router.get("/", authenticateCustomer, async (req, res) => {
  try {
    const addresses = req.user.addresses || [];

    const selectedAddress = req.user.selectedAddressId
      ? addresses.id(req.user.selectedAddressId)
      : null;

    return res.json({
      success: true,
      addresses,
      selectedAddressId: req.user.selectedAddressId || null,
      selectedAddress: selectedAddress || null,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load addresses.",
    });
  }
});

// =====================================
// ADD NEW ADDRESS
// =====================================

router.post("/", authenticateCustomer, async (req, res) => {
  try {
    const {
      label,
      fullName,
      phone,
      houseNo,
      area,
      landmark,
      city,
      state,
      pincode,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    if (!fullName || !phone || !houseNo || !area || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required address fields.",
      });
    }

    const shouldBeDefault =
      isDefault === true || req.user.addresses.length === 0;

    if (shouldBeDefault) {
      req.user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    req.user.addresses.push({
      label: label || "Home",
      fullName,
      phone,
      houseNo,
      area,
      landmark,
      city,
      state,
      pincode,
      latitude,
      longitude,
      isDefault: shouldBeDefault,
    });

    const newAddress =
      req.user.addresses[req.user.addresses.length - 1];

    // First saved address automatically becomes selected
    if (!req.user.selectedAddressId) {
      req.user.selectedAddressId = newAddress._id;
    }

    await req.user.save();

    return res.status(201).json({
      success: true,
      message: "Address saved successfully.",
      addresses: req.user.addresses,
      selectedAddressId: req.user.selectedAddressId,
      selectedAddress: req.user.addresses.id(
        req.user.selectedAddressId
      ),
    });
  } catch (error) {
    console.error("Add Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save address.",
    });
  }
});

// =====================================
// UPDATE EXISTING ADDRESS
// =====================================

router.put("/:addressId", authenticateCustomer, async (req, res) => {
  try {
    const address = req.user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const allowedFields = [
      "label",
      "fullName",
      "phone",
      "houseNo",
      "area",
      "landmark",
      "city",
      "state",
      "pincode",
      "latitude",
      "longitude",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    });

    // Update default address if requested
    if (req.body.isDefault === true) {
      req.user.addresses.forEach((item) => {
        item.isDefault =
          item._id.toString() === req.params.addressId;
      });
    }

    await req.user.save();

    const selectedAddress = req.user.selectedAddressId
      ? req.user.addresses.id(req.user.selectedAddressId)
      : null;

    return res.json({
      success: true,
      message: "Address updated successfully.",
      addresses: req.user.addresses,
      selectedAddressId: req.user.selectedAddressId || null,
      selectedAddress: selectedAddress || null,
    });
  } catch (error) {
    console.error("Update Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update address.",
    });
  }
});

// =====================================
// DELETE ADDRESS
// =====================================

router.delete("/:addressId", authenticateCustomer, async (req, res) => {
  try {
    const address = req.user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const wasDefault = address.isDefault;

    const wasSelected =
      req.user.selectedAddressId &&
      req.user.selectedAddressId.toString() ===
        req.params.addressId;

    address.deleteOne();

    // Select another address if selected address is deleted
    if (wasSelected) {
      const fallbackAddress =
        req.user.addresses.find((item) => item.isDefault) ||
        req.user.addresses[0] ||
        null;

      req.user.selectedAddressId = fallbackAddress
        ? fallbackAddress._id
        : null;
    }

    // Set another address as default if needed
    if (wasDefault && req.user.addresses.length > 0) {
      const alreadyDefault = req.user.addresses.find(
        (item) => item.isDefault
      );

      if (!alreadyDefault) {
        req.user.addresses[0].isDefault = true;
      }
    }

    await req.user.save();

    const selectedAddress = req.user.selectedAddressId
      ? req.user.addresses.id(req.user.selectedAddressId)
      : null;

    return res.json({
      success: true,
      message: "Address deleted successfully.",
      addresses: req.user.addresses,
      selectedAddressId: req.user.selectedAddressId || null,
      selectedAddress: selectedAddress || null,
    });
  } catch (error) {
    console.error("Delete Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete address.",
    });
  }
});

// =====================================
// SET DEFAULT ADDRESS
// =====================================

router.patch("/:addressId/default", authenticateCustomer, async (req, res) => {
  try {
    const address = req.user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    req.user.addresses.forEach((item) => {
      item.isDefault =
        item._id.toString() === req.params.addressId;
    });

    await req.user.save();

    return res.json({
      success: true,
      message: "Default address updated successfully.",
      addresses: req.user.addresses,
      selectedAddressId: req.user.selectedAddressId || null,
    });
  } catch (error) {
    console.error("Default Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update default address.",
    });
  }
});

// =====================================
// SELECT ADDRESS
// =====================================

router.patch("/:addressId/select", authenticateCustomer, async (req, res) => {
  try {
    const address = req.user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    // Save selected address ID in MongoDB
    req.user.selectedAddressId = address._id;

    await req.user.save();

    return res.json({
      success: true,
      message: "Delivery address selected successfully.",
      selectedAddressId: req.user.selectedAddressId,
      selectedAddress: address,
      addresses: req.user.addresses,
    });
  } catch (error) {
    console.error("Select Address Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to select address.",
    });
  }
});

// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;