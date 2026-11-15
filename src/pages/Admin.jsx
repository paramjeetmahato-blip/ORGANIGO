
import { useState, useEffect, useCallback } from "react";
import "../styles/Admin.css";

const API_URL = "http://localhost:5000/api";

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
  // ADMIN AUTHENTICATION
  const token = localStorage.getItem("organigoToken");

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("organigoUser") || "null"
    );
  } catch {
    currentUser = null;
  }

  const isAdmin =
    Boolean(token) && currentUser?.role === "admin";

  // PRODUCT STATE
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

  // DELIVERY SETTINGS
  const [deliverySettings, setDeliverySettings] = useState(
    getSavedDeliverySettings
  );

  const [settingsMessage, setSettingsMessage] = useState("");

  // ORDERS STATE
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // FETCH ORDERS FROM MONGODB
  const fetchOrders = useCallback(async () => {
    if (!token || currentUser?.role !== "admin") {
      setOrdersError("Please login with an Admin account.");
      setOrders([]);
      return;
    }

    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await fetch(`${API_URL}/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          data.message || "Admin access denied. Please login again."
        );
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
  }, [token, currentUser?.role]);

  // LOAD ORDERS WHEN ADMIN OPENS
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // PRODUCT INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // IMAGE UPLOAD
  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2 MB.");
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

  // SAVE PRODUCT
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!product.image) {
      alert("Please upload product image!");
      return;
    }

    try {
      const savedProducts = JSON.parse(
        localStorage.getItem("organigoProducts") || "[]"
      );

      const newProduct = {
        id: Date.now(),
        name: product.name.trim(),
        category: product.category,
        weight: product.weight.trim(),
        price: Number(product.price),
        oldPrice: Number(product.oldPrice),
        stock: Number(product.stock),
        description: product.description,
        image: product.image,
      };

      localStorage.setItem(
        "organigoProducts",
        JSON.stringify([...savedProducts, newProduct])
      );

      window.dispatchEvent(
        new Event("organigoProductsUpdated")
      );

      alert("Product Added Successfully!");

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
    } catch (error) {
      console.error(error);
      alert("Unable to save product. Please check image size.");
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
      alert("Please enter complete hub address.");
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      alert("Invalid latitude.");
      return;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      alert("Invalid longitude.");
      return;
    }

    if (!Number.isFinite(radius) || radius <= 0) {
      alert("Invalid delivery radius.");
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

    alert("Delivery Settings Updated Successfully!");
  };

  // OPEN HUB MAP
  const openHubMap = () => {
    window.open(
      `https://www.google.com/maps?q=${deliverySettings.latitude},${deliverySettings.longitude}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // REFRESH ORDERS
  const refreshOrders = () => {
    fetchOrders();
  };

  // UPDATE ORDER STATUS IN MONGODB
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!token || currentUser?.role !== "admin") {
      alert("Please login with an Admin account.");
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
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Status update failed.");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.orderId === orderId ? data.order : order
        )
      );

      alert("Order Status Updated Successfully!");
    } catch (error) {
      console.error("Update Status Error:", error);
      alert(error.message);
      fetchOrders();
    }
  };

  // BLOCK NON-ADMIN USERS
  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="no-orders">
          <h2>🔒 Admin Access Required</h2>
          <p>Please login using your ORGANIGO Admin account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* ADMIN HEADING */}

      <div className="admin-heading">
        <h1>ORGANIGO Admin Panel</h1>
        <p>
          Manage your grocery products, delivery settings and customer orders.
        </p>
      </div>

      {/* DELIVERY SETTINGS */}

      <div className="delivery-settings-container">

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
              <span className="slider"></span>
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
      </div>

      {/* ADD PRODUCT */}

      <div className="admin-container">

        <h2>Add New Product</h2>

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
            + Add Product
          </button>

        </form>
      </div>

      {/* CUSTOMER ORDERS */}

      <div className="admin-orders-container">

        <div className="admin-orders-heading">
          <div>
            <h2>Customer Orders 📦</h2>
            <p>Total Orders: {orders.length}</p>
          </div>

          <button
            type="button"
            className="refresh-orders-btn"
            onClick={refreshOrders}
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
              onClick={refreshOrders}
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
                      <p>
                        Latitude: {order.location.latitude}
                      </p>

                      <p>
                        Longitude: {order.location.longitude}
                      </p>

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

                <div className="admin-status-control">

                  <label>Update Order Status</label>

                  <select
                    value={order.status || "Order Placed"}
                    onChange={(e) =>
                      updateOrderStatus(
                        order.orderId,
                        e.target.value
                      )
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

      </div>

    </div>
  );
}

export default Admin;