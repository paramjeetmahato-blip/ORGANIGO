const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Product = require("../models/Product");
const Category = require("../models/Category");

const { protect, authorize } = require("../middleware/auth");

// =====================================================
// COMMON HELPERS
// =====================================================

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendError = (res, error, fallbackMessage) => {
console.error("PRODUCT API ERROR:", error);

if (
error.name === "ValidationError" ||
error.name === "CastError" ||
error.statusCode === 400 ||
error.name === "Error"
) {
return res.status(400).json({
success: false,
message: error.message,
});
}

if (error.code === 11000) {
return res.status(409).json({
success: false,
message: "Duplicate product information.",
});
}

return res.status(500).json({
success: false,
message: fallbackMessage,
});
};

const throwValidationError = (message) => {
const error = new Error(message);
error.statusCode = 400;
throw error;
};

// =====================================================
// CATEGORY VALIDATION
// =====================================================

const validateProductCategory = async (data) => {
let categoryId = data.categoryId || null;
let subCategoryId = data.subCategoryId || null;

let categoryName = data.category || "";

if (categoryId && !isValidId(categoryId)) {
throwValidationError("Invalid category ID.");
}

if (subCategoryId && !isValidId(subCategoryId)) {
throwValidationError("Invalid subcategory ID.");
}

let mainCategory = null;

if (categoryId) {
mainCategory = await Category.findOne({
_id: categoryId,
isActive: true,
parentCategory: null,
});

if (!mainCategory) {
  throwValidationError("Active main category not found.");
}

}

if (subCategoryId) {
const subCategory = await Category.findOne({
_id: subCategoryId,
isActive: true,
});

if (!subCategory || !subCategory.parentCategory) {
  throwValidationError("Active subcategory not found.");
}

if (
  categoryId &&
  subCategory.parentCategory.toString() !== categoryId.toString()
) {
  throwValidationError(
    "Selected subcategory does not belong to this main category."
  );
}

if (!categoryId) {
  categoryId = subCategory.parentCategory;

  mainCategory = await Category.findOne({
    _id: categoryId,
    isActive: true,
    parentCategory: null,
  });

  if (!mainCategory) {
    throwValidationError("Parent category not found.");
  }
}

}

if (mainCategory) {
categoryName = mainCategory.name;
}

if (!categoryName || !String(categoryName).trim()) {
throwValidationError("Product category is required.");
}

return {
categoryId,
subCategoryId,
category: String(categoryName).trim(),
};
};

// =====================================================
// BULK PRICE VALIDATION
// =====================================================

const validateTiers = (tiers = []) => {
if (!Array.isArray(tiers)) {
throwValidationError("Bulk pricing must be an array.");
}

const sortedTiers = [...tiers].sort(
(a, b) => Number(a.minQuantity) - Number(b.minQuantity)
);

for (let index = 0; index < sortedTiers.length; index++) {
const tier = sortedTiers[index];

const min = Number(tier.minQuantity);

const max =
  tier.maxQuantity === null ||
  tier.maxQuantity === undefined ||
  tier.maxQuantity === ""
    ? null
    : Number(tier.maxQuantity);

const price = Number(tier.price);

if (
  !Number.isInteger(min) ||
  min < 1 ||
  !Number.isFinite(price) ||
  price < 0
) {
  throwValidationError("Invalid bulk pricing information.");
}

if (max !== null && (!Number.isInteger(max) || max < min)) {
  throwValidationError("Invalid bulk pricing quantity range.");
}

if (index > 0) {
  const previous = sortedTiers[index - 1];

  const previousMax =
    previous.maxQuantity === null ||
    previous.maxQuantity === undefined ||
    previous.maxQuantity === ""
      ? Infinity
      : Number(previous.maxQuantity);

  if (min <= previousMax) {
    throwValidationError("Bulk pricing ranges cannot overlap.");
  }
}

}

return sortedTiers.map((tier) => ({
minQuantity: Number(tier.minQuantity),
maxQuantity:
tier.maxQuantity === null ||
tier.maxQuantity === undefined ||
tier.maxQuantity === ""
? null
: Number(tier.maxQuantity),
price: Number(tier.price),
}));
};

// =====================================================
// VARIANT VALIDATION
// =====================================================

