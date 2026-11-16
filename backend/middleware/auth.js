const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =================================
// VERIFY LOGIN TOKEN + DATABASE USER
// =================================

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get latest user from MongoDB
    const user = await User.findById(decoded.userId).select(
      "_id name phone email role isActive"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account inactive or unavailable.",
      });
    }

    // Always use current database role
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      phone: user.phone,
    };

    next();

  } catch (error) {
    console.error("Authentication Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired login session.",
    });
  }
};

// =================================
// CHECK USER ROLE
// =================================

const authorize = (...roles) => {
  return (req, res, next) => {

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};