function ProductInventory({
  products,
  filteredProducts,
  productsLoading,
  productsError,
  productCategories,
  searchProduct,
  setSearchProduct,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  onRefresh,
  onResetFilters,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}) {
  const inStockCount = products.filter(
    (item) => Number(item.stock) > 5
  ).length;

  const lowStockCount = products.filter(
    (item) =>
      Number(item.stock) > 0 && Number(item.stock) <= 5
  ).length;

  const outOfStockCount = products.filter(
    (item) => Number(item.stock) <= 0
  ).length;

  return (
    <section className="admin-product-management">
      <div className="admin-container admin-product-list-container">
        <div className="admin-section-title">
          <div>
            <h2>📦 Product Inventory</h2>
            <p>Manage products, prices and available stock.</p>
          </div>

          <button
            className="admin-refresh-btn"
            onClick={onRefresh}
            disabled={productsLoading}
          >
            ↻ Refresh
          </button>
        </div>

        {/* INVENTORY FILTERS */}
        <div className="inventory-filters">
          <div className="inventory-search">
            <span>🔍</span>

            <input
              type="text"
              placeholder="Search products by name..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>

            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            aria-label="Filter by stock"
          >
            <option value="All">All Stock</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          <button type="button" onClick={onResetFilters}>
            Reset Filters
          </button>
        </div>

        {!productsLoading &&
          !productsError &&
          products.length > 0 && (
            <div className="inventory-result-count">
              Showing <strong>{filteredProducts.length}</strong> of{" "}
              <strong>{products.length}</strong> products
            </div>
          )}

        {/* INVENTORY SUMMARY */}
        <div className="admin-inventory-summary">
          <div>
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>

          <div>
            <span>In Stock</span>
            <strong>{inStockCount}</strong>
          </div>

          <div>
            <span>Out of Stock</span>
            <strong>{outOfStockCount}</strong>
          </div>

          <div>
            <span>Low Stock</span>
            <strong>{lowStockCount}</strong>
          </div>
        </div>

        {/* LOADING / ERROR / EMPTY STATES */}
        {productsLoading ? (
          <div className="admin-empty-state">
            Loading products...
          </div>
        ) : productsError ? (
          <div className="admin-empty-state">
            <h4>Unable to load products</h4>
            <p>{productsError}</p>

            <button
              className="admin-refresh-btn"
              onClick={onRefresh}
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            <span>🥬</span>
            <h4>No Products Found</h4>
            <p>Add your first product.</p>

            <button
              className="admin-refresh-btn"
              onClick={onAddProduct}
            >
              ＋ Add Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-empty-state">
            <span>🔍</span>
            <h4>No Matching Products</h4>
            <p>
              No products match your search or selected filters.
            </p>

            <button
              className="admin-refresh-btn"
              onClick={onResetFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* PRODUCT CARDS */
          <div className="admin-product-grid">
            {filteredProducts.map((item) => (
              <div className="admin-product-card" key={item._id}>
                <div className="admin-product-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <span>🥬</span>
                  )}
                </div>

                <div className="admin-product-info">
                  <span className="admin-product-category">
                    {item.category}
                  </span>

                  <h3>{item.name}</h3>

                  <p className="admin-product-unit">
                    {item.unit || "Unit not specified"}
                  </p>

                  <div className="admin-product-prices">
                    <strong>₹{item.price}</strong>

                    {Number(item.originalPrice) >
                      Number(item.price) && (
                      <del>₹{item.originalPrice}</del>
                    )}
                  </div>

                  <div className="admin-stock-row">
                    <span>Available Stock</span>

                    <strong>
                      {item.stock}{" "}
                      {Number(item.stock) === 1 ? "Unit" : "Units"}
                    </strong>
                  </div>

                  <div
                    className={`admin-stock-badge ${
                      Number(item.stock) <= 0
                        ? "out-stock"
                        : Number(item.stock) <= 5
                        ? "low-stock"
                        : "in-stock"
                    }`}
                  >
                    {Number(item.stock) <= 0
                      ? "Out of Stock"
                      : Number(item.stock) <= 5
                      ? "Low Stock"
                      : "In Stock"}
                  </div>

                  <div className="admin-product-flags-preview">
                    {item.isSpecial && <span>⭐ Special</span>}
                    {item.isDemanding && <span>🔥 Demanding</span>}
                    {item.isOnOffer && <span>🏷️ Offer</span>}
                  </div>

                  <div className="admin-product-actions">
                    <button
                      type="button"
                      onClick={() => onEditProduct(item)}
                    >
                      ✏️ Edit / Stock
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteProduct(item._id)}
                      className="delete-product-btn"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductInventory;