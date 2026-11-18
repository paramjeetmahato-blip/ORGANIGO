const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/auth");

// =====================================
// GET ALL ACTIVE PRODUCTS (CUSTOMER)
// =====================================
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch products.",
    });
  }
});

// =====================================
// GET ACTIVE PRODUCTS (ADMIN INVENTORY)
// =====================================
router.get("/admin/all", protect, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch products.",
    });
  }
});

// =====================================
// GET DELETED PRODUCTS (ADMIN)
// =====================================
router.get(
  "/admin/deleted",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const products = await Product.find({ isActive: false }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to fetch deleted products.",
      });
    }
  }
);

// =====================================
// RESTORE DELETED PRODUCT (ADMIN)
// =====================================
router.patch(
  "/:id/restore",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { isActive: true },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Product restored successfully.",
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to restore product.",
      });
    }
  }
);

// =====================================
// ADD NEW PRODUCT (ADMIN)
// =====================================
router.post("/", protect, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      originalPrice,
      image,
      description,
      unit,
      stock,
    } = req.body;

    if (!name || !category || price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Product name, category and price are required.",
      });
    }

    const product = await Product.create({
      name,
      category,
      price,
      originalPrice,
      image,
      description,
      unit,
      stock,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Unable to add product.",
    });
  }
});

// =====================================
// UPDATE PRODUCT (ADMIN)
// =====================================
router.put("/:id", protect, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "category",
      "price",
      "originalPrice",
      "image",
      "description",
      "unit",
      "stock",
      "isActive",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Unable to update product.",
    });
  }
});

// =====================================
// DELETE PRODUCT (SOFT DELETE)
// =====================================
router.delete("/:id", protect, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product moved to Deleted Products successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete product.",
    });
  }
});

module.exports = router;