import React, { useEffect, useState, useCallback, useMemo } from "react";

import { getToken } from "../../utils/auth";
import API_BASE_URL from "../../services/api";

import "./CategoryManagement.css";

const API_URL = `${API_BASE_URL}/api/categories`;

// =====================================
// CREATE SLUG
// =====================================

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// =====================================
// GET PARENT ID
// =====================================

function getParentId(category) {
  if (!category?.parentCategory) return "";

  if (typeof category.parentCategory === "object") {
    return category.parentCategory._id || "";
  }

  return category.parentCategory;
}

// =====================================
// COMPONENT
// =====================================

function CategoryManagement() {
  const token = getToken();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initialForm = {
    name: "",
    description: "",
    image: "",
    parentCategory: "",
    sortOrder: 0,
  };

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // =====================================
  // FETCH CATEGORIES
  // =====================================

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/all`, {
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
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // =====================================
  // ORGANIZE CATEGORY TREE
  // =====================================

  const categoryTree = useMemo(() => {
    const sortedCategories = [...categories].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    const mainCategories = sortedCategories.filter(
      (category) => !getParentId(category)
    );

    const subCategories = sortedCategories.filter(
      (category) => getParentId(category)
    );

    const tree = mainCategories.map((mainCategory) => ({
      ...mainCategory,

      children: subCategories
        .filter(
          (subCategory) =>
            getParentId(subCategory) === mainCategory._id
        )
        .sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
        ),
    }));

    return {
      mainCategories: tree,

      // Categories whose parent is missing
      // are displayed separately instead of disappearing.
      unassignedCategories: subCategories.filter(
        (subCategory) =>
          !mainCategories.some(
            (mainCategory) =>
              mainCategory._id === getParentId(subCategory)
          )
      ),
    };
  }, [categories]);

  // =====================================
  // FORM INPUT
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
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
  // ADD / UPDATE CATEGORY
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter category name.");
      return;
    }

    if (!token) {
      setError("Please log in again.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        slug: createSlug(form.name),
        description: form.description.trim(),
        image: form.image,
        parentCategory: form.parentCategory || null,
        sortOrder: Number(form.sortOrder) || 0,
      };

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save category.");
      }

      const message = editingId
        ? "Category updated successfully!"
        : "Category created successfully!";

      resetForm();

      setSuccess(message);

      await fetchCategories();
    } catch (err) {
      console.error("Save Category Error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // EDIT CATEGORY
  // =====================================

  const handleEdit = (category) => {
    setEditingId(category._id);

    setForm({
      name: category.name || "",
      description: category.description || "",
      image: category.image || "",
      parentCategory: getParentId(category),
      sortOrder: category.sortOrder ?? 0,
    });

    setImagePreview(category.image || "");

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // ACTIVATE / DEACTIVATE
  // =====================================

  const toggleStatus = async (category) => {
    const action = category.isActive ? "deactivate" : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${category.name}?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${category._id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            isActive: !category.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update category status."
        );
      }

      setSuccess(
        `${category.name} status updated successfully!`
      );

      await fetchCategories();
    } catch (err) {
      console.error("Category Status Error:", err);
      setError(err.message);
    }
  };

  // =====================================
  // CATEGORY ROW
  // =====================================

  const renderCategoryRow = (category, isSubCategory = false) => {
    return (
      <tr
        key={category._id}
        className={
          isSubCategory
            ? "category-subcategory-row"
            : "category-main-row"
        }
      >
        <td>
          <div
            className={`category-name-cell ${
              isSubCategory ? "category-child-name" : ""
            }`}
          >
            {isSubCategory && (
              <span className="category-tree-line">└──</span>
            )}

            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
              />
            ) : (
              <div className="category-placeholder">
                {isSubCategory ? "📁" : "📂"}
              </div>
            )}

            <strong>{category.name}</strong>
          </div>
        </td>

        <td>
          <span className="category-type-badge">
            {isSubCategory ? "Subcategory" : "Main Category"}
          </span>
        </td>

        <td>
          {isSubCategory
            ? categoryTree.mainCategories.find(
                (item) => item._id === getParentId(category)
              )?.name || "—"
            : "—"}
        </td>

        <td>{category.sortOrder ?? 0}</td>

        <td>
          <span
            className={`category-status ${
              category.isActive ? "active" : "inactive"
            }`}
          >
            {category.isActive ? "Active" : "Inactive"}
          </span>
        </td>

        <td>
          <div className="category-actions">
            <button
              type="button"
              className="category-edit-btn"
              onClick={() => handleEdit(category)}
            >
              Edit
            </button>

            <button
              type="button"
              className="category-status-btn"
              onClick={() => toggleStatus(category)}
            >
              {category.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <section className="category-management">

      {/* HEADER */}

      <div className="category-page-header">
        <div>
          <span className="category-eyebrow">
            ORGANIGO MANAGEMENT
          </span>

          <h1>Category Management</h1>

          <p>
            Manage your product categories and subcategories.
          </p>
        </div>

        <div className="category-total">
          <strong>{categories.length}</strong>
          <span>Total Categories</span>
        </div>
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="category-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="category-message success">
          {success}
        </div>
      )}

      {/* CATEGORY FORM */}

      <div className="category-form-card">
        <div className="category-card-heading">
          <div>
            <h2>
              {editingId ? "Edit Category" : "Create New Category"}
            </h2>

            <p>
              Add a main category or create a subcategory.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="category-form-grid">

            <div className="category-field">
              <label>Category Name *</label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Example: Fruits"
                required
              />
            </div>

            <div className="category-field">
              <label>Parent Category</label>

              <select
                name="parentCategory"
                value={form.parentCategory}
                onChange={handleChange}
              >
                <option value="">Main Category</option>

                {categoryTree.mainCategories
                  .filter((item) => item._id !== editingId)
                  .map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="category-field">
              <label>Sort Order</label>

              <input
                type="number"
                name="sortOrder"
                value={form.sortOrder}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="category-field">
              <label>Category Image</label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="category-field">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter category description..."
              rows="3"
            />
          </div>

          {imagePreview && (
            <div className="category-image-preview">
              <img
                src={imagePreview}
                alt="Category preview"
              />
            </div>
          )}

          <div className="category-form-actions">
            <button
              type="submit"
              className="category-save-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Category"
                : "Create Category"}
            </button>

            {editingId && (
              <button
                type="button"
                className="category-cancel-btn"
                onClick={() => {
                  resetForm();
                  setError("");
                  setSuccess("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CATEGORY TREE LIST */}

      <div className="category-list-card">
        <div className="category-card-heading">
          <div>
            <h2>All Categories</h2>
            <p>
              Main categories and their subcategories.
            </p>
          </div>

          <button
            type="button"
            className="category-refresh-btn"
            onClick={fetchCategories}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="category-empty">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="category-empty">
            <span>📂</span>
            <h3>No Categories Found</h3>
            <p>Create your first category above.</p>
          </div>
        ) : (
          <div className="category-table-wrapper">
            <table className="category-table">

              <thead>
                <tr>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Parent</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categoryTree.mainCategories.map((mainCategory) => (
                  <React.Fragment key={mainCategory._id}>
                    {renderCategoryRow(mainCategory)}

                    {mainCategory.children.map((subCategory) =>
                      renderCategoryRow(subCategory, true)
                    )}
                  </React.Fragment>
                ))}

                {categoryTree.unassignedCategories.map(
                  (category) => renderCategoryRow(category, true)
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </section>
  );
}

export default CategoryManagement;