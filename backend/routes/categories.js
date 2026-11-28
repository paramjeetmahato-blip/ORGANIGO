const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const Category = require("../models/Category");
const Product = require("../models/Product");

const { protect, authorize } = require("../middleware/auth");

// =====================================
// CREATE SLUG
// =====================================

const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// =====================================
// GET ACTIVE CATEGORIES (CUSTOMER)
// =====================================

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    })
      .populate("parentCategory", "name slug")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Fetch Categories Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch categories.",
    });
  }
});

// =====================================
// GET ALL CATEGORIES (ADMIN)
// =====================================

router.get(
  "/admin/all",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const categories = await Category.find()
        .populate("parentCategory", "name slug")
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      res.status(200).json({
        success: true,
        count: categories.length,
        categories,
      });
    } catch (error) {
      console.error("Admin Categories Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch categories.",
      });
    }
  }
);

// =====================================
// ADD CATEGORY (ADMIN)
// =====================================

router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        image,
        parentCategory,
        sortOrder,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required.",
        });
      }

      const slug = createSlug(name);

      if (!slug) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid category name.",
        });
      }

      const existingCategory = await Category.findOne({ slug });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "This category already exists.",
        });
      }

      let validParentCategory = null;

      if (parentCategory) {
        if (!mongoose.Types.ObjectId.isValid(parentCategory)) {
          return res.status(400).json({
            success: false,
            message: "Invalid parent category.",
          });
        }

        const parent = await Category.findOne({
          _id: parentCategory,
          isActive: true,
          parentCategory: null,
        });

        if (!parent) {
          return res.status(400).json({
            success: false,
            message: "Active main category not found.",
          });
        }

        validParentCategory = parent._id;
      }

      const category = await Category.create({
        name: name.trim(),
        slug,
        description: description || "",
        image: image || "",
        parentCategory: validParentCategory,
        sortOrder: Number(sortOrder) || 0,
      });

      res.status(201).json({
        success: true,
        message: "Category added successfully.",
        category,
      });
    } catch (error) {
      console.error("Add Category Error:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Unable to add category.",
      });
    }
  }
);

// =====================================
// UPDATE CATEGORY (ADMIN)
// =====================================

router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      const {
        name,
        description,
        image,
        sortOrder,
        parentCategory,
      } = req.body;

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({
            success: false,
            message: "Category name cannot be empty.",
          });
        }

        const slug = createSlug(name);

        const duplicate = await Category.findOne({
          slug,
          _id: { $ne: id },
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: "Another category with this name already exists.",
          });
        }

        category.name = name.trim();
        category.slug = slug;
      }

      if (description !== undefined) {
        category.description = description;
      }

      if (image !== undefined) {
        category.image = image;
      }

      if (sortOrder !== undefined) {
        category.sortOrder = Number(sortOrder) || 0;
      }

      if (parentCategory !== undefined) {
        if (parentCategory === null || parentCategory === "") {
          category.parentCategory = null;
        } else {
          if (
            !mongoose.Types.ObjectId.isValid(parentCategory) ||
            String(parentCategory) === String(id)
          ) {
            return res.status(400).json({
              success: false,
              message: "Invalid parent category.",
            });
          }

          const parent = await Category.findOne({
            _id: parentCategory,
            isActive: true,
            parentCategory: null,
          });

          if (!parent) {
            return res.status(400).json({
              success: false,
              message: "Active main category not found.",
            });
          }

          category.parentCategory = parent._id;
        }
      }

      await category.save();

      res.status(200).json({
        success: true,
        message: "Category updated successfully.",
        category,
      });
    } catch (error) {
      console.error("Update Category Error:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Unable to update category.",
      });
    }
  }
);

// =====================================
// ACTIVATE / DEACTIVATE CATEGORY
// =====================================

router.patch(
  "/:id/status",
  protect,
  authorize("admin", "superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      // Main category cannot be deactivated
      // while it has active subcategories.
      if (!isActive) {
        const activeChildren = await Category.exists({
          parentCategory: id,
          isActive: true,
        });

        if (activeChildren) {
          return res.status(400).json({
            success: false,
            message: "Deactivate its subcategories first.",
          });
        }
      }

      category.isActive = isActive;
      await category.save();

      res.status(200).json({
        success: true,
        message: isActive
          ? "Category activated successfully."
          : "Category deactivated successfully.",
        category,
      });
    } catch (error) {
      console.error("Category Status Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update category status.",
      });
    }
  }
);

module.exports = router;