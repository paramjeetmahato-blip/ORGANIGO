const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");

const { protect, authorize } = require("../middleware/auth");

// =================================
// PLACE NEW ORDER - CUSTOMER ONLY
// =================================

router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const {
      orderId,
      customer,
      location,
      items,
      total,
      paymentMethod,
      mapLink,
      deliveryDistance,
      orderDate,
    } = req.body;

    // Find logged-in customer
    const user = await User.findById(req.user.userId);

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive or unavailable.",
      });
    }

    // Validate order details
    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !Number.isFinite(Number(total)) ||
      Number(total) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required order details.",
      });
    }

    // Customer phone must match logged-in account
    if (customer.phone !== user.phone) {
      return res.status(400).json({
        success: false,
        message: "Please use your registered mobile number.",
      });
    }

    const newOrder = new Order({
      userId: user._id,

      orderId: orderId || `ORG-${Date.now()}`,

      customer: {
        ...customer,
        phone: user.phone,
      },

      location,

      items,

      total: Number(total),

      paymentMethod: "Cash on Delivery",

      paymentStatus: "Pending - Cash on Delivery",

      status: "Order Placed",

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
      message: "Unable to place your order.",
    });
  }
});

// =================================
// CUSTOMER - GET MY ORDERS
// =================================

router.get("/my-orders", protect, authorize("customer"), async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });

  } catch (error) {
    console.error("My Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch your orders.",
    });
  }
});

// =================================
// CUSTOMER - GET ONE OWN ORDER
// =================================

router.get(
  "/my-orders/:orderId",
  protect,
  authorize("customer"),
  async (req, res) => {
    try {
      const order = await Order.findOne({
        orderId: req.params.orderId,
        userId: req.user.userId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      res.json({
        success: true,
        order,
      });

    } catch (error) {
      console.error("Order Details Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch order details.",
      });
    }
  }
);

// =================================
// ADMIN - GET ALL ORDERS
// =================================

router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });

  } catch (error) {
    console.error("Get All Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
});

// =================================
// ADMIN - UPDATE ORDER STATUS
// =================================

router.patch(
  "/:orderId/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Order Placed",
        "Confirmed",
        "Packed",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
        });
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: req.params.orderId },
        { status },
        { new: true, runValidators: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully!",
        order: updatedOrder,
      });

    } catch (error) {
      console.error("Update Order Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update order status.",
      });
    }
  }
);

module.exports = router;