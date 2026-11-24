import { useState } from "react";

// =========================================
// DATE FORMATTER
// =========================================

const formatDate = (dateValue) => {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =========================================
// CURRENCY FORMATTER
// =========================================

const formatPrice = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

// =========================================
// ORDER DETAILS MODAL
// =========================================

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const customer = order.customer || {};

  const address =
    order.deliveryAddress ||
    order.shippingAddress ||
    customer.address ||
    order.address ||
    {};

  const addressText =
    typeof address === "string"
      ? address
      : [
          address.fullName,
          address.house,
          address.street,
          address.landmark,
          address.area,
          address.city,
          address.state,
          address.pincode,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

  const items =
    order.items ||
    order.products ||
    order.orderItems ||
    [];

  const history = order.statusHistory || [];

  return (
    <div
      className="admin-order-modal-overlay"
      onClick={onClose}
    >
      <div
        className="admin-order-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}

        <div className="admin-order-modal-header">
          <div>
            <span>ORDER DETAILS</span>
            <h2>#{order.orderId}</h2>
            <p>{formatDate(order.orderDate || order.createdAt)}</p>
          </div>

          <button
            className="admin-order-modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ORDER STATUS */}

        <div className="admin-order-detail-section">
          <h3>Order Status</h3>

          <div className="admin-order-detail-status">
            <span>{order.status || "Order Placed"}</span>
          </div>
        </div>

        {/* CUSTOMER DETAILS */}

        <div className="admin-order-detail-section">
          <h3>Customer Information</h3>

          <div className="admin-order-info-grid">
            <div>
              <small>Customer Name</small>
              <strong>
                {customer.name || order.customerName || "Not available"}
              </strong>
            </div>

            <div>
              <small>Mobile Number</small>
              <strong>
                {customer.phone ||
                  customer.mobile ||
                  order.phone ||
                  order.mobile ||
                  "Not available"}
              </strong>
            </div>

            <div className="full-width">
              <small>Delivery Address</small>
              <strong>
                {addressText || "Address not available"}
              </strong>
            </div>
          </div>
        </div>

        {/* PRODUCT DETAILS */}

        <div className="admin-order-detail-section">
          <h3>Ordered Products</h3>

          {items.length > 0 ? (
            <div className="admin-order-products">
              {items.map((item, index) => {
                const productName =
                  item.name ||
                  item.productName ||
                  item.product?.name ||
                  "Product";

                const quantity = Number(
                  item.quantity || item.qty || 1
                );

                const price = Number(
                  item.price ||
                  item.product?.price ||
                  0
                );

                const itemTotal = Number(
                  item.total ||
                  item.subtotal ||
                  price * quantity
                );

                return (
                  <div
                    className="admin-order-product-row"
                    key={item._id || item.productId || index}
                  >
                    <div>
                      <strong>{productName}</strong>

                      <small>
                        {formatPrice(price)} × {quantity}
                        {item.unit ? ` ${item.unit}` : ""}
                      </small>
                    </div>

                    <strong>{formatPrice(itemTotal)}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="admin-order-no-data">
              Product details are not available.
            </p>
          )}
        </div>

        {/* PAYMENT DETAILS */}

        <div className="admin-order-detail-section">
          <h3>Payment Information</h3>

          <div className="admin-order-info-grid">
            <div>
              <small>Payment Method</small>
              <strong>
                {order.paymentMethod || "Not available"}
              </strong>
            </div>

            <div>
              <small>Payment Status</small>
              <strong>
                {order.paymentStatus || "Not available"}
              </strong>
            </div>
          </div>
        </div>

        {/* BILL DETAILS */}

        <div className="admin-order-detail-section">
          <h3>Bill Summary</h3>

          <div className="admin-order-bill">
            <div>
              <span>Subtotal</span>
              <strong>
                {formatPrice(
                  order.subtotal ??
                  order.subTotal ??
                  order.total
                )}
              </strong>
            </div>

            <div>
              <span>Delivery Charge</span>
              <strong>
                {formatPrice(
                  order.deliveryCharge ??
                  order.deliveryFee
                )}
              </strong>
            </div>

            {Number(order.discount || 0) > 0 && (
              <div>
                <span>Discount</span>
                <strong>
                  -{formatPrice(order.discount)}
                </strong>
              </div>
            )}

            <div className="admin-order-grand-total">
              <span>Grand Total</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
          </div>
        </div>

        {/* ORDER HISTORY */}

        <div className="admin-order-detail-section">
          <h3>Order History</h3>

          {history.length > 0 ? (
            <div className="admin-order-history">
              {[...history].reverse().map((item, index) => (
                <div
                  className="admin-order-history-item"
                  key={item._id || index}
                >
                  <span className="admin-order-history-dot" />

                  <div>
                    <strong>{item.status}</strong>

                    {item.message && (
                      <p>{item.message}</p>
                    )}

                    <small>
                      {formatDate(item.updatedAt)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-order-no-data">
              Order history is not available.
            </p>
          )}
        </div>

        {/* FOOTER */}

        <div className="admin-order-modal-footer">
          <button onClick={onClose}>
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================
// DASHBOARD
// =========================================

function Dashboard({
  currentUser,
  orders,
  ordersLoading,
  ordersError,
  pendingOrders,
  deliveredOrders,
  totalRevenue,
  todayOrders,
  todaySales,
  deliverySettings,
  onRefreshOrders,
  onChangeTab,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.orderDate || b.createdAt || 0) -
        new Date(a.orderDate || a.createdAt || 0)
    )
    .slice(0, 5);

  return (
    <section>

      {/* WELCOME BANNER */}

      <div className="admin-welcome-banner">
        <div>
          <span>ORGANIGO MANAGEMENT</span>

          <h1>
            Good day, {currentUser?.name || "Admin"}! 👋
          </h1>

          <p>
            Manage your grocery business from one place.
          </p>
        </div>

        <div className="admin-welcome-illustration">
          🛍️
        </div>
      </div>

      {/* BUSINESS OVERVIEW */}

      <div className="admin-section-title">
        <div>
          <h2>Business Overview</h2>
          <p>Your store activity at a glance.</p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={onRefreshOrders}
          disabled={ordersLoading}
        >
          {ordersLoading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* STATISTICS */}

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
          <h3>{formatPrice(totalRevenue)}</h3>
          <small>Value of delivered orders</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">📅</div>
          <span>Today's Orders</span>
          <h3>{todayOrders}</h3>
          <small>Orders placed today</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon green">💰</div>
          <span>Today's Delivered Value</span>
          <h3>{formatPrice(todaySales)}</h3>
          <small>Value of orders delivered today</small>
        </div>

      </div>

      {/* DASHBOARD GRID */}

      <div className="admin-dashboard-grid">

        {/* RECENT ORDERS */}

        <div className="admin-panel-card">

          <div className="admin-panel-heading">
            <div>
              <h3>Recent Orders</h3>
              <p>Latest customer activity</p>
            </div>

            <button onClick={() => onChangeTab("orders")}>
              View All →
            </button>
          </div>

          {ordersLoading && orders.length === 0 ? (
            <div className="admin-empty-state">
              Loading orders...
            </div>
          ) : ordersError ? (
            <div className="admin-empty-state">
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div className="admin-empty-state">
              <span>📦</span>
              <h4>No orders yet</h4>
              <p>Customer orders will appear here.</p>
            </div>
          ) : (
            <div className="admin-recent-orders">

              {recentOrders.map((order) => (
                <div
                  className="admin-recent-order"
                  key={order.orderId}
                >
                  <div>
                    <strong>#{order.orderId}</strong>

                    <span>
                      {order.customer?.name || "Customer"}
                    </span>
                  </div>

                  <div>
                    <strong>{formatPrice(order.total)}</strong>

                    <span className="admin-mini-status">
                      {order.status || "Order Placed"}
                    </span>
                  </div>

                  <button
                    className="admin-view-order-btn"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Details
                  </button>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* QUICK ACTIONS */}

        <div className="admin-panel-card admin-quick-actions">

          <div className="admin-panel-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Manage your store quickly</p>
            </div>
          </div>

          <button onClick={() => onChangeTab("addProduct")}>
            <span>＋</span>
            <div>
              <strong>Add New Product</strong>
              <small>Add products to your store</small>
            </div>
            <b>→</b>
          </button>

          <button onClick={() => onChangeTab("inventory")}>
            <span>📦</span>
            <div>
              <strong>Product Inventory</strong>
              <small>Manage products and stock</small>
            </div>
            <b>→</b>
          </button>

          <button onClick={() => onChangeTab("orders")}>
            <span>🛒</span>
            <div>
              <strong>Manage Orders</strong>
              <small>Check and update customer orders</small>
            </div>
            <b>→</b>
          </button>

          <button onClick={() => onChangeTab("delivery")}>
            <span>🚚</span>
            <div>
              <strong>Delivery Settings</strong>
              <small>Manage your delivery hub</small>
            </div>
            <b>→</b>
          </button>

        </div>
      </div>

      {/* STORE DELIVERY STATUS */}

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

        <button onClick={() => onChangeTab("delivery")}>
          Manage Settings →
        </button>

      </div>

      {/* ORDER DETAILS POPUP */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

    </section>
  );
}

export default Dashboard;