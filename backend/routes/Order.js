const express = require("express");
const router = express.Router();

const Order = require("../models/Order");

// =================================
// PLACE NEW ORDER
// =================================
router.post("/", async (req, res) => {
  try {
    const {
      orderId,
      customer,
      location,
      items,
      total,
      paymentMethod,
      paymentStatus,
      status,
      mapLink,
      deliveryDistance,
      orderDate,
    } = req.body;

    // Basic validation
    if (!customer || !customer.name || !customer.phone ||
        !customer.address || !items || items.length === 0 ||
        total === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required order details.",
      });
    }

    const newOrder = new Order({
      orderId: orderId || `ORG-${Date.now()}`,
      customer,
      location,
      items,
      total,
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: paymentStatus || "Pending",
      status: status || "Placed",
      mapLink,
      deliveryDistance,
      orderDate: orderDate || new Date(),
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Place Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to place order.",
      error: error.message,
    });
  }
});

module.exports = router;