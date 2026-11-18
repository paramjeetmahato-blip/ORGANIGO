const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

const { protect, authorize } = require("../middleware/auth");



// =================================
// PLACE NEW ORDER - CUSTOMER ONLY
// REGISTERED NAME + SECURE PRICE AND STOCK
// =================================

router.post("/", protect, authorize("customer"), async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();

    const { customer, location, items, mapLink } = req.body;

    if (
      !customer?.phone ||
      !customer?.address ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required order details.",
      });
    }

    if (String(customer.phone) !== String(req.user.phone)) {
      return res.status(400).json({
        success: false,
        message: "Please use your registered mobile number.",
      });
    }

    const address = String(customer.address).trim();

    if (address.length < 5 || address.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid delivery address.",
      });
    }

    // Validate and combine duplicate products
    const quantities = new Map();

    for (const item of items) {
      const productId = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (
        !/^[0-9a-fA-F]{24}$/.test(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity.",
        });
      }

      const totalQuantity =
        (quantities.get(productId) || 0) + quantity;

      if (totalQuantity > 100) {
        return res.status(400).json({
          success: false,
          message: "Maximum quantity per product is 100.",
        });
      }

      quantities.set(productId, totalQuantity);
    }

    let savedOrder;

    await session.withTransaction(async () => {
      const user = await User.findById(req.user.userId).session(session);

      if (!user || !user.isActive || user.role !== "customer") {
        throw new Error("Your account is inactive or unavailable.");
      }

      if (!user.name || user.name.trim().length < 3) {
        throw new Error(
          "Please update your registered name before placing an order."
        );
      }

      const orderItems = [];
      let calculatedTotal = 0;

      for (const [productId, quantity] of quantities) {
        const product = await Product.findOneAndUpdate(
          {
            _id: productId,
            isActive: true,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!product) {
          throw new Error(
            "A product is unavailable or has insufficient stock. Please update your cart."
          );
        }

        calculatedTotal += product.price * quantity;

        orderItems.push({
          productId: String(product._id),
          name: product.name,
          image: product.image,
          price: product.price,
          quantity,
          unit: product.unit,
        });
      }

      const newOrder = new Order({
        userId: user._id,

        orderId: `ORG-${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,

        // IMPORTANT: Name comes from MongoDB User account
        customer: {
          name: user.name.trim(),
          phone: user.phone,
          address: address,
          city: String(customer.city || "").trim(),
          state: String(customer.state || "").trim(),
          pincode: String(customer.pincode || "").trim(),
        },

        location: location || {},

        items: orderItems,

        total: Number(calculatedTotal.toFixed(2)),

        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending - Cash on Delivery",

        status: "Order Placed",

        statusHistory: [
          {
            status: "Order Placed",
            message: "Your order has been placed successfully.",
            updatedAt: new Date(),
          },
        ],

        mapLink: mapLink || "",

        orderDate: new Date(),
      });

      const createdOrders = await Order.create(
        [newOrder],
        { session }
      );

      savedOrder = createdOrders[0];
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: savedOrder,
    });

  } catch (error) {
    console.error("Place Order Error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Unable to place your order.",
    });

  } finally {
    if (session) {
      await session.endSession();
    }
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

      res.status(200).json({
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
// CUSTOMER - CANCEL OWN ORDER
// =================================

router.patch(
  "/my-orders/:orderId/cancel",
  protect,
  authorize("customer"),
  async (req, res) => {
    try {
      const { reason } = req.body;

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

      const cancellableStatuses = ["Order Placed", "Confirmed"];

      if (!cancellableStatuses.includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "This order can no longer be cancelled.",
        });
      }

      order.status = "Cancelled";
      order.cancelledAt = new Date();

      order.cancellationReason =
        typeof reason === "string" ? reason.trim().slice(0, 300) : "";

      order.statusHistory.push({
        status: "Cancelled",
        message: order.cancellationReason
          ? `Order cancelled by customer. Reason: ${order.cancellationReason}`
          : "Order cancelled by customer.",
        updatedAt: new Date(),
      });

      await order.save();

      res.status(200).json({
        success: true,
        message: "Your order has been cancelled successfully.",
        order,
      });
    } catch (error) {
      console.error("Cancel Order Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to cancel your order.",
      });
    }
  }
);

// =================================
// ADMIN - GET ALL RIDERS
// =================================

router.get(
  "/riders",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const riders = await User.find({
        role: "rider",
        isActive: true,
      })
        .select("name phone email")
        .sort({ name: 1 });

      res.status(200).json({
        success: true,
        totalRiders: riders.length,
        riders,
      });
    } catch (error) {
      console.error("Get Riders Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch riders.",
      });
    }
  }
);

// =================================
// ADMIN - ASSIGN RIDER TO ORDER
// =================================

router.patch(
  "/:orderId/assign-rider",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const { riderId } = req.body;

      if (!riderId) {
        return res.status(400).json({
          success: false,
          message: "Please select a rider.",
        });
      }

      if (!/^[0-9a-fA-F]{24}$/.test(riderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid rider ID.",
        });
      }

      const rider = await User.findOne({
        _id: riderId,
        role: "rider",
        isActive: true,
      });

      if (!rider) {
        return res.status(404).json({
          success: false,
          message: "Active rider not found.",
        });
      }

      const order = await Order.findOne({
        orderId: req.params.orderId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (["Cancelled", "Delivered"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign a rider to this order.",
        });
      }

      order.riderId = rider._id;
      order.riderName = rider.name;
      order.riderPhone = rider.phone;
      order.riderAssignedAt = new Date();

      order.statusHistory.push({
        status: order.status,
        message: `Delivery assigned to ${rider.name}.`,
        updatedAt: new Date(),
      });

      await order.save();

      res.status(200).json({
        success: true,
        message: "Rider assigned successfully!",
        order,
      });
    } catch (error) {
      console.error("Assign Rider Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to assign rider.",
      });
    }
  }
);

// =================================
// RIDER - GET MY ASSIGNED ORDERS
// =================================

router.get(
  "/rider/my-orders",
  protect,
  authorize("rider"),
  async (req, res) => {
    try {
      const orders = await Order.find({
        riderId: req.user.userId,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        totalOrders: orders.length,
        orders,
      });
    } catch (error) {
      console.error("Rider Orders Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch assigned orders.",
      });
    }
  }
);

// =================================
// RIDER - UPDATE DELIVERY STATUS
// =================================

router.patch(
  "/rider/:orderId/status",
  protect,
  authorize("rider"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Out for Delivery",
        "Delivered",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid rider delivery status.",
        });
      }

      const order = await Order.findOne({
        orderId: req.params.orderId,
        riderId: req.user.userId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Assigned order not found.",
        });
      }

      if (["Cancelled", "Delivered"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "This order is already completed or cancelled.",
        });
      }

      if (
        status === "Out for Delivery" &&
        order.status !== "Packed"
      ) {
        return res.status(400).json({
          success: false,
          message: "Order must be packed before delivery.",
        });
      }

      if (
        status === "Delivered" &&
        order.status !== "Out for Delivery"
      ) {
        return res.status(400).json({
          success: false,
          message: "Order must be out for delivery first.",
        });
      }

      order.status = status;

      order.statusHistory.push({
        status,
        message:
          status === "Delivered"
            ? "Your order has been delivered successfully."
            : "Your order is out for delivery.",
        updatedAt: new Date(),
      });

      await order.save();

      res.status(200).json({
        success: true,
        message: "Delivery status updated successfully!",
        order,
      });
    } catch (error) {
      console.error("Rider Status Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update delivery status.",
      });
    }
  }
);

// =================================
// RIDER - UPDATE LIVE GPS LOCATION
// =================================

router.patch(
  "/rider/:orderId/location",
  protect,
  authorize("rider"),
  async (req, res) => {
    try {
      const { latitude, longitude } = req.body;

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid GPS coordinates.",
        });
      }

      const order = await Order.findOne({
        orderId: req.params.orderId,
        riderId: req.user.userId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Assigned order not found.",
        });
      }

      if (order.status !== "Out for Delivery") {
        return res.status(400).json({
          success: false,
          message: "GPS updates are allowed during delivery only.",
        });
      }

      order.riderLocation = {
        latitude: lat,
        longitude: lng,
        updatedAt: new Date(),
      };

      await order.save();

      res.status(200).json({
        success: true,
        message: "Rider location updated successfully.",
        riderLocation: order.riderLocation,
      });
    } catch (error) {
      console.error("Rider Location Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update rider location.",
      });
    }
  }
);

// =================================
// ADMIN - GET ALL ORDERS
// =================================

router.get("/", protect, authorize("admin", "superadmin"), async (req, res) => {
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
  authorize("admin", "superadmin"),
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

      const updatedOrder = await Order.findOne({
        orderId: req.params.orderId,
      });

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (
        updatedOrder.status === "Cancelled" ||
        updatedOrder.status === "Delivered"
      ) {
        return res.status(400).json({
          success: false,
          message: "This order is already completed or cancelled.",
        });
      }

      updatedOrder.status = status;

      if (status === "Cancelled") {
        updatedOrder.cancelledAt = new Date();
        updatedOrder.cancellationReason = "Cancelled by admin.";
      }

      updatedOrder.statusHistory.push({
        status,
        message: `Your order status has been updated to ${status}.`,
        updatedAt: new Date(),
      });

      await updatedOrder.save();

      res.status(200).json({
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