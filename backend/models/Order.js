const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    customer: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: String,
      state: String,
      pincode: String,
    },

    location: {
      name: String,
      fullAddress: String,
      latitude: Number,
      longitude: Number,
    },

    items: [
      {
        productId: String,
        name: String,
        image: String,
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        unit: String,
      },
    ],

    total: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      default: "Cash on Delivery",
    },

    paymentStatus: {
      type: String,
      default: "Pending",
    },

    status: {
      type: String,
      default: "Placed",
    },

    mapLink: String,
    deliveryDistance: Number,
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderSchema);