const mongoose = require("mongoose");

// =====================================
// ORDER ITEM SCHEMA
// =====================================

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: "",
  },
});

// =====================================
// CUSTOMER SCHEMA
// =====================================

const customerSchema = new mongoose.Schema({
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
});

// =====================================
// LOCATION SCHEMA
// =====================================

const locationSchema = new mongoose.Schema({
  name: String,
  fullAddress: String,
  latitude: Number,
  longitude: Number,
});

// =====================================
// RIDER LOCATION SCHEMA
// =====================================

const riderLocationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// =====================================
// ORDER STATUS HISTORY
// =====================================

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// =====================================
// MAIN ORDER SCHEMA
// =====================================

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // CUSTOMER SELECTED SAVED ADDRESS ID
    selectedAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    customer: {
      type: customerSchema,
      required: true,
    },

    location: locationSchema,

    items: {
      type: [orderItemSchema],
      required: true,
    },

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
      default: "Order Placed",
    },

    // RIDER ASSIGNMENT
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    riderName: {
      type: String,
      default: "",
    },

    riderPhone: {
      type: String,
      default: "",
    },

    riderAssignedAt: {
      type: Date,
      default: null,
    },

    // RIDER LIVE LOCATION
    riderLocation: {
      type: riderLocationSchema,
      default: () => ({}),
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: function () {
        return [
          {
            status: "Order Placed",
            message: "Your order has been placed successfully.",
            updatedAt: new Date(),
          },
        ];
      },
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Order", orderSchema);