const validateVariants = (variants = []) => {
if (!Array.isArray(variants)) {
throwValidationError("Product variants must be an array.");
}

return variants.map((variant) => {
if (!variant.name || !String(variant.name).trim()) {
throwValidationError("Every variant needs a name.");
}

const price = Number(variant.price);
const purchasePrice = Number(variant.purchasePrice || 0);
const originalPrice = Number(variant.originalPrice || 0);
const stock = Number(variant.stock || 0);

if (!Number.isFinite(price) || price < 0) {
  throwValidationError("Invalid variant selling price.");
}

if (
  !Number.isFinite(purchasePrice) ||
  purchasePrice < 0 ||
  !Number.isFinite(originalPrice) ||
  originalPrice < 0 ||
  !Number.isFinite(stock) ||
  stock < 0
) {
  throwValidationError("Invalid variant price or stock.");
}

return {
  name: String(variant.name).trim(),
  sku: String(variant.sku || "").trim(),
  unit: String(variant.unit || "1 kg").trim(),
  purchasePrice,
  price,
  originalPrice,
  stock,
  bulkPriceTiers: validateTiers(
    variant.bulkPriceTiers || []
  ),
  isActive: variant.isActive !== false,
};

});
};

// =====================================================
// BUILD & VALIDATE PRODUCT DATA
// =====================================================

const buildProductData = async (body, existingProduct = null) => {
const data = {};

const allowedFields = [
"name",
"description",
"image",
"productType",
"pricingMode",
"purchasePrice",
"price",
"originalPrice",
"unit",
"minOrderQuantity",
"bulkPriceTiers",
"variants",
"stock",
"isSpecial",
"isDemanding",
"isOnOffer",
"isActive",
];

allowedFields.forEach((field) => {
if (body[field] !== undefined) {
data[field] = body[field];
}
});

// BASIC INFORMATION

const name = data.name ?? existingProduct?.name;

if (!name || !String(name).trim()) {
throwValidationError("Product name is required.");
}

if (data.name !== undefined) {
data.name = String(data.name).trim();
}

// CATEGORY INFORMATION

const categoryChanged =
body.categoryId !== undefined ||
body.subCategoryId !== undefined ||
body.category !== undefined;

if (categoryChanged || !existingProduct) {
const categoryData = await validateProductCategory({
categoryId:
body.categoryId ??
existingProduct?.categoryId?.toString() ??
null,

  subCategoryId:
    body.subCategoryId !== undefined
      ? body.subCategoryId
      : existingProduct?.subCategoryId?.toString() || null,

  category:
    body.category ??
    existingProduct?.category ??
    "",
});

Object.assign(data, categoryData);

}

// PRODUCT TYPE

const productType =
data.productType ?? existingProduct?.productType ?? "retail";

if (!["retail", "wholesale", "both"].includes(productType)) {
throwValidationError("Invalid product type.");
}

data.productType = productType;

// PRICING MODE

const pricingMode =
data.pricingMode ?? existingProduct?.pricingMode ?? "single";

if (!["single", "tiered", "variants"].includes(pricingMode)) {
throwValidationError("Invalid pricing mode.");
}

data.pricingMode = pricingMode;

// PURCHASE PRICE

const purchasePrice = Number(
data.purchasePrice ?? existingProduct?.purchasePrice ?? 0
);

if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
throwValidationError("Invalid purchase price.");
}

data.purchasePrice = purchasePrice;

// ORIGINAL PRICE

const originalPrice = Number(
data.originalPrice ?? existingProduct?.originalPrice ?? 0
);

if (!Number.isFinite(originalPrice) || originalPrice < 0) {
throwValidationError("Invalid original price.");
}

data.originalPrice = originalPrice;

// STOCK

const stock = Number(data.stock ?? existingProduct?.stock ?? 0);

if (!Number.isFinite(stock) || stock < 0) {
throwValidationError("Invalid product stock.");
}

data.stock = stock;

// MINIMUM ORDER QUANTITY

const minOrderQuantity = Number(
data.minOrderQuantity ??
existingProduct?.minOrderQuantity ??
1
);

if (
!Number.isInteger(minOrderQuantity) ||
minOrderQuantity < 1
) {
throwValidationError("Minimum order quantity must be at least 1.");
}

data.minOrderQuantity = minOrderQuantity;

// BULK PRICE TIERS

const tiers = validateTiers(
data.bulkPriceTiers ??
existingProduct?.bulkPriceTiers ??
[]
);

data.bulkPriceTiers = tiers;

// PRODUCT VARIANTS

