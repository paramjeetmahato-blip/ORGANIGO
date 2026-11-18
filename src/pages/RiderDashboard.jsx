import React, { useCallback, useEffect, useState } from "react";

const API_URL = "http://10.124.82.244:5000/api";

function RiderDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState("");
  const [error, setError] = useState("");

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setError("Please login with your rider account.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orders/rider/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load orders.");
      }

      setOrders(Array.isArray(data) ? data : data.orders || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingOrder(orderId);

      const response = await fetch(
        `${API_URL}/orders/rider/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update order.");
      }

      alert("Order status updated successfully!");
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingOrder("");
    }
  };

  const shareLocation = (orderId) => {
    if (!navigator.geolocation) {
      alert("Location is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `${API_URL}/orders/rider/${orderId}/location`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Location update failed.");
          }

          alert("Location shared successfully!");
        } catch (err) {
          alert(err.message);
        }
      },
      () => {
        alert("Please allow location permission.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN");
  };

  if (loading) {
    return <div style={styles.center}>Loading rider dashboard...</div>;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>ORGANIGO Rider</h1>
          <p style={styles.subtitle}>Delivery Partner Dashboard</p>
        </div>

        <button style={styles.refreshButton} onClick={fetchOrders}>
          Refresh
        </button>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      {!error && (
        <div style={styles.summary}>
          <div style={styles.summaryCard}>
            <h2>{orders.length}</h2>
            <p>Assigned Orders</p>
          </div>

          <div style={styles.summaryCard}>
            <h2>
              {orders.filter((o) => o.status === "Out for Delivery").length}
            </h2>
            <p>On the Way</p>
          </div>

          <div style={styles.summaryCard}>
            <h2>
              {orders.filter((o) => o.status === "Delivered").length}
            </h2>
            <p>Delivered</p>
          </div>
        </div>
      )}

      <h2 style={styles.sectionTitle}>My Assigned Orders</h2>

      {!error && orders.length === 0 && (
        <div style={styles.empty}>
          <h3>No Orders Assigned</h3>
          <p>New delivery orders will appear here.</p>
        </div>
      )}

      <div style={styles.orderList}>
        {orders.map((order) => {
          const orderId = order._id || order.id;
          const isUpdating = updatingOrder === orderId;

          return (
            <div style={styles.orderCard} key={orderId}>
              <div style={styles.orderTop}>
                <div>
                  <h3>Order #{String(orderId).slice(-6)}</h3>
                  <p style={styles.date}>
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <span style={styles.status}>
                  {order.status || "Pending"}
                </span>
              </div>

              <div style={styles.divider} />

              <h4>Customer Details</h4>

              <p>
                <strong>Name:</strong>{" "}
                {order.customerName || order.name || "Customer"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {order.phone || order.customerPhone || "N/A"}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {order.address || order.deliveryAddress || "N/A"}
              </p>

              <div style={styles.divider} />

              <h4>Order Items</h4>

              {(order.items || order.orderItems || []).map(
                (item, index) => (
                  <div style={styles.item} key={index}>
                    <span>{item.name}</span>
                    <span>
                      × {item.quantity || item.qty || 1}
                    </span>
                  </div>
                )
              )}

              <div style={styles.divider} />

              <div style={styles.payment}>
                <strong>Total Amount</strong>
                <strong>
                  ₹{order.totalAmount || order.total || 0}
                </strong>
              </div>

              <p>
                <strong>Payment:</strong>{" "}
                {order.paymentMethod || "N/A"}
              </p>

              <div style={styles.actions}>
                {order.status !== "Out for Delivery" &&
                  order.status !== "Delivered" &&
                  order.status !== "Cancelled" && (
                    <button
                      style={styles.primaryButton}
                      disabled={isUpdating}
                      onClick={() =>
                        updateStatus(orderId, "Out for Delivery")
                      }
                    >
                      {isUpdating ? "Updating..." : "Start Delivery"}
                    </button>
                  )}

                {order.status === "Out for Delivery" && (
                  <>
                    <button
                      style={styles.locationButton}
                      onClick={() => shareLocation(orderId)}
                    >
                      Share Location
                    </button>

                    <button
                      style={styles.deliveredButton}
                      disabled={isUpdating}
                      onClick={() =>
                        updateStatus(orderId, "Delivered")
                      }
                    >
                      {isUpdating ? "Updating..." : "Mark Delivered"}
                    </button>
                  </>
                )}

                {order.status === "Delivered" && (
                  <div style={styles.completed}>
                    ✓ Order Delivered
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f5",
    padding: "25px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "25px",
  },
  heading: {
    color: "#16833b",
    margin: 0,
    fontSize: "28px",
  },
  subtitle: {
    color: "#777",
    margin: "6px 0 0",
  },
  refreshButton: {
    padding: "11px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#16833b",
    color: "white",
    cursor: "pointer",
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  },
  summaryCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    color: "#222",
    marginBottom: "18px",
  },
  orderList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "20px",
  },
  orderCard: {
    background: "white",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
    overflowWrap: "anywhere",
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },
  status: {
    background: "#e7f6eb",
    color: "#16833b",
    padding: "7px 10px",
    borderRadius: "20px",
    fontSize: "12px",
  },
  date: {
    color: "#888",
    fontSize: "12px",
  },
  divider: {
    borderTop: "1px solid #eee",
    margin: "15px 0",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    fontSize: "14px",
  },
  payment: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "18px",
  },
  primaryButton: {
    background: "#16833b",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  locationButton: {
    background: "#2878c8",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deliveredButton: {
    background: "#159957",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  completed: {
    background: "#e7f6eb",
    color: "#16833b",
    padding: "12px",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
  },
  empty: {
    background: "white",
    padding: "35px",
    textAlign: "center",
    borderRadius: "12px",
  },
  error: {
    background: "#ffeaea",
    color: "#b42318",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  center: {
    padding: "50px",
    textAlign: "center",
  },
};

export default RiderDashboard;