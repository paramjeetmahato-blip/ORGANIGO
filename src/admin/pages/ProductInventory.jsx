import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getToken } from "../../utils/auth";
import API_BASE_URL from "../../services/api";

import "./ProductInventory.css";

const API_URL = `${API_BASE_URL}/api`;

const initialForm = {
  name: "",
  description: "",
  image: "",
  categoryId: "",
  subCategoryId: "",
  productType: "retail",
  pricingMode: "single",
  purchasePrice: "",
  price: "",
  originalPrice: "",
  unit: "1 kg",
  minOrderQuantity: 1,
  stock: 0,
  bulkPriceTiers: [],
  variants: [],
  isSpecial: false,
  isDemanding: false,
  isOnOffer: false,
};

// =====================================
// HELPERS
// =====================================

const getParentId = (category) => {
  if (!category?.parentCategory) return "";

  return typeof category.parentCategory === "object"
    ? category.parentCategory._id
    : category.parentCategory;
};

const formatPrice = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

const calculateProfit = (purchase, selling) => {
  return Number(selling || 0) - Number(purchase || 0);
};

// =====================================
// COMPONENT
// =====================================

function ProductInventory() {
  const token = getToken();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // =====================================
  // CATEGORY STRUCTURE
  // =====================================

  const mainCategories = useMemo(() => {
    return categories
      .filter((item) => !getParentId(item) && item.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const subCategories = useMemo(() => {
    return categories
      .filter(
        (item) =>
          getParentId(item) === form.categoryId &&
          item.isActive
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, form.categoryId]);

  // =====================================
  // FETCH PRODUCTS
  // =====================================

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/products/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load products.");
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error("Product Fetch Error:", err);
      setError(err.message);
    }
  }, [token]);

  // =====================================
  // FETCH CATEGORIES
  // =====================================

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/categories/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load categories.");
      }

      setCategories(
        Array.isArray(data.categories) ? data.categories : []
      );
    } catch (err) {
      console.error("Category Fetch Error:", err);
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);

      setLoading(false);
    };

    loadData();
  }, [fetchProducts, fetchCategories]);

  // =====================================
  // FORM CHANGE
  // =====================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "categoryId") {
      setForm((previous) => ({
        ...previous,
        categoryId: value,
        subCategoryId: "",
      }));
    }
  };

  // =====================================
  // IMAGE UPLOAD
  // =====================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((previous) => ({
        ...previous,
        image: reader.result,
      }));

      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // =====================================
  // RESET FORM
  // =====================================

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setImagePreview("");
  };

  // =====================================
  // BULK PRICE TIERS
  // =====================================

  const addBulkTier = () => {
    setForm((previous) => ({
      ...previous,
      bulkPriceTiers: [
        ...previous.bulkPriceTiers,
        {
          minQuantity: 5,
          maxQuantity: null,
          price: "",
        },
      ],
    }));
  };

  const updateBulkTier = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      bulkPriceTiers: previous.bulkPriceTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  };

  const removeBulkTier = (index) => {
    setForm((previous) => ({
      ...previous,
      bulkPriceTiers: previous.bulkPriceTiers.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // =====================================
  // VARIANTS
  // =====================================

  const addVariant = () => {
    setForm((previous) => ({
      ...previous,
      variants: [
        ...previous.variants,
        {
          name: "",
          sku: "",
          unit: "1 kg",
          purchasePrice: 0,
          price: "",
          originalPrice: 0,
          stock: 0,
          bulkPriceTiers: [],
          isActive: true,
        },
      ],
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const removeVariant = (index) => {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.filter((_, i) => i !== index),
    }));
  };

  // =====================================
  // SAVE PRODUCT
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a main category.");
      return;
    }

    if (
      form.pricingMode === "variants" &&
      form.variants.length === 0
    ) {
      setError("Please add at least one product variant.");
      return;
    }

    if (
      form.pricingMode !== "variants" &&
      (form.price === "" || Number(form.price) < 0)
    ) {
      setError("Please enter a valid selling price.");
      return;
    }

    if (
      form.pricingMode === "variants" &&
      form.variants.some(
        (variant) =>
          !variant.name.trim() ||
          variant.price === "" ||
          Number(variant.price) < 0
      )
    ) {
      setError("Every variant needs a name and valid selling price.");
      return;
    }

    const payload = {
      ...form,

      purchasePrice: Number(form.purchasePrice || 0),
      price:
        form.pricingMode === "variants"
          ? Math.min(
              ...form.variants.map((variant) => Number(variant.price))
            )
          : Number(form.price),

      originalPrice: Number(form.originalPrice || 0),
      stock: Number(form.stock || 0),
      minOrderQuantity: Number(form.minOrderQuantity || 1),

      bulkPriceTiers: form.bulkPriceTiers.map((tier) => ({
        minQuantity: Number(tier.minQuantity),
        maxQuantity:
          tier.maxQuantity === "" || tier.maxQuantity === null
            ? null
            : Number(tier.maxQuantity),
        price: Number(tier.price),
      })),

      variants: form.variants.map((variant) => ({
        ...variant,
        purchasePrice: Number(variant.purchasePrice || 0),
        price: Number(variant.price),
        originalPrice: Number(variant.originalPrice || 0),
        stock: Number(variant.stock || 0),
        bulkPriceTiers: (variant.bulkPriceTiers || []).map((tier) => ({
          minQuantity: Number(tier.minQuantity),
          maxQuantity:
            tier.maxQuantity === "" || tier.maxQuantity === null
              ? null
              : Number(tier.maxQuantity),
          price: Number(tier.price),
        })),
      })),

      sellerType: "ORGANIGO",
      sellerId: null,
    };

    try {
      setSaving(true);

      const response = await fetch(
        editingId
          ? `${API_URL}/products/${editingId}`
          : `${API_URL}/products`,
        {
          method: editingId ? "PUT" : "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save product.");
      }

      setSuccess(
        editingId
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      resetForm();

      await fetchProducts();
    } catch (err) {
      console.error("Save Product Error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // EDIT PRODUCT
  // =====================================

  const handleEdit = (product) => {
    setEditingId(product._id);

    setForm({
      ...initialForm,
      ...product,

      categoryId: product.categoryId?._id || product.categoryId || "",
      subCategoryId:
        product.subCategoryId?._id || product.subCategoryId || "",

      purchasePrice: product.purchasePrice ?? "",
      price: product.price ?? "",
      originalPrice: product.originalPrice ?? "",
      stock: product.stock ?? 0,

      bulkPriceTiers: product.bulkPriceTiers || [],
      variants: product.variants || [],
    });

    setImagePreview(product.image || "");

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // DELETE PRODUCT
  // =====================================

  const handleDelete = async (product) => {
    if (
      !window.confirm(
        `Move "${product.name}" to Deleted Products?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/products/${product._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete product.");
      }

      setSuccess("Product moved to Deleted Products.");

      await fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  // =====================================
  // FILTER PRODUCTS
  // =====================================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        filterType === "all" ||
        product.productType === filterType;

      return matchesSearch && matchesType;
    });
  }, [products, search, filterType]);

  // =====================================
  // SUMMARY
  // =====================================

  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) => Number(product.stock || 0) <= 5
  ).length;

  const totalVariants = products.reduce(
    (total, product) => total + (product.variants?.length || 0),
    0
  );

  // =====================================
  // RENDER
  // =====================================

  return (
    <section className="product-inventory">

      {/* HEADER */}

      <div className="pi-header">
        <div>
          <span className="pi-eyebrow">ORGANIGO MANAGEMENT</span>
          <h1>Product Inventory</h1>
          <p>Manage products, pricing, variants and stock.</p>
        </div>
      </div>

      {/* MESSAGES */}

      {error && <div className="pi-message error">{error}</div>}
      {success && <div className="pi-message success">{success}</div>}

      {/* SUMMARY */}

      <div className="pi-summary-grid">
        <div className="pi-summary-card">
          <span>Total Products</span>
          <strong>{totalProducts}</strong>
        </div>

        <div className="pi-summary-card">
          <span>Low Stock</span>
          <strong>{lowStockProducts}</strong>
        </div>

        <div className="pi-summary-card">
          <span>Total Variants</span>
          <strong>{totalVariants}</strong>
        </div>
      </div>

      {/* PRODUCT FORM */}

      <div className="pi-card">
        <div className="pi-card-heading">
          <div>
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <p>Create and manage ORGANIGO grocery products.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* BASIC DETAILS */}

          <h3 className="pi-form-section-title">Basic Information</h3>

          <div className="pi-form-grid">

            <div className="pi-field">
              <label>Product Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Example: Fresh Apple"
                required
              />
            </div>

            <div className="pi-field">
              <label>Main Category *</label>

              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>

                {mainCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pi-field">
              <label>Subcategory</label>

              <select
                name="subCategoryId"
                value={form.subCategoryId}
                onChange={handleChange}
                disabled={!form.categoryId || subCategories.length === 0}
              >
                <option value="">Select Subcategory</option>

                {subCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pi-field">
              <label>Product Image</label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

          </div>

          {imagePreview && (
            <div className="pi-image-preview">
              <img src={imagePreview} alt="Product preview" />
            </div>
          )}

          <div className="pi-field">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Describe your product..."
            />
          </div>

          {/* PRODUCT TYPE */}

          <h3 className="pi-form-section-title">Product Type</h3>

          <div className="pi-choice-grid">

            {[
              ["retail", "Retail", "Normal customer sales"],
              ["wholesale", "Wholesale", "Bulk quantity sales"],
              ["both", "Both", "Retail and wholesale"],
            ].map(([value, title, description]) => (
              <label
                key={value}
                className={`pi-choice ${
                  form.productType === value ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value={value}
                  checked={form.productType === value}
                  onChange={handleChange}
                />

                <strong>{title}</strong>
                <span>{description}</span>
              </label>
            ))}

          </div>

          {/* PRICING MODE */}

          <h3 className="pi-form-section-title">Pricing System</h3>

          <div className="pi-field pi-pricing-select">
            <label>Pricing Mode</label>

            <select
              name="pricingMode"
              value={form.pricingMode}
              onChange={handleChange}
            >
              <option value="single">Single Pricing</option>
              <option value="tiered">Bulk / Tiered Pricing</option>
              <option value="variants">Multiple Pack Sizes / Variants</option>
            </select>
          </div>

          {/* SINGLE / TIERED PRICING */}

          {form.pricingMode !== "variants" && (
            <>
              <div className="pi-form-grid">

                <div className="pi-field">
                  <label>Purchase Price (₹)</label>

                  <input
                    type="number"
                    name="purchasePrice"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={handleChange}
                    placeholder="Purchase cost"
                  />
                </div>

                <div className="pi-field">
                  <label>Selling Price (₹) *</label>

                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Selling price"
                    required
                  />
                </div>

                <div className="pi-field">
                  <label>Original Price (₹)</label>

                  <input
                    type="number"
                    name="originalPrice"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={handleChange}
                    placeholder="Optional MRP"
                  />
                </div>

                <div className="pi-field">
                  <label>Unit</label>

                  <input
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="Example: 1 kg"
                  />
                </div>

                <div className="pi-field">
                  <label>Available Stock</label>

                  <input
                    type="number"
                    name="stock"
                    min="0"
                    value={form.stock}
                    onChange={handleChange}
                  />
                </div>

                <div className="pi-field">
                  <label>Minimum Order Quantity</label>

                  <input
                    type="number"
                    name="minOrderQuantity"
                    min="1"
                    value={form.minOrderQuantity}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <div className="pi-profit-preview">
                Estimated Profit Per Unit:
                <strong>
                  {" "}
                  {formatPrice(
                    calculateProfit(
                      form.purchasePrice,
                      form.price
                    )
                  )}
                </strong>
              </div>
            </>
          )}

          {/* BULK PRICING */}

          {form.pricingMode === "tiered" && (
            <div className="pi-tier-section">
              <div className="pi-section-heading">
                <div>
                  <h3>Bulk Price Tiers</h3>
                  <p>Set different prices for different quantities.</p>
                </div>

                <button
                  type="button"
                  className="pi-secondary-btn"
                  onClick={addBulkTier}
                >
                  + Add Price Tier
                </button>
              </div>

              {form.bulkPriceTiers.map((tier, index) => (
                <div className="pi-tier-row" key={index}>

                  <div className="pi-field">
                    <label>Minimum Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={tier.minQuantity}
                      onChange={(e) =>
                        updateBulkTier(
                          index,
                          "minQuantity",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="pi-field">
                    <label>Maximum Quantity</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="No limit"
                      value={tier.maxQuantity ?? ""}
                      onChange={(e) =>
                        updateBulkTier(
                          index,
                          "maxQuantity",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="pi-field">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) =>
                        updateBulkTier(
                          index,
                          "price",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="pi-remove-btn"
                    onClick={() => removeBulkTier(index)}
                  >
                    Remove
                  </button>

                </div>
              ))}
            </div>
          )}

          {/* VARIANTS */}

          {form.pricingMode === "variants" && (
            <div className="pi-variant-section">

              <div className="pi-section-heading">
                <div>
                  <h3>Product Variants / Pack Sizes</h3>
                  <p>
                    Example: 1 kg, 5 kg, 10 kg and 25 kg.
                  </p>
                </div>

                <button
                  type="button"
                  className="pi-secondary-btn"
                  onClick={addVariant}
                >
                  + Add Variant
                </button>
              </div>

              {form.variants.map((variant, index) => (
                <div className="pi-variant-card" key={index}>

                  <div className="pi-variant-heading">
                    <h4>Variant {index + 1}</h4>

                    <button
                      type="button"
                      className="pi-remove-btn"
                      onClick={() => removeVariant(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="pi-form-grid">

                    <div className="pi-field">
                      <label>Variant Name *</label>

                      <input
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(index, "name", e.target.value)
                        }
                        placeholder="Apple 1 kg"
                      />
                    </div>

                    <div className="pi-field">
                      <label>SKU</label>

                      <input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                        placeholder="Optional SKU"
                      />
                    </div>

                    <div className="pi-field">
                      <label>Unit</label>

                      <input
                        value={variant.unit}
                        onChange={(e) =>
                          updateVariant(index, "unit", e.target.value)
                        }
                        placeholder="1 kg"
                      />
                    </div>

                    <div className="pi-field">
                      <label>Purchase Price (₹)</label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.purchasePrice}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "purchasePrice",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="pi-field">
                      <label>Selling Price (₹) *</label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(index, "price", e.target.value)
                        }
                      />
                    </div>

                    <div className="pi-field">
                      <label>Original Price (₹)</label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.originalPrice}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "originalPrice",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="pi-field">
                      <label>Stock</label>

                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, "stock", e.target.value)
                        }
                      />
                    </div>

                  </div>

                  <div className="pi-profit-preview">
                    Estimated Profit:
                    <strong>
                      {" "}
                      {formatPrice(
                        calculateProfit(
                          variant.purchasePrice,
                          variant.price
                        )
                      )}
                    </strong>
                  </div>

                </div>
              ))}

              {form.variants.length === 0 && (
                <div className="pi-empty">
                  No variants added yet.
                </div>
              )}

            </div>
          )}

          {/* PRODUCT FLAGS */}

          <h3 className="pi-form-section-title">Product Labels</h3>

          <div className="pi-checkbox-grid">

            <label>
              <input
                type="checkbox"
                name="isSpecial"
                checked={form.isSpecial}
                onChange={handleChange}
              />
              Special Product
            </label>

            <label>
              <input
                type="checkbox"
                name="isDemanding"
                checked={form.isDemanding}
                onChange={handleChange}
              />
              Popular / Demanding
            </label>

            <label>
              <input
                type="checkbox"
                name="isOnOffer"
                checked={form.isOnOffer}
                onChange={handleChange}
              />
              On Offer
            </label>

          </div>

          {/* ACTIONS */}

          <div className="pi-form-actions">

            <button
              type="submit"
              className="pi-primary-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Save Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="pi-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}

          </div>

        </form>
      </div>

      {/* PRODUCT LIST */}

      <div className="pi-card">

        <div className="pi-section-heading">
          <div>
            <h2>All Products</h2>
            <p>View and manage your product inventory.</p>
          </div>

          <button
            type="button"
            className="pi-secondary-btn"
            onClick={fetchProducts}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="pi-toolbar">

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Product Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="both">Both</option>
          </select>

        </div>

        {loading ? (
          <div className="pi-empty">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="pi-empty">
            <span>🥬</span>
            <h3>No Products Found</h3>
            <p>Add your first product using the form above.</p>
          </div>
        ) : (
          <div className="pi-table-wrapper">

            <table className="pi-table">

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Pricing</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id}>

                    <td>
                      <div className="pi-product-cell">

                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                          />
                        ) : (
                          <div className="pi-product-placeholder">
                            🥬
                          </div>
                        )}

                        <strong>{product.name}</strong>
                      </div>
                    </td>

                    <td>{product.category}</td>

                    <td>
                      <span className="pi-badge">
                        {product.productType || "Retail"}
                      </span>
                    </td>

                    <td>
                      {product.pricingMode || "Single"}
                    </td>

                    <td>{formatPrice(product.price)}</td>

                    <td>
                      <span
                        className={
                          Number(product.stock || 0) <= 5
                            ? "pi-stock-low"
                            : "pi-stock-normal"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td>
                      <div className="pi-table-actions">

                        <button
                          type="button"
                          className="pi-edit-btn"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="pi-delete-btn"
                          onClick={() => handleDelete(product)}
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </section>
  );
}

export default ProductInventory;