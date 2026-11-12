const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication Routes
app.use("/api/auth", require("./routes/Auth"));

// Test API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ORGANIGO Backend is Running!",
    database:
      mongoose.connection.readyState === 1
        ? "MongoDB Connected"
        : "MongoDB Disconnected",
  });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`ORGANIGO Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed:", error.message);
  });