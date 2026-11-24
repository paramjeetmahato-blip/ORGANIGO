function AddProduct({
product,
setProduct,
editProduct,
setEditProduct,
editingProductId,
preview,
onChange,
onEditChange,
onImageChange,
onEditImageChange,
onSubmit,
onUpdate,
onCancelEdit,
}) {
return (
<section className="admin-product-management">
<div className="admin-container">
<div className="admin-section-title">
<div>
<h2>
{editingProductId ? "Edit Product" : "Add New Product"}
</h2>

        <p>
          {editingProductId
            ? "Update product details and stock."
            : "Add products to your ORGANIGO store."}
        </p>
      </div>
    </div>

    {/* EDIT PRODUCT FORM */}
    {editingProductId ? (
      <form onSubmit={onUpdate}>
        <div className="image-upload">
          <label>Product Image</label>

          <div className="image-preview">
            {editProduct.image ? (
              <img src={editProduct.image} alt="Product Preview" />
            ) : (
              <span>📷 No Product Image</span>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={onEditImageChange}
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Product Name</label>
            <input
              name="name"
              value={editProduct.name}
              onChange={onEditChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={editProduct.category}
              onChange={onEditChange}
            >
              <option>Fruits</option>
              <option>Vegetables</option>
              <option>Dairy</option>
              <option>Bakery</option>
              <option>Snacks</option>
              <option>Beverages</option>
              <option>Grocery</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Weight</label>
            <input
              name="unit"
              value={editProduct.unit}
              onChange={onEditChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Selling Price (₹)</label>
            <input
              type="number"
              name="price"
              min="0"
              value={editProduct.price}
              onChange={onEditChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Original Price (₹)</label>
            <input
              type="number"
              name="originalPrice"
              min="0"
              value={editProduct.originalPrice}
              onChange={onEditChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Stock Quantity</label>
            <input
              type="number"
              name="stock"
              min="0"
              value={editProduct.stock}
              onChange={onEditChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Product Description</label>
          <textarea
            name="description"
            value={editProduct.description}
            onChange={onEditChange}
          />
        </div>

        <div className="admin-product-flags">
          <label>
            <input
              type="checkbox"
              name="isSpecial"
              checked={editProduct.isSpecial}
              onChange={onEditChange}
            />
            ⭐ Special Product
          </label>

          <label>
            <input
              type="checkbox"
              name="isDemanding"
              checked={editProduct.isDemanding}
              onChange={onEditChange}
            />
            🔥 Demanding Product
          </label>

          <label>
            <input
              type="checkbox"
              name="isOnOffer"
              checked={editProduct.isOnOffer}
              onChange={onEditChange}
            />
            🏷️ Show in Offers
          </label>
        </div>

        <div className="admin-product-form-actions">
          <button type="submit" className="save-product-btn">
            💾 Update Product
          </button>

          <button
            type="button"
            className="cancel-edit-btn"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        </div>
      </form>
    ) : (
      /* ADD PRODUCT FORM */
      <form onSubmit={onSubmit}>
        <div className="image-upload">
          <label>Product Image</label>

          <div className="image-preview">
            {preview ? (
              <img src={preview} alt="Product Preview" />
            ) : (
              <span>📷 Upload Product Photo</span>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            required
          />

          <small className="field-help">
            Maximum image size: 2 MB.
          </small>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              placeholder="Example: Fresh Apple"
              value={product.name}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={product.category}
              onChange={onChange}
            >
              <option>Fruits</option>
              <option>Vegetables</option>
              <option>Dairy</option>
              <option>Bakery</option>
              <option>Snacks</option>
              <option>Beverages</option>
              <option>Grocery</option>
            </select>
          </div>

          <div className="form-group">
            <label>Product Weight</label>
            <input
              type="text"
              name="weight"
              placeholder="Example: 1 kg"
              value={product.weight}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Selling Price (₹)</label>
            <input
              type="number"
              name="price"
              min="0"
              value={product.price}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Original Price (₹)</label>
            <input
              type="number"
              name="oldPrice"
              min="0"
              value={product.oldPrice}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Stock Quantity</label>
            <input
              type="number"
              name="stock"
              min="0"
              value={product.stock}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Product Description</label>
          <textarea
            name="description"
            placeholder="Write product details..."
            value={product.description}
            onChange={onChange}
          />
        </div>

        <div className="admin-product-flags">
          <label>
            <input
              type="checkbox"
              name="isSpecial"
              checked={product.isSpecial}
              onChange={onChange}
            />
            ⭐ Special Product
          </label>

          <label>
            <input
              type="checkbox"
              name="isDemanding"
              checked={product.isDemanding}
              onChange={onChange}
            />
            🔥 Demanding Product
          </label>

          <label>
            <input
              type="checkbox"
              name="isOnOffer"
              checked={product.isOnOffer}
              onChange={onChange}
            />
            🏷️ Show in Offers
          </label>
        </div>

        <button type="submit" className="save-product-btn">
          ＋ Add Product
        </button>
      </form>
    )}
  </div>
</section>

);
}

export default AddProduct;