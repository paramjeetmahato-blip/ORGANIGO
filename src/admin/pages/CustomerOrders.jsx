import { useMemo, useState } from "react";

// =========================================
// HELPERS
// =========================================

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeStatus = (status) =>
  String(status || "Order Placed").trim().toLowerCase();

const getStatusClass = (status) =>
  normalizeStatus(status).replace(/\s+/g, "-");

// =========================================
// ORDER DETAILS MODAL
// =========================================

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const customer = order.customer || {};
  const location = order.location || {};
  const items = order.items || [];
  const history = order.statusHistory || [];

  const hasLocation =
    location.latitude != null &&
    location.longitude != null;

  const mapLink =
    order.mapLink ||
    (hasLocation
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : "");

  return (
    <div className="co-modal-overlay" onClick={onClose}>
      <div
        className="co-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="co-modal-header">
          <div>
            <span>ORGANIGO ORDER DETAILS</span>
            <h2>#{order.orderId}</h2>
            <p>{formatDate(order.orderDate || order.createdAt)}</p>
          </div>

          <button
            type="button"
            className="co-modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="co-detail-section">
          <h3>Order Status</h3>
          <span className={`co-status-badge ${getStatusClass(order.status)}`}>
            {order.status || "Order Placed"}
          </span>
        </div>

        <div className="co-detail-section">
          <h3>👤 Customer Information</h3>

          <div className="co-detail-grid">
            <div>
              <small>Customer Name</small>
              <strong>{customer.name || "Not available"}</strong>
            </div>

            <div>
              <small>Mobile Number</small>
              <strong>{customer.phone || "Not available"}</strong>
            </div>

            <div>
              <small>City</small>
              <strong>{customer.city || "Not available"}</strong>
            </div>

            <div>
              <small>State</small>
              <strong>{customer.state || "Not available"}</strong>
            </div>

            <div>
              <small>PIN Code</small>
              <strong>{customer.pincode || "Not available"}</strong>
            </div>

            <div className="co-full-width">
              <small>Delivery Address</small>
              <strong>{customer.address || "Not available"}</strong>
            </div>
          </div>
        </div>

        <div className="co-detail-section">
          <h3>📍 Customer GPS Location</h3>

          {hasLocation ? (
            <>
              <p>Latitude: {location.latitude}</p>
              <p>Longitude: {location.longitude}</p>

              <a
                href={mapLink}
                target="_blank"
                rel="noreferrer"
                className="co-map-link"
              >
                📍 Open Customer Location in Google Maps
              </a>
            </>
          ) : (
            <p>Customer has not shared GPS location.</p>
          )}
        </div>

        <div className="co-detail-section">
          <h3>🛒 Ordered Products</h3>

          {items.length ? (
            <div className="co-product-list">
              {items.map((item, index) => {
                const quantity = Number(item.quantity || 1);
                const price = Number(item.price || 0);

                return (
                  <div
                    className="co-product-row"
                    key={item.productId || index}
                  >
                    <div>
                      <strong>{item.name || "Product"}</strong>
                      <small>
                        {formatPrice(price)} × {quantity}
                      </small>
                    </div>

                    <strong>{formatPrice(price * quantity)}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No product information available.</p>
          )}
        </div>

        <div className="co-detail-section">
          <h3>💳 Payment Information</h3>

          <div className="co-detail-grid">
            <div>
              <small>Payment Method</small>
              <strong>
                {order.paymentMethod || "Cash on Delivery"}
              </strong>
            </div>

            <div>
              <small>Payment Status</small>
              <strong>{order.paymentStatus || "Not available"}</strong>
            </div>
          </div>
        </div>

        <div className="co-detail-section">
          <h3>Bill Summary</h3>

          <div className="co-bill-row">
            <span>Total Amount</span>
            <strong className="co-grand-total">
              {formatPrice(order.total)}
            </strong>
          </div>
        </div>

        <div className="co-detail-section">
          <h3>🚴 Delivery Rider</h3>

          <p>
            <strong>Name:</strong> {order.riderName || "Not assigned"}
          </p>

          <p>
            <strong>Mobile:</strong> {order.riderPhone || "Not available"}
          </p>
        </div>

        <div className="co-detail-section">
          <h3>📋 Order History</h3>

          {history.length ? (
            <div className="co-history">
              {[...history].reverse().map((item, index) => (
                <div
                  className="co-history-item"
                  key={item._id || index}
                >
                  <span className="co-history-dot" />

                  <div>
                    <strong>{item.status}</strong>
                    {item.message && <p>{item.message}</p>}
                    <small>{formatDate(item.updatedAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Order history is not available.</p>
          )}
        </div>

        <div className="co-modal-footer">
          <button type="button" onClick={onClose}>
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================
// CUSTOMER ORDERS PAGE
// =========================================

function CustomerOrders({
  orders = [],
  ordersLoading,
  ordersError,
  fetchOrders,
  riders = [],
  ridersLoading,
  assigningOrder,
  assignRider,
  updateOrderStatus,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // =========================================
  // ORDER COUNTS
  // =========================================

  const orderCounts = useMemo(() => ({
    total: orders.length,

    new: orders.filter(
      (order) => normalizeStatus(order.status) === "order placed"
    ).length,

    processing: orders.filter((order) =>
      ["confirmed", "packed", "out for delivery"].includes(
        normalizeStatus(order.status)
      )
    ).length,

    delivered: orders.filter(
      (order) => normalizeStatus(order.status) === "delivered"
    ).length,

    cancelled: orders.filter(
      (order) => normalizeStatus(order.status) === "cancelled"
    ).length,
  }), [orders]);

  // =========================================
  // FILTER ORDERS
  // =========================================

  const filteredOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        const customer = order.customer || {};

        const matchesSearch =
          String(order.orderId || "").toLowerCase().includes(searchText) ||
          String(customer.name || "").toLowerCase().includes(searchText) ||
          String(customer.phone || "").toLowerCase().includes(searchText);

        const currentStatus = normalizeStatus(order.status);

        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Processing"
            ? ["confirmed", "packed", "out for delivery"].includes(currentStatus)
            : currentStatus === normalizeStatus(statusFilter));

        const orderDate = new Date(
          order.orderDate || order.createdAt
        );

        const matchesDate =
          !dateFilter ||
          (!Number.isNaN(orderDate.getTime()) &&
            orderDate.toISOString().slice(0, 10) === dateFilter);

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort(
        (a, b) =>
          new Date(b.orderDate || b.createdAt || 0) -
          new Date(a.orderDate || a.createdAt || 0)
      );
  }, [orders, search, statusFilter, dateFilter]);

  // =========================================
  // CLEAR FILTERS
  // =========================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setDateFilter("");
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <section className="co-container">

      <div className="co-page-header">
        <div>
          <span className="co-eyebrow">ORGANIGO MANAGEMENT</span>
          <h2>Customer Orders 📦</h2>
          <p>Manage, track and process your customer orders.</p>
        </div>

        <button
          type="button"
          className="co-refresh-btn"
          onClick={fetchOrders}
          disabled={ordersLoading}
        >
          {ordersLoading ? "Loading..." : "↻ Refresh Orders"}
        </button>
      </div>

      {/* SUMMARY CARDS */}

      <div className="co-stats-grid">
        <button
          type="button"
          className={`co-stat-card ${statusFilter === "All" ? "active" : ""}`}
          onClick={() => setStatusFilter("All")}
        >
          <span>🛒</span>
          <small>Total Orders</small>
          <h3>{orderCounts.total}</h3>
        </button>

        <button
          type="button"
          className={`co-stat-card ${statusFilter === "Order Placed" ? "active" : ""}`}
          onClick={() => setStatusFilter("Order Placed")}
        >
          <span>🆕</span>
          <small>New Orders</small>
          <h3>{orderCounts.new}</h3>
        </button>

        <button
          type="button"
          className={`co-stat-card ${statusFilter === "Processing" ? "active" : ""}`}
          onClick={() => setStatusFilter("Processing")}
        >
          <span>📦</span>
          <small>Processing</small>
          <h3>{orderCounts.processing}</h3>
        </button>

        <button
          type="button"
          className={`co-stat-card ${statusFilter === "Delivered" ? "active" : ""}`}
          onClick={() => setStatusFilter("Delivered")}
        >
          <span>✅</span>
          <small>Delivered</small>
          <h3>{orderCounts.delivered}</h3>
        </button>

        <button
          type="button"
          className={`co-stat-card ${statusFilter === "Cancelled" ? "active" : ""}`}
          onClick={() => setStatusFilter("Cancelled")}
        >
          <span>❌</span>
          <small>Cancelled</small>
          <h3>{orderCounts.cancelled}</h3>
        </button>
      </div>

      {/* SEARCH AND FILTER */}

      <div className="co-filter-panel">
        <div className="co-search-box">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search Order ID, customer name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Order Placed">Order Placed</option>
          <option value="Processing">Processing</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Packed">Packed</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <button
          type="button"
          className="co-clear-btn"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* ORDER LIST HEADING */}

      <div className="co-list-heading">
        <div>
          <h3>Customer Orders</h3>
          <p>
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {/* ORDER STATES */}

      {ordersLoading && orders.length === 0 ? (
        <div className="co-empty-state">
          <span>⏳</span>
          <h3>Loading Orders...</h3>
        </div>
      ) : ordersError ? (
        <div className="co-empty-state">
          <span>⚠️</span>
          <h3>Unable to Load Orders</h3>
          <p>{ordersError}</p>

          <button type="button" onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="co-empty-state">
          <span>📦</span>
          <h3>No Orders Found</h3>
          <p>Try changing your search or filters.</p>
        </div>
      ) : (
        <div className="co-orders-list">
          {filteredOrders.map((order) => {
            const customer = order.customer || {};
            const items = order.items || [];
            const location = order.location || {};

            const hasLocation =
              location.latitude != null &&
              location.longitude != null;

            const isFinalStatus = ["delivered", "cancelled"].includes(
              normalizeStatus(order.status)
            );

            return (
              <article
                className="co-order-card"
                key={order._id || order.orderId}
              >
                <div className="co-order-top">
                  <div>
                    <span className="co-order-label">ORDER ID</span>
                    <h3>#{order.orderId}</h3>
                    <small>
                      {formatDate(order.orderDate || order.createdAt)}
                    </small>
                  </div>

                  <span className={`co-status-badge ${getStatusClass(order.status)}`}>
                    {order.status || "Order Placed"}
                  </span>
                </div>

                <div className="co-customer-summary">
                  <div className="co-customer-avatar">
                    {(customer.name || "C").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{customer.name || "Customer"}</strong>
                    <span>
                      📞 {customer.phone || "Mobile unavailable"}
                    </span>
                  </div>
                </div>

                <div className="co-order-info-grid">
                  <div>
                    <small>Products</small>
                    <strong>{items.length} Items</strong>
                  </div>

                  <div>
                    <small>Payment</small>
                    <strong>
                      {order.paymentMethod || "Cash on Delivery"}
                    </strong>
                  </div>

                  <div>
                    <small>Delivery Location</small>
                    <strong>{customer.city || "Not available"}</strong>
                  </div>

                  <div>
                    <small>Total Amount</small>
                    <strong className="co-order-amount">
                      {formatPrice(order.total)}
                    </strong>
                  </div>
                </div>

                {/* RIDER ASSIGNMENT */}

                <div className="co-rider-box">
                  <div className="co-rider-heading">
                    <h4>🚴 Delivery Management</h4>

                    {order.riderId && <span>Rider Assigned</span>}
                  </div>

                  {order.riderId && (
                    <div className="co-rider-info">
                      <strong>{order.riderName || "Assigned Rider"}</strong>
                      <span>{order.riderPhone || "Mobile unavailable"}</span>
                    </div>
                  )}

                  <label htmlFor={`rider-${order.orderId}`}>
                    Assign or Change Rider
                  </label>

                  <select
                    id={`rider-${order.orderId}`}
                    value={order.riderId || ""}
                    disabled={
                      ridersLoading ||
                      assigningOrder === order.orderId ||
                      isFinalStatus
                    }
                    onChange={(e) =>
                      assignRider(order.orderId, e.target.value)
                    }
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
                    <small>Assigning rider...</small>
                  )}

                  {!ridersLoading && riders.length === 0 && (
                    <small>
                      Create an active user account with the rider role.
                    </small>
                  )}
                </div>

                {/* STATUS CONTROL */}

                <div className="co-status-control">
                  <label htmlFor={`status-${order.orderId}`}>
                    Update Order Status
                  </label>

                  <select
                    id={`status-${order.orderId}`}
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

                <div className="co-order-footer">
                  <span>
                    {hasLocation
                      ? "📍 GPS Location Available"
                      : "📍 GPS Not Available"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Full Details →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* DETAILS MODAL */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </section>
  );
}

export default CustomerOrders;