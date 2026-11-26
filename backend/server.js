const express = require("express");
const connectDB = require("./config/database");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const app = express();

// =================================
// ENVIRONMENT VALIDATION
// =================================

const requiredEnvVariables = ["MONGO_URI", "JWT_SECRET"];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    console.error(`Missing environment variable: ${variable}`);
    process.exit(1);
  }
}

// =================================
// BASIC CONFIGURATION
// =================================

const PORT = process.env.PORT || 5000;

app.disable("x-powered-by");

// =================================
// SECURITY MIDDLEWARE
// =================================

app.use(helmet());

// General API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// =================================
// MIDDLEWARE
// =================================

// Development mein existing frontend connections
// ko preserve karne ke liye CORS open rakha hai.
// Production mein allowed origins configure karenge.

app.use(cors());

app.use(express.json({ limit: "5mb" }));

// =================================
// HEALTH CHECK API
// =================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ORGANIGO Backend is Running!",
    database:
      mongoose.connection.readyState === 1
        ? "MongoDB Connected"
        : "MongoDB Disconnected",
  });
});

// =================================
// API ROUTES
// =================================

app.use("/api/auth", require("./routes/Auth"));

app.use("/api/customer", require("./routes/Customer"));

app.use("/api/addresses", require("./routes/Addresses"));

app.use(
  "/api/delivery-settings",
  require("./routes/DeliverySettings")
);

app.use("/api/orders", require("./routes/Order"));

app.use("/api/products", require("./routes/products"));

// =================================
// 404 - ROUTE NOT FOUND
// =================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// =================================
// CENTRAL ERROR HANDLER
// =================================

app.use((err, req, res, next) => {
  console.error("Backend Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Invalid JSON
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  // Request body too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : err.message || "Something went wrong.",
  });
});

// =================================
// SERVER START
// =================================

let server;

const startServer = async () => {
  try {
  await connectDB();

    server = app.listen(PORT, () => {
      console.log(`ORGANIGO Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

// =================================
// GRACEFUL SHUTDOWN
// =================================

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down ORGANIGO...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await mongoose.disconnect();

    console.log("ORGANIGO Server shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("Shutdown Error:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));

// =================================
// START APPLICATION
// =================================

startServer();