const variants = validateVariants(
data.variants ?? existingProduct?.variants ?? []
);

data.variants = variants;

// SELLING PRICE

let finalPrice = data.price ?? existingProduct?.price;

if (pricingMode === "variants") {
if (variants.length === 0) {
throwValidationError("Please add at least one product variant.");
}

finalPrice = Math.min(
  ...variants.map((variant) => variant.price)
);

}

if (
finalPrice === undefined ||
finalPrice === null ||
finalPrice === "" ||
!Number.isFinite(Number(finalPrice)) ||
Number(finalPrice) < 0
) {
throwValidationError("Valid selling price is required.");
}

data.price = Number(finalPrice);

// PRODUCT UNIT

if (data.unit !== undefined) {
data.unit = String(data.unit).trim();
}

// DESCRIPTION

if (data.description !== undefined) {
data.description = String(data.description).trim();
}

// SELLER INFORMATION

// Currently all products belong to ORGANIGO.
// Partner seller support will be added later
// with proper seller authentication.

data.sellerType = "ORGANIGO";
data.sellerId = null;

return data;
};

// =====================================================
// GET ACTIVE PRODUCTS - CUSTOMER
// =====================================================

router.get("/", async (req, res) => {
try {
const products = await Product.find({
isActive: true,
})
.select("-purchasePrice -variants.purchasePrice -sellerId")
.sort({ createdAt: -1 });

res.status(200).json({
  success: true,
  count: products.length,
  products,
});

} catch (error) {
sendError(res, error, "Unable to fetch products.");
}
});

// =====================================================
// GET ACTIVE PRODUCTS - ADMIN
// =====================================================

router.get(
"/admin/all",
protect,
authorize("admin", "superadmin"),
async (req, res) => {
try {
const products = await Product.find({
isActive: true,
}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
} catch (error) {
  sendError(res, error, "Unable to fetch products.");
}

}
);

// =====================================================
// GET DELETED PRODUCTS - ADMIN
// =====================================================

router.get(
"/admin/deleted",
protect,
authorize("admin", "superadmin"),
async (req, res) => {
try {
const products = await Product.find({
isActive: false,
}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
} catch (error) {
  sendError(res, error, "Unable to fetch deleted products.");
}

}
);

// =====================================================
// GET SINGLE PRODUCT - ADMIN
// =====================================================

router.get(
"/admin/:id",
protect,
authorize("admin", "superadmin"),
async (req, res) => {
try {
if (!isValidId(req.params.id)) {
return res.status(400).json({
success: false,
message: "Invalid product ID.",
});
}

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  res.status(200).json({
    success: true,
    product,
  });
} catch (error) {
  sendError(res, error, "Unable to fetch product.");
}

}
);

// =====================================================
// RESTORE PRODUCT - ADMIN
// =====================================================

router.patch(
"/:id/restore",
protect,
authorize("admin", "superadmin"),
async (req, res) => {
try {
if (!isValidId(req.params.id)) {
return res.status(400).json({
success: false,
message: "Invalid product ID.",
});
}

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
  sendError(res, error, "Unable to restore product.");
}

}
);

// =====================================================
// ADD NEW PRODUCT - ADMIN
// =====================================================

router.post(
"/",
protect,
authorize("admin", "superadmin"),
async (req, res) => {
try {
const productData = await buildProductData(req.body);

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    message: "Product added successfully.",
    product,
  });
} catch (error) {
  sendError(res, error, "Unable to add product.");
}

}
);

// =====================================================
// UPDATE PRODUCT - ADMIN
// =====================================================

router.put(
"/:id",
protect,
authorize("admin", "superadmin"),
async (req, res) => {
try {
if (!isValidId(req.params.id)) {
return res.status(400).json({
success: false,
message: "Invalid product ID.",
});
}

  const existingProduct = await Product.findById(
    req.params.id
  );

  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  const updateData = await buildProductData(
    req.body,
    existingProduct
  );

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    product,
  });
} catch (error) {
  sendError(res, error, "Unable to update product.");
}

}
);

// =====================================================
// SOFT DELETE PRODUCT - ADMIN
// =====================================================

router.delete(
"/:id",
protect,
authorize("admin", "superadmin"),
async (req, res) => {
try {
if (!isValidId(req.params.id)) {
return res.status(400).json({
success: false,
message: "Invalid product ID.",
});
}

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
  sendError(res, error, "Unable to delete product.");
}

}
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;