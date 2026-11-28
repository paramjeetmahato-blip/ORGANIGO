// =============================================
// ORGANIGO - ADMIN PANEL
// =============================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import {
  getToken,
  getUser,
  clearSession,
} from "../utils/auth";

import "../styles/Admin.css";

// =============================================
// ADMIN COMPONENTS
// =============================================

import AdminLayout from "../admin/components/AdminLayout";

// =============================================
// ADMIN PAGES
// =============================================

import Dashboard from "../admin/pages/Dashboard";
import ProductInventory from "../admin/pages/ProductInventory";
import CustomerOrders from "../admin/pages/CustomerOrders";
import DeliverySettings from "../admin/pages/DeliverySettings";
import AboutOrganigo from "../admin/pages/AboutOrganigo";
import CategoryManagement from "../admin/pages/CategoryManagement";

// =============================================
// API CONFIGURATION
// =============================================

const API_URL = `${API_BASE_URL}/api`;

// =============================================
// DEFAULT DELIVERY SETTINGS
// =============================================

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

// =============================================
// GET SAVED DELIVERY SETTINGS
// =============================================

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

// =============================================
// IST DATE HELPER
// =============================================

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

// =============================================
// ADMIN COMPONENT
// =============================================

function Admin() {
  const navigate = useNavigate();

  // ===========================================
  // AUTHENTICATION
  // ===========================================

  const token = getToken();
  const currentUser = getUser();

  const isAdmin =
    Boolean(token) &&
    ["admin", "superadmin"].includes(currentUser?.role);

  // ===========================================
  // NAVIGATION
  // ===========================================

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

  // ===========================================
  // LOGOUT
  // ===========================================

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

  // ===========================================
  // DELIVERY SETTINGS
  // ===========================================

  const [deliverySettings, setDeliverySettings] = useState(
    getSavedDeliverySettings
  );

  const [settingsMessage, setSettingsMessage] = useState("");

  // ===========================================
  // HANDLE DELIVERY SETTINGS CHANGE
  // ===========================================

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;

    setDeliverySettings((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSettingsMessage("");
  };

  // ===========================================
  // SAVE DELIVERY SETTINGS
  // ===========================================

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

  // ===========================================
  // OPEN HUB MAP
  // ===========================================

  const openHubMap = () => {
    window.open(
      `https://www.google.com/maps?q=${deliverySettings.latitude},${deliverySettings.longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ===========================================
  // ORDERS STATE
  // ===========================================

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // ===========================================
  // RIDER MANAGEMENT STATE
  // ===========================================

  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState("");

  // ===========================================
  // FETCH ORDERS
  // ===========================================

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

  // ===========================================
  // REFRESH DASHBOARD
  // ===========================================

  const refreshDashboard = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  // ===========================================
  // FETCH ACTIVE RIDERS
  // ===========================================

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

  // ===========================================
  // ASSIGN RIDER TO ORDER
  // ===========================================

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

  // ===========================================
  // INITIAL ADMIN DATA
  // ===========================================

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      fetchRiders();
    }
  }, [fetchOrders, fetchRiders, isAdmin]);

  // ===========================================
  // UPDATE ORDER STATUS
  // ===========================================

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

  // ===========================================
  // AUTHENTICATION CHECK
  // ===========================================

  if (!isAdmin) return null;

  // ===========================================
  // DASHBOARD CALCULATIONS
  // ===========================================

  const pendingOrders = orders.filter(
    (order) => !["Delivered", "Cancelled"].includes(order.status)
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status === "Delivered")
    .reduce((total, order) => total + Number(order.total || 0), 0);

  // ===========================================
  // TODAY'S DASHBOARD CALCULATIONS
  // ===========================================

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

  // ===========================================
  // SIDEBAR MENU
  // ===========================================

  const menuItems = [
    {
      id: "dashboard",
      icon: "▦",
      label: "Dashboard",
    },
    {
      id: "inventory",
      icon: "📦",
      label: "Product Inventory",
    },
    {
      id: "orders",
      icon: "🛒",
      label: "Customer Orders",
    },
    {
      id: "delivery",
      icon: "🚚",
      label: "Delivery Settings",
    },
    {
      id: "categories",
      icon: "📂",
      label: "Category Management",
    },
    {
      id: "about",
      icon: "🌿",
      label: "About ORGANIGO",
    },
  ];

  // ===========================================
  // MAIN ADMIN UI
  // ===========================================

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

      {/* =====================================
          DASHBOARD
      ===================================== */}

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

      {/* =====================================
          PRODUCT INVENTORY
      ===================================== */}

      {activeTab === "inventory" && (
        <ProductInventory />
      )}

      {/* =====================================
          CUSTOMER ORDERS
      ===================================== */}

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

      {/* =====================================
          DELIVERY SETTINGS
      ===================================== */}

      {activeTab === "delivery" && (
        <DeliverySettings
          deliverySettings={deliverySettings}
          handleDeliveryChange={handleDeliveryChange}
          saveDeliverySettings={saveDeliverySettings}
          settingsMessage={settingsMessage}
          openHubMap={openHubMap}
        />
      )}

      {/* =====================================
          CATEGORY MANAGEMENT
      ===================================== */}

      {activeTab === "categories" && (
        <CategoryManagement />
      )}

      {/* =====================================
          ABOUT ORGANIGO
      ===================================== */}

      {activeTab === "about" && (
        <AboutOrganigo />
      )}

    </AdminLayout>
  );
}

export default Admin;