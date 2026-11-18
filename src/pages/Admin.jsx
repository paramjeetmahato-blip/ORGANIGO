import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

const API_URL = "http://10.124.82.244:5000/api";

const defaultDeliverySettings = {
  businessName: "ORGANIGO",
  address: "",
  city: "Chaibasa",
  state: "Jharkhand",
  pincode: "",
  latitude: "22.5504",
  longitude: "85.8025",
  radius: "10",
  active: true,
};

function getSavedDeliverySettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("organigoDeliverySettings") || "null"
    );

    return saved
      ? { ...defaultDeliverySettings, ...saved }
      : defaultDeliverySettings;
  } catch {
    return defaultDeliverySettings;
  }
}

function Admin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("organigoToken");

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("organigoUser") || "null"
    );
  } catch {
    currentUser = null;
  }

  const isAdmin = Boolean(token) && currentUser?.role === "admin";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin-login", { replace: true });
    }
  }, [isAdmin, navigate]);

  const logoutAdmin = useCallback(
    (message) => {
      localStorage.removeItem("organigoToken");
      localStorage.removeItem("organigoUser");

      navigate("/admin-login", {
        replace: true,
        state: { message },
      });
    },
    [navigate]
  );

  // PRODUCT FORM

  const [product, setProduct] = useState({
    name: "",
    category: "Fruits",
    weight: "",
    price: "",
    oldPrice: "",
    stock: "",
    description: "",
    image: null,
  });

  const [preview, setPreview] = useState("");

  // PRODUCT MANAGEMENT

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);

  const [editProduct, setEditProduct] = useState({
    name: "",
    category: "Fruits",
    price: "",
    originalPrice: "",
    unit: "",
    stock: "",
    description: "",
    image: "",
  });

  // INVENTORY FILTERS

  const [searchProduct, setSearchProduct] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  const productCategories = useMemo(() => {
    return [
      ...new Set(
        products
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const searchText = searchProduct.trim().toLowerCase();

      const matchesSearch =
        (item.name || "").toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const stock = Number(item.stock) || 0;

      let matchesStock = true;

      if (stockFilter === "In Stock") {
        matchesStock = stock > 5;
      } else if (stockFilter === "Low Stock") {
        matchesStock = stock > 0 && stock <= 5;
      } else if (stockFilter === "Out of Stock") {
        matchesStock = stock <= 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchProduct, categoryFilter, stockFilter]);

  const resetInventoryFilters = () => {
    setSearchProduct("");
    setCategoryFilter("All");
    setStockFilter("All");
  };

  // FETCH PRODUCTS

  const fetchProducts = useCallback(async () => {
    if (!token || currentUser?.role !== "admin") return;

    try {
      setProductsLoading(true);
      setProductsError("");

      const response = await fetch(`${API_URL}/products/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load products. Please try again."
        );
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      console.error("Fetch Products Error:", error);
      setProductsError(error.message);
    } finally {
      setProductsLoading(false);
    }
  }, [token, currentUser?.role, logoutAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === "inventory") {
      fetchProducts();
    }
  }, [isAdmin, activeTab, fetchProducts]);

  // EDIT PRODUCT

  const startEditProduct = (item) => {
    setEditingProductId(item._id);

    setEditProduct({
      name: item.name || "",
      category: item.category || "Fruits",
      price: item.price ?? "",
      originalPrice: item.originalPrice ?? "",
      unit: item.unit || "",
      stock: item.stock ?? "",
      description: item.description || "",
      image: item.image || "",
    });

    setActiveTab("addProduct");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditProduct((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // UPDATE PRODUCT

  const updateProduct = async (e) => {
    e.preventDefault();

    if (!editingProductId) return;

    try {
      const response = await fetch(
        `${API_URL}/products/${editingProductId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editProduct,
            price: Number(editProduct.price),
            originalPrice: Number(editProduct.originalPrice),
            stock: Number(editProduct.stock),
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update product.");
      }

      alert("Your product has been updated successfully!");

      setEditingProductId(null);

      await fetchProducts();

      window.dispatchEvent(new Event("organigoProductsUpdated"));

      setActiveTab("inventory");
    } catch (error) {
      console.error("Update Product Error:", error);
      alert(error.message);
    }
  };

  // DELETE PRODUCT

  const deleteProduct = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete product.");
      }

      alert("Your product has been deleted successfully!");

      await fetchProducts();

      window.dispatchEvent(new Event("organigoProductsUpdated"));
    } catch (error) {
      console.error("Delete Product Error:", error);
      alert(error.message);
    }
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);

    setEditProduct({
      name: "",
      category: "Fruits",
      price: "",
      originalPrice: "",
      unit: "",
      stock: "",
      description: "",
      image: "",
    });

    setActiveTab("inventory");
  };

  // DELIVERY SETTINGS

  const [deliverySettings, setDeliverySettings] = useState(
    getSavedDeliverySettings
  );

  const [settingsMessage, setSettingsMessage] = useState("");

  // ORDERS

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // RIDER MANAGEMENT

  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState("");

  // FETCH ORDERS

  const fetchOrders = useCallback(async () => {
    if (!token || currentUser?.role !== "admin") {
      setOrdersError("Please log in with an Admin account.");
      setOrders([]);
      return;
    }

    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch orders.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      setOrdersError(error.message);
    } finally {
      setOrdersLoading(false);
    }
  }, [token, currentUser?.role, logoutAdmin]);

  // FETCH ACTIVE RIDERS

  const fetchRiders = useCallback(async () => {
    if (!token || currentUser?.role !== "admin") return;

    try {
      setRidersLoading(true);

      const response = await fetch(`${API_URL}/orders/riders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load delivery riders.");
      }

      setRiders(Array.isArray(data.riders) ? data.riders : []);
    } catch (error) {
      console.error("Fetch Riders Error:", error);
      alert(error.message || "Unable to load delivery riders.");
    } finally {
      setRidersLoading(false);
    }
  }, [token, currentUser?.role, logoutAdmin]);

  // ASSIGN RIDER TO ORDER

  const assignRider = async (orderId, riderId) => {
    if (!riderId) return;

    try {
      setAssigningOrder(orderId);

      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(orderId)}/assign-rider`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ riderId }),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to assign delivery rider.");
      }

      if (data.order) {
        setOrders((previousOrders) =>
          previousOrders.map((order) =>
            order.orderId === orderId ? data.order : order
          )
        );
      } else {
        await fetchOrders();
      }

      alert("Delivery rider assigned successfully!");
    } catch (error) {
      console.error("Assign Rider Error:", error);
      alert(error.message || "Unable to assign delivery rider.");
    } finally {
      setAssigningOrder("");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      fetchRiders();
    }
  }, [fetchOrders, fetchRiders, isAdmin]);

  // ADD PRODUCT INPUT

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // PRODUCT IMAGE UPLOAD

  const handleImage = (e) => {
    const file = e.target.files[0];

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
      setProduct((prev) => ({
        ...prev,
        image: reader.result,
      }));

      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ADD PRODUCT

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.image) {
      alert("Please upload a product image.");
      return;
    }

    if (!token || currentUser?.role !== "admin") {
      logoutAdmin("Please log in with an Admin account.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: product.name.trim(),
          category: product.category,
          price: Number(product.price),
          originalPrice: Number(product.oldPrice),
          unit: product.weight.trim(),
          stock: Number(product.stock),
          description: product.description,
          image: product.image,
        }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to add product.");
      }

      alert("Your product has been added successfully!");

      setProduct({
        name: "",
        category: "Fruits",
        weight: "",
        price: "",
        oldPrice: "",
        stock: "",
        description: "",
        image: null,
      });

      setPreview("");
      e.target.reset();

      window.dispatchEvent(new Event("organigoProductsUpdated"));

      await fetchProducts();

      setActiveTab("inventory");
    } catch (error) {
      console.error("Add Product Error:", error);
      alert(error.message || "Unable to save product. Please try again.");
    }
  };

  // DELIVERY SETTINGS INPUT

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;

    setDeliverySettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSettingsMessage("");
  };

  // SAVE DELIVERY SETTINGS

  const saveDeliverySettings = (e) => {
    e.preventDefault();

    const latitude = Number(deliverySettings.latitude);
    const longitude = Number(deliverySettings.longitude);
    const radius = Number(deliverySettings.radius);

    if (
      !deliverySettings.address.trim() ||
      !deliverySettings.city.trim() ||
      !deliverySettings.state.trim()
    ) {
      alert("Please enter the complete hub address.");
      return;
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      alert("Please enter a valid latitude.");
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      alert("Please enter a valid longitude.");
      return;
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      alert("Please enter a valid delivery radius.");
      return;
    }

    const updatedSettings = {
      ...deliverySettings,
      latitude: String(latitude),
      longitude: String(longitude),
      radius: String(radius),
    };

    localStorage.setItem(
      "organigoDeliverySettings",
      JSON.stringify(updatedSettings)
    );

    setDeliverySettings(updatedSettings);

    window.dispatchEvent(
      new Event("organigoDeliverySettingsUpdated")
    );

    setSettingsMessage("Delivery settings saved successfully!");

    alert("Your delivery settings have been updated successfully!");
  };

  // OPEN HUB MAP

  const openHubMap = () => {
    window.open(
      `https://www.google.com/maps?q=${deliverySettings.latitude},${deliverySettings.longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // UPDATE ORDER STATUS

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!token || currentUser?.role !== "admin") {
      logoutAdmin("Please log in with an Admin account.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        logoutAdmin(
          data.message || "Your session has expired. Please log in again."
        );
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update order status.");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.orderId === orderId ? data.order : order
        )
      );

      alert("Order status has been updated successfully!");
    } catch (error) {
      console.error("Update Status Error:", error);
      alert(error.message);
      fetchOrders();
    }
  };

  if (!isAdmin) return null;

  // DASHBOARD CALCULATIONS

  const pendingOrders = orders.filter(
    (order) => !["Delivered", "Cancelled"].includes(order.status)
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status === "Delivered")
    .reduce((total, order) => total + Number(order.total || 0), 0);

  // SIDEBAR MENU

  const menuItems = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "addProduct", icon: "＋", label: "Add Product" },
    { id: "inventory", icon: "📦", label: "Product Inventory" },
    { id: "orders", icon: "🛒", label: "Customer Orders" },
    { id: "delivery", icon: "🚚", label: "Delivery Settings" },
  ];

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // MAIN UI
return (
  <div className="admin-layout">
    {sidebarOpen && (
      <div
        className="admin-sidebar-overlay"
        onClick={() => setSidebarOpen(false)}
      />
    )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">🌿</div>
          <div>
            <h2>ORGANIGO</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="admin-menu-label">MAIN MENU</div>

        <nav className="admin-navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${
                activeTab === item.id ? "active" : ""
              }`}
              onClick={() => changeTab(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">A</div>
            <div>
              <strong>{currentUser?.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            className="admin-logout-btn"
            onClick={() => logoutAdmin("You have logged out successfully.")}
          >
            ↪ Logout
          </button>

          <button
            className="admin-website-btn"
            onClick={() => navigate("/")}
          >
            ← Back to Website
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-mobile-menu"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>

            <div>
              <h2>
                {menuItems.find((item) => item.id === activeTab)?.label}
              </h2>
              <p>Welcome back, {currentUser?.name || "Admin"}!</p>
            </div>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-live-dot" />
            <span>System Online</span>
          </div>
        </header>

        <div className="admin-content">
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <section>
              <div className="admin-welcome-banner">
                <div>
                  <span>ORGANIGO MANAGEMENT</span>
                  <h1>Good day, {currentUser?.name || "Admin"}! 👋</h1>
                  <p>Manage your grocery business from one place.</p>
                </div>
                <div className="admin-welcome-illustration">🛍️</div>
              </div>

              <div className="admin-section-title">
                <div>
                  <h2>Business Overview</h2>
                  <p>Your store activity at a glance.</p>
                </div>
                <button
                  className="admin-refresh-btn"
                  onClick={fetchOrders}
                  disabled={ordersLoading}
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon green">🛒</div>
                  <span>Total Orders</span>
                  <h3>{orders.length}</h3>
                  <small>All customer orders</small>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon orange">📦</div>
                  <span>Active Orders</span>
                  <h3>{pendingOrders}</h3>
                  <small>Orders to process</small>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon blue">✓</div>
                  <span>Delivered Orders</span>
                  <h3>{deliveredOrders}</h3>
                  <small>Successfully delivered</small>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon purple">₹</div>
                  <span>Delivered Revenue</span>
                  <h3>₹{totalRevenue.toLocaleString("en-IN")}</h3>
                  <small>From delivered orders</small>
                </div>
              </div>

              <div className="admin-dashboard-grid">
                <div className="admin-panel-card">
                  <div className="admin-panel-heading">
                    <div>
                      <h3>Recent Orders</h3>
                      <p>Latest customer activity</p>
                    </div>
                    <button onClick={() => changeTab("orders")}>
                      View All →
                    </button>
                  </div>

                  {ordersLoading && orders.length === 0 ? (
                    <div className="admin-empty-state">Loading orders...</div>
                  ) : ordersError ? (
                    <div className="admin-empty-state">{ordersError}</div>
                  ) : orders.length === 0 ? (
                    <div className="admin-empty-state">
                      <span>📦</span>
                      <h4>No orders yet</h4>
                      <p>Customer orders will appear here.</p>
                    </div>
                  ) : (
                    <div className="admin-recent-orders">
                      {[...orders].reverse().slice(0, 5).map((order) => (
                        <div
                          className="admin-recent-order"
                          key={order.orderId}
                        >
                          <div>
                            <strong>#{order.orderId}</strong>
                            <span>{order.customer?.name || "Customer"}</span>
                          </div>
                          <div>
                            <strong>₹{order.total}</strong>
                            <span className="admin-mini-status">
                              {order.status || "Order Placed"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-panel-card admin-quick-actions">
                  <div className="admin-panel-heading">
                    <div>
                      <h3>Quick Actions</h3>
                      <p>Manage your store quickly</p>
                    </div>
                  </div>

                  <button onClick={() => changeTab("addProduct")}>
                    <span>＋</span>
                    <div>
                      <strong>Add New Product</strong>
                      <small>Add grocery items to your store</small>
                    </div>
                    <b>→</b>
                  </button>

                  <button onClick={() => changeTab("inventory")}>
                    <span>📦</span>
                    <div>
                      <strong>Product Inventory</strong>
                      <small>Manage products and stock</small>
                    </div>
                    <b>→</b>
                  </button>

                  <button onClick={() => changeTab("orders")}>
                    <span>🛒</span>
                    <div>
                      <strong>Manage Orders</strong>
                      <small>Check and update customer orders</small>
                    </div>
                    <b>→</b>
                  </button>

                  <button onClick={() => changeTab("delivery")}>
                    <span>🚚</span>
                    <div>
                      <strong>Delivery Settings</strong>
                      <small>Manage your delivery hub</small>
                    </div>
                    <b>→</b>
                  </button>
                </div>
              </div>

              <div className="admin-store-status">
                <div>
                  <span
                    className={
                      deliverySettings.active
                        ? "status-dot"
                        : "status-dot inactive"
                    }
                  />
                  <div>
                    <strong>Store Delivery Status</strong>
                    <p>
                      {deliverySettings.active
                        ? "Your delivery service is active."
                        : "Your delivery service is currently inactive."}
                    </p>
                  </div>
                </div>
                <button onClick={() => changeTab("delivery")}>
                  Manage Settings →
                </button>
              </div>
            </section>
          )}

          {/* ADD PRODUCT */}
          {activeTab === "addProduct" && (
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
                        : "Add grocery products to your ORGANIGO store."}
                    </p>
                  </div>
                </div>

                {editingProductId ? (
                  <form onSubmit={updateProduct}>
                    <div className="image-upload">
                      <label>Product Image</label>
                      <div className="image-preview">
                        {editProduct.image ? (
                          <img
                            src={editProduct.image}
                            alt="Product Preview"
                          />
                        ) : (
                          <span>📷 No Product Image</span>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
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
                            setEditProduct((previous) => ({
                              ...previous,
                              image: reader.result,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Product Name</label>
                        <input
                          name="name"
                          value={editProduct.name}
                          onChange={handleEditChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Category</label>
                        <select
                          name="category"
                          value={editProduct.category}
                          onChange={handleEditChange}
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
                          onChange={handleEditChange}
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
                          onChange={handleEditChange}
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
                          onChange={handleEditChange}
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
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Product Description</label>
                      <textarea
                        name="description"
                        value={editProduct.description}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="admin-product-form-actions">
                      <button type="submit" className="save-product-btn">
                        💾 Update Product
                      </button>
                      <button
                        type="button"
                        className="cancel-edit-btn"
                        onClick={cancelEditProduct}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit}>
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
                        onChange={handleImage}
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
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Category</label>
                        <select
                          name="category"
                          value={product.category}
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                          onChange={handleChange}
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
                        onChange={handleChange}
                      />
                    </div>

                    <button type="submit" className="save-product-btn">
                      ＋ Add Product
                    </button>
                  </form>
                )}
              </div>
            </section>
          )}
                    {/* PRODUCT INVENTORY */}

          {activeTab === "inventory" && (
            <section className="admin-product-management">
              <div className="admin-container admin-product-list-container">
                <div className="admin-section-title">
                  <div>
                    <h2>📦 Product Inventory</h2>
                    <p>Manage products, prices and available stock.</p>
                  </div>

                  <button
                    className="admin-refresh-btn"
                    onClick={fetchProducts}
                    disabled={productsLoading}
                  >
                    ↻ Refresh
                  </button>
                </div>

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

                  <button
                    type="button"
                    onClick={resetInventoryFilters}
                  >
                    Reset Filters
                  </button>
                </div>

                {!productsLoading && !productsError && products.length > 0 && (
                  <div className="inventory-result-count">
                    Showing <strong>{filteredProducts.length}</strong> of{" "}
                    <strong>{products.length}</strong> products
                  </div>
                )}

                <div className="admin-inventory-summary">
                  <div>
                    <span>Total Products</span>
                    <strong>{products.length}</strong>
                  </div>

                  <div>
                    <span>In Stock</span>
                    <strong>
                      {
                        products.filter(
                          (item) => Number(item.stock) > 5
                        ).length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Out of Stock</span>
                    <strong>
                      {
                        products.filter(
                          (item) => Number(item.stock) <= 0
                        ).length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Low Stock</span>
                    <strong>
                      {
                        products.filter(
                          (item) =>
                            Number(item.stock) > 0 &&
                            Number(item.stock) <= 5
                        ).length
                      }
                    </strong>
                  </div>
                </div>

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
                      onClick={fetchProducts}
                    >
                      Try Again
                    </button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="admin-empty-state">
                    <span>🥬</span>
                    <h4>No Products Found</h4>
                    <p>Add your first grocery product.</p>

                    <button
                      className="admin-refresh-btn"
                      onClick={() => changeTab("addProduct")}
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
                      onClick={resetInventoryFilters}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
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

                          <div className="admin-product-actions">
                            <button
                              type="button"
                              onClick={() => startEditProduct(item)}
                            >
                              ✏️ Edit / Stock
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteProduct(item._id)}
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
          )}

          {/* DELIVERY SETTINGS */}

          {activeTab === "delivery" && (
            <section className="delivery-settings-container">
              <div className="delivery-settings-heading">
                <div>
                  <h2>🚚 Delivery Settings</h2>
                  <p>Manage your business address and delivery area.</p>
                </div>

                <span
                  className={
                    deliverySettings.active
                      ? "delivery-active-badge"
                      : "delivery-inactive-badge"
                  }
                >
                  {deliverySettings.active ? "● Active" : "● Inactive"}
                </span>
              </div>

              <form onSubmit={saveDeliverySettings}>
                <div className="delivery-settings-note">
                  <strong>📍 Current Hub Location</strong>
                  <p>
                    This address is used as the ORGANIGO delivery centre.
                    You can update it whenever your business location changes.
                  </p>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={deliverySettings.businessName}
                      onChange={handleDeliveryChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>PIN Code</label>
                    <input
                      type="text"
                      name="pincode"
                      value={deliverySettings.pincode}
                      onChange={handleDeliveryChange}
                      maxLength="6"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Complete Hub Address</label>
                    <textarea
                      name="address"
                      value={deliverySettings.address}
                      onChange={handleDeliveryChange}
                      placeholder="Enter shop, building, street or area address..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={deliverySettings.city}
                      onChange={handleDeliveryChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={deliverySettings.state}
                      onChange={handleDeliveryChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      name="latitude"
                      step="any"
                      value={deliverySettings.latitude}
                      onChange={handleDeliveryChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      name="longitude"
                      step="any"
                      value={deliverySettings.longitude}
                      onChange={handleDeliveryChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Delivery Radius (KM)</label>
                    <input
                      type="number"
                      name="radius"
                      min="1"
                      step="0.5"
                      value={deliverySettings.radius}
                      onChange={handleDeliveryChange}
                      required
                    />

                    <small className="field-help">
                      Example: 10 KM delivery radius around your hub.
                    </small>
                  </div>
                </div>

                <div className="delivery-service-toggle">
                  <div>
                    <strong>Delivery Service</strong>
                    <p>Turn delivery service on or off.</p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      name="active"
                      checked={deliverySettings.active}
                      onChange={handleDeliveryChange}
                    />
                    <span className="slider" />
                  </label>
                </div>

                <div className="delivery-map-preview">
                  <div>
                    <strong>📍 Hub Map Location</strong>
                    <p>
                      {deliverySettings.city}, {deliverySettings.state}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openHubMap}
                    className="view-hub-map-btn"
                  >
                    View on Google Maps ↗
                  </button>
                </div>

                {settingsMessage && (
                  <div className="settings-success-message">
                    ✓ {settingsMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="save-delivery-settings-btn"
                >
                  💾 Save Delivery Settings
                </button>
              </form>
            </section>
          )}

          {/* CUSTOMER ORDERS */}

          {activeTab === "orders" && (
            <section className="admin-orders-container">
              <div className="admin-orders-heading">
                <div>
                  <h2>Customer Orders 📦</h2>
                  <p>Total Orders: {orders.length}</p>
                </div>

                <button
                  type="button"
                  className="refresh-orders-btn"
                  onClick={fetchOrders}
                  disabled={ordersLoading}
                >
                  {ordersLoading ? "Loading..." : "↻ Refresh Orders"}
                </button>
              </div>

              {ordersLoading && orders.length === 0 ? (
                <div className="no-orders">
                  <h3>Loading Orders...</h3>
                </div>
              ) : ordersError ? (
                <div className="no-orders">
                  <h3>Unable to Load Orders</h3>
                  <p>{ordersError}</p>

                  <button
                    type="button"
                    className="refresh-orders-btn"
                    onClick={fetchOrders}
                  >
                    Try Again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="no-orders">
                  <span>📦</span>
                  <h3>No Orders Yet</h3>
                  <p>Customer orders will appear here.</p>
                </div>
              ) : (
                <div className="admin-orders-list">
                  {[...orders].reverse().map((order) => (
                    <div className="admin-order-card" key={order.orderId}>
                      <div className="admin-order-top">
                        <div>
                          <h3>Order #{order.orderId}</h3>
                          <p>
                            {order.orderDate ||
                              new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <span className="order-status-badge">
                          {order.status || "Order Placed"}
                        </span>
                      </div>

                      <hr />

                      <div className="admin-customer-details">
                        <h3>Customer Information</h3>

                        <p>
                          <strong>Name:</strong>{" "}
                          {order.customer?.name || "Not available"}
                        </p>

                        <p>
                          <strong>Mobile:</strong>{" "}
                          {order.customer?.phone || "Not available"}
                        </p>

                        <p>
                          <strong>Address:</strong>{" "}
                          {order.customer?.address || "Not available"}
                        </p>

                        <p>
                          <strong>City:</strong>{" "}
                          {order.customer?.city || "Not available"}
                        </p>

                        <p>
                          <strong>State:</strong>{" "}
                          {order.customer?.state || "Not available"}
                        </p>

                        <p>
                          <strong>PIN Code:</strong>{" "}
                          {order.customer?.pincode || "Not available"}
                        </p>
                      </div>

                      <div className="admin-customer-location">
                        <h3>📍 Customer GPS Location</h3>

                        {order.location?.latitude != null &&
                        order.location?.longitude != null ? (
                          <>
                            <p>Latitude: {order.location.latitude}</p>
                            <p>Longitude: {order.location.longitude}</p>

                            <a
                              href={
                                order.mapLink ||
                                `https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="view-map-btn"
                            >
                              📍 View Customer on Google Maps
                            </a>
                          </>
                        ) : (
                          <p className="location-not-available">
                            Customer has not shared GPS location.
                          </p>
                        )}
                      </div>

                      <div className="admin-order-products">
                        <h3>Ordered Products</h3>

                        {order.items?.map((item, index) => (
                          <div
                            className="admin-order-product"
                            key={`${order.orderId}-${item.productId || index}-${index}`}
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>

                            <strong>
                              ₹{Number(item.price) * item.quantity}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div className="admin-order-bottom">
                        <div>
                          <p>Payment Method</p>
                          <strong>
                            {order.paymentMethod || "Cash on Delivery"}
                          </strong>
                        </div>

                        <div>
                          <p>Total Amount</p>
                          <strong className="admin-order-total">
                            ₹{order.total}
                          </strong>
                        </div>
                      </div>

                      {/* RIDER ASSIGNMENT */}

                      <div
                        className="admin-rider-assignment"
                        style={{
                          marginTop: 18,
                          padding: 16,
                          background: "#f4faf5",
                          border: "1px solid #dceee0",
                          borderRadius: 10,
                        }}
                      >
                        <h3 style={{ margin: "0 0 12px", color: "#173d26" }}>
                          🚴 Delivery Rider
                        </h3>

                        {order.riderId ? (
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ margin: "4px 0" }}>
                              <strong>Assigned Rider:</strong>{" "}
                              {order.riderName || "Rider"}
                            </p>

                            <p style={{ margin: "4px 0" }}>
                              <strong>Mobile:</strong>{" "}
                              {order.riderPhone || "Not available"}
                            </p>
                          </div>
                        ) : (
                          <p style={{ margin: "0 0 12px", color: "#777" }}>
                            No delivery rider assigned yet.
                          </p>
                        )}

                        <label
                          htmlFor={`rider-${order.orderId}`}
                          style={{
                            display: "block",
                            marginBottom: 7,
                            fontWeight: 600,
                          }}
                        >
                          Assign or change rider
                        </label>

                        <select
                          id={`rider-${order.orderId}`}
                          value={order.riderId || ""}
                          disabled={
                            ridersLoading ||
                            assigningOrder === order.orderId ||
                            ["Delivered", "Cancelled"].includes(order.status)
                          }
                          onChange={(e) =>
                            assignRider(order.orderId, e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: 12,
                            border: "1px solid #d5e3d8",
                            borderRadius: 8,
                            background: "#fff",
                          }}
                        >
                          <option value="">
                            {ridersLoading
                              ? "Loading riders..."
                              : riders.length
                              ? "Select delivery rider"
                              : "No active riders available"}
                          </option>

                          {riders.map((rider) => (
                            <option key={rider._id} value={rider._id}>
                              {rider.name} - {rider.phone}
                            </option>
                          ))}
                        </select>

                        {assigningOrder === order.orderId && (
                          <p style={{ margin: "8px 0 0", color: "#168b45" }}>
                            Assigning rider...
                          </p>
                        )}

                        {!ridersLoading && riders.length === 0 && (
                          <p style={{ margin: "8px 0 0", color: "#777" }}>
                            Create an active user account with the rider role
                            before assigning a rider.
                          </p>
                        )}
                      </div>

                      <div className="admin-status-control">
                        <label>Update Order Status</label>

                        <select
                          value={order.status || "Order Placed"}
                          onChange={(e) =>
                            updateOrderStatus(order.orderId, e.target.value)
                          }
                        >
                          <option>Order Placed</option>
                          <option>Confirmed</option>
                          <option>Packed</option>
                          <option>Out for Delivery</option>
                          <option>Delivered</option>
                          <option>Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
export default Admin;