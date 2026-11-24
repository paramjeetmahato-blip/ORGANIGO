import API_BASE_URL from "../services/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getToken, getUser, clearSession } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

// Admin Components
import AdminLayout from "../admin/components/AdminLayout";

// Admin Pages
import Dashboard from "../admin/pages/Dashboard";
import AddProduct from "../admin/pages/AddProduct";
import ProductInventory from "../admin/pages/ProductInventory";
import CustomerOrders from "../admin/pages/CustomerOrders";
import DeliverySettings from "../admin/pages/DeliverySettings";
import AboutOrganigo from "../admin/pages/AboutOrganigo";

const API_URL = `${API_BASE_URL}/api`;

// =========================================
// DEFAULT DELIVERY SETTINGS
// =========================================

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

// =========================================
// GET SAVED DELIVERY SETTINGS
// =========================================

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

// =========================================
// IST DATE HELPER
// =========================================

function getISTDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

// =========================================
// ADMIN COMPONENT
// =========================================

function Admin() {
  const navigate = useNavigate();

  const token = getToken();
  const currentUser = getUser();

  const isAdmin =
    Boolean(token) &&
    ["admin", "superadmin"].includes(currentUser?.role);

  // =========================================
  // NAVIGATION
  // =========================================

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin-login", { replace: true });
    }
  }, [isAdmin, navigate]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // =========================================
  // LOGOUT
  // =========================================

  const logoutAdmin = useCallback(
    (message) => {
      clearSession();

      navigate("/admin-login", {
        replace: true,
        state: { message },
      });
    },
    [navigate]
  );

  // =========================================
  // ADD PRODUCT FORM
  // =========================================

  const [product, setProduct] = useState({
    name: "",
    category: "Fruits",
    weight: "",
    price: "",
    oldPrice: "",
    stock: "",
    description: "",
    image: null,
    isSpecial: false,
    isDemanding: false,
    isOnOffer: false,
  });

  // =========================================
  // EDIT PRODUCT FORM
  // =========================================

  const [editProduct, setEditProduct] = useState({
    name: "",
    category: "Fruits",
    price: "",
    originalPrice: "",
    unit: "",
    stock: "",
    description: "",
    image: "",
    isSpecial: false,
    isDemanding: false,
    isOnOffer: false,
  });

  const [preview, setPreview] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);

  // =========================================
  // PRODUCT MANAGEMENT
  // =========================================

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  // =========================================
  // INVENTORY FILTERS
  // =========================================

  const [searchProduct, setSearchProduct] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  const productCategories = useMemo(() => {
    return [
      ...new Set(
        products.map((item) => item.category).filter(Boolean)
      ),
    ].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const searchText = searchProduct.trim().toLowerCase();

      const matchesSearch = (item.name || "")
        .toLowerCase()
        .includes(searchText);

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

  // =========================================
  // FETCH PRODUCTS
  // =========================================

  const fetchProducts = useCallback(async () => {
    if (!token || !["admin", "superadmin"].includes(currentUser?.role)) {
      return;
    }

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

  // =========================================
  // ADD PRODUCT INPUT
  // =========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setProduct((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================================
  // EDIT PRODUCT INPUT
  // =========================================

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditProduct((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================================
  // EDIT PRODUCT IMAGE HANDLER
  // =========================================

  const handleEditImage = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2 MB.");
      event.target.value = "";
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
  };

  // =========================================
  // START EDIT PRODUCT
  // =========================================

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
      isSpecial: item.isSpecial || false,
      isDemanding: item.isDemanding || false,
      isOnOffer: item.isOnOffer || false,
    });

    setActiveTab("addProduct");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================================
  // CANCEL EDIT PRODUCT
  // =========================================

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
      isSpecial: false,
      isDemanding: false,
      isOnOffer: false,
    });

    setActiveTab("inventory");
  };

  // =========================================
  // UPDATE PRODUCT
  // =========================================

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
            name: editProduct.name.trim(),
            price: Number(editProduct.price),
            originalPrice: Number(editProduct.originalPrice),
            stock: Number(editProduct.stock),
            isSpecial: Boolean(editProduct.isSpecial),
            isDemanding: Boolean(editProduct.isDemanding),
            isOnOffer: Boolean(editProduct.isOnOffer),
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

      alert("Product updated successfully!");

      setEditingProductId(null);

      await fetchProducts();

      window.dispatchEvent(new Event("organigoProductsUpdated"));

      setActiveTab("inventory");
    } catch (error) {
      console.error("Update Product Error:", error);
      alert(error.message);
    }
  };

  // =========================================
  // DELETE PRODUCT
  // =========================================

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

      alert("Product deleted successfully!");

      await fetchProducts();

      window.dispatchEvent(new Event("organigoProductsUpdated"));
    } catch (error) {
      console.error("Delete Product Error:", error);
      alert(error.message);
    }
  };

  // =========================================
  // ADD PRODUCT IMAGE UPLOAD
  // =========================================

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
      setProduct((previous) => ({
        ...previous,
        image: reader.result,
      }));

      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // =========================================
  // ADD PRODUCT
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.image) {
      alert("Please upload a product image.");
      return;
    }

    if (!token || !["admin", "superadmin"].includes(currentUser?.role)) {
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
          isSpecial: Boolean(product.isSpecial),
          isDemanding: Boolean(product.isDemanding),
          isOnOffer: Boolean(product.isOnOffer),
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

      alert("Product added successfully!");

      setProduct({
        name: "",
        category: "Fruits",
        weight: "",
        price: "",
        oldPrice: "",
        stock: "",
        description: "",
        image: null,
        isSpecial: false,
        isDemanding: false,
        isOnOffer: false,
      });

      setPreview("");
      e.target.reset();

      window.dispatchEvent(new Event("organigoProductsUpdated"));

      await fetchProducts();

      setActiveTab("inventory");
    } catch (error) {
      console.error("Add Product Error:", error);
      alert(error.message || "Unable to save product.");
    }
  };

  // =========================================
  // DELIVERY SETTINGS
  // =========================================

  const [deliverySettings, setDeliverySettings] = useState(
    getSavedDeliverySettings
  );

  const [settingsMessage, setSettingsMessage] = useState("");

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;

    setDeliverySettings((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSettingsMessage("");
  };

  // =========================================
  // SAVE DELIVERY SETTINGS
  // =========================================

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

  // =========================================
  // OPEN HUB MAP
  // =========================================

  const openHubMap = () => {
    window.open(
      `https://www.google.com/maps?q=${deliverySettings.latitude},${deliverySettings.longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================================
  // ORDERS
  // =========================================

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // =========================================
  // RIDER MANAGEMENT
  // =========================================

  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState("");

  // =========================================
  // FETCH ORDERS
  // =========================================

  const fetchOrders = useCallback(async () => {
    if (!token || !["admin", "superadmin"].includes(currentUser?.role)) {
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

  // =========================================
  // REFRESH DASHBOARD DATA
  // =========================================

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      fetchOrders(),
      fetchProducts(),
    ]);
  }, [fetchOrders, fetchProducts]);

  // =========================================
  // FETCH ACTIVE RIDERS
  // =========================================

  const fetchRiders = useCallback(async () => {
    if (!token || !["admin", "superadmin"].includes(currentUser?.role)) {
      return;
    }

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

  // =========================================
  // ASSIGN RIDER
  // =========================================

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

  // =========================================
  // FETCH ORDERS AND RIDERS ON ADMIN LOAD
  // =========================================

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      fetchRiders();
    }
  }, [fetchOrders, fetchRiders, isAdmin]);

  // =========================================
  // UPDATE ORDER STATUS
  // =========================================

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!token || !["admin", "superadmin"].includes(currentUser?.role)) {
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

  // =========================================
  // ADMIN AUTHENTICATION CHECK
  // =========================================

  if (!isAdmin) return null;

  // =========================================
  // DASHBOARD CALCULATIONS
  // =========================================

  const pendingOrders = orders.filter(
    (order) => !["Delivered", "Cancelled"].includes(order.status)
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status === "Delivered")
    .reduce((total, order) => total + Number(order.total || 0), 0);

  // =========================================
  // TODAY'S DASHBOARD CALCULATIONS (IST)
  // =========================================

  const todayDate = getISTDate(new Date());

  const todayOrders = orders.filter(
    (order) =>
      getISTDate(order.orderDate || order.createdAt) === todayDate
  ).length;

  const todaySales = orders
    .filter((order) => {
      if (order.status !== "Delivered") return false;

      const deliveredHistory = [...(order.statusHistory || [])]
        .reverse()
        .find((history) => history.status === "Delivered");

      return (
        deliveredHistory &&
        getISTDate(deliveredHistory.updatedAt) === todayDate
      );
    })
    .reduce((total, order) => total + Number(order.total || 0), 0);

  // =========================================
  // SIDEBAR MENU
  // =========================================

  const menuItems = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "addProduct", icon: "＋", label: "Add Product" },
    { id: "inventory", icon: "📦", label: "Product Inventory" },
    { id: "orders", icon: "🛒", label: "Customer Orders" },
    { id: "delivery", icon: "🚚", label: "Delivery Settings" },
    { id: "about", icon: "🌿", label: "About ORGANIGO" },
  ];

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <AdminLayout
      menuItems={menuItems}
      activeTab={activeTab}
      sidebarOpen={sidebarOpen}
      currentUser={currentUser}
      onChangeTab={changeTab}
      onLogout={() =>
        logoutAdmin("You have logged out successfully.")
      }
      onOpenSidebar={() => setSidebarOpen(true)}
      onCloseSidebar={() => setSidebarOpen(false)}
    >
      {/* DASHBOARD */}
      {activeTab === "dashboard" && (
        <Dashboard
          currentUser={currentUser}
          orders={orders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          pendingOrders={pendingOrders}
          deliveredOrders={deliveredOrders}
          totalRevenue={totalRevenue}
          deliverySettings={deliverySettings}
          onRefreshOrders={refreshDashboard}
          onChangeTab={changeTab}
          todayOrders={todayOrders}
          todaySales={todaySales}
        />
      )}

      {/* ADD / EDIT PRODUCT */}
      {activeTab === "addProduct" && (
        <AddProduct
          product={product}
          setProduct={setProduct}
          editProduct={editProduct}
          setEditProduct={setEditProduct}
          editingProductId={editingProductId}
          preview={preview}
          onChange={handleChange}
          onEditChange={handleEditChange}
          onImageChange={handleImage}
          onEditImageChange={handleEditImage}
          onSubmit={handleSubmit}
          onUpdate={updateProduct}
          onCancelEdit={cancelEditProduct}
        />
      )}

      {/* PRODUCT INVENTORY */}
      {activeTab === "inventory" && (
        <ProductInventory
          products={products}
          filteredProducts={filteredProducts}
          productsLoading={productsLoading}
          productsError={productsError}
          productCategories={productCategories}
          searchProduct={searchProduct}
          setSearchProduct={setSearchProduct}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          onRefresh={fetchProducts}
          onResetFilters={resetInventoryFilters}
          onAddProduct={() => changeTab("addProduct")}
          onEditProduct={startEditProduct}
          onDeleteProduct={deleteProduct}
        />
      )}

      {/* CUSTOMER ORDERS */}
      {activeTab === "orders" && (
        <CustomerOrders
          orders={orders}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          fetchOrders={fetchOrders}
          riders={riders}
          ridersLoading={ridersLoading}
          assigningOrder={assigningOrder}
          assignRider={assignRider}
          updateOrderStatus={updateOrderStatus}
        />
      )}

      {/* DELIVERY SETTINGS */}
      {activeTab === "delivery" && (
        <DeliverySettings
          deliverySettings={deliverySettings}
          handleDeliveryChange={handleDeliveryChange}
          saveDeliverySettings={saveDeliverySettings}
          settingsMessage={settingsMessage}
          openHubMap={openHubMap}
        />
      )}

      {/* ABOUT ORGANIGO */}
      {activeTab === "about" && <AboutOrganigo />}
    </AdminLayout>
  );
}

export default Admin;