const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Customer access only.",
      });
    }

    const user = await User.findById(decoded.userId).select(
      "-password -otpHash -otpExpiresAt -otpPurpose -otpAttempts -otpLastSentAt"
    );

    if (!user || !user.isActive || user.role !== "customer") {
      return res.status(401).json({
        success: false,
        message: "Customer account not found or inactive.",
      });
    }

    req.user = user;

    next();

  } catch (error) {
    console.error("Customer Authentication Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired login session.",
    });
  }
};

module.exports = authenticateCustomer;