import { useState, useEffect, useCallback } from "react";
import { getToken, getUser } from "../utils/auth";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState("");

  const fetchOrders = useCallback(async () => {
    const token = getToken();
    const user = getUser();

    if (!token || user?.role !== "customer") {
      setLoading(false);
      setError(
        "Please login with your customer account to view your orders."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch orders.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // CANCEL ORDER
  const cancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    const reason =
      window.prompt(
        "Please enter your cancellation reason (optional):"
      ) || "";

    try {
      setCancelling(orderId);

      const token = getToken();

      const response = await fetch(
        `${API_URL}/orders/my-orders/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to cancel order.");
      }

      alert("Your order has been cancelled successfully.");

      await fetchOrders();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling("");
    }
  };

  // DATE FORMAT
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // OPEN TRACKING PAGE
  const trackOrder = (order) => {
    if (!order.orderId) {
      alert("Order ID is missing. Please refresh your orders.");
      return;
    }

    navigate(
      `/track-order/${encodeURIComponent(order.orderId)}`
    );
  };

  const styles = `
    .my-orders-page {
      min-height: 80vh;
      background: #f7f9f7;
      padding: 30px 5%;
      font-family: Arial, sans-serif;
    }

    .my-orders-container {
      max-width: 1050px;
      margin: auto;
    }

    .my-orders-heading {
      margin-bottom: 25px;
    }

    .my-orders-heading h1 {
      color: #173d26;
      font-size: 28px;
      margin-bottom: 7px;
    }

    .my-orders-heading p {
      color: #777;
      font-size: 14px;
    }

    .order-card {
      background: white;
      border: 1px solid #e8eee9;
      border-radius: 13px;
      padding: 20px;
      margin-bottom: 17px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.035);
    }

    .order-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      border-bottom: 1px solid #edf0ed;
      padding-bottom: 15px;
    }

    .order-id {
      color: #173d26;
      font-weight: 800;
      font-size: 15px;
    }

    .order-date {
      color: #888;
      font-size: 12px;
      margin-top: 6px;
    }

    .order-status {
      display: inline-block;
      padding: 7px 12px;
      border-radius: 20px;
      background: #e9f8ed;
      color: #16833d;
      font-size: 12px;
      font-weight: 700;
      height: fit-content;
    }

    .order-status.cancelled {
      background: #fff0f0;
      color: #d93636;
    }

    .order-products {
      padding: 15px 0;
    }

    .order-product {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .order-product img {
      width: 55px;
      height: 55px;
      object-fit: contain;
      background: #f7f9f7;
      border-radius: 9px;
    }

    .order-product-name {
      color: #26392c;
      font-size: 14px;
      font-weight: 700;
    }

    .order-product-info {
      color: #888;
      font-size: 12px;
      margin-top: 5px;
    }

    .order-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      border-top: 1px solid #edf0ed;
      padding-top: 15px;
    }

    .order-total {
      color: #173d26;
      font-size: 19px;
      font-weight: 800;
    }

    .order-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
    }

    .order-btn {
      border: none;
      border-radius: 7px;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.2s ease;
    }

    .track-btn {
      background: #168b45;
      color: white;
    }

    .track-btn:hover {
      background: #106d35;
    }

    .cancel-btn {
      background: #fff0f0;
      color: #d93636;
    }

    .cancel-btn:hover {
      background: #ffe0e0;
    }

    .cancel-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-orders {
      background: white;
      text-align: center;
      padding: 55px 20px;
      border-radius: 13px;
    }

    .empty-orders h2 {
      color: #173d26;
      margin-bottom: 10px;
    }

    .empty-orders p {
      color: #888;
      margin-bottom: 20px;
    }

    .shop-btn {
      display: inline-block;
      background: #168b45;
      color: white;
      padding: 12px 22px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
    }

    .orders-message {
      background: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      color: #555;
    }

    @media (max-width: 600px) {
      .my-orders-page {
        padding: 22px 12px;
      }

      .my-orders-heading h1 {
        font-size: 23px;
      }

      .order-card {
        padding: 14px;
      }

      .order-bottom {
        align-items: flex-start;
        flex-direction: column;
      }

      .order-actions {
        width: 100%;
      }

      .order-btn {
        flex: 1;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>

      <div className="my-orders-page">
        <div className="my-orders-container">

          <div className="my-orders-heading">
            <h1>My Orders</h1>
            <p>View and track all your ORGANIGO orders.</p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="orders-message">
              Loading your orders...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="orders-message">
              <p>{error}</p>
              <br />

              <button
                className="order-btn track-btn"
                onClick={() => navigate("/login")}
              >
                Login as Customer
              </button>
            </div>
          )}

          {/* EMPTY ORDERS */}
          {!loading && !error && orders.length === 0 && (
            <div className="empty-orders">
              <h2>No Orders Yet!</h2>
              <p>Your grocery orders will appear here.</p>

              <Link to="/" className="shop-btn">
                Start Shopping
              </Link>
            </div>
          )}

          {/* ORDER LIST */}
          {!loading &&
            !error &&
            orders.map((order) => {
              const isCancelled = order.status === "Cancelled";

              const canCancel = [
                "Order Placed",
                "Confirmed",
              ].includes(order.status);

              return (
                <div className="order-card" key={order._id}>

                  {/* ORDER HEADER */}
                  <div className="order-top">
                    <div>
                      <div className="order-id">
                        Order ID: {order.orderId}
                      </div>

                      <div className="order-date">
                        {formatDate(
                          order.orderDate || order.createdAt
                        )}
                      </div>
                    </div>

                    <span
                      className={`order-status ${
                        isCancelled ? "cancelled" : ""
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* ORDER PRODUCTS */}
                  <div className="order-products">
                    {(order.items || []).map((item, index) => (
                      <div
                        className="order-product"
                        key={index}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                          />
                        ) : (
                          <div
                            style={{
                              width: 55,
                              height: 55,
                              background: "#f0f4f0",
                              borderRadius: 9,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            🥬
                          </div>
                        )}

                        <div>
                          <div className="order-product-name">
                            {item.name}
                          </div>

                          <div className="order-product-info">
                            {item.unit} × {item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ORDER FOOTER */}
                  <div className="order-bottom">
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#888",
                        }}
                      >
                        Total Amount
                      </div>

                      <div className="order-total">
                        ₹{Number(order.total || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="order-actions">

                      {/* TRACK ORDER */}
                      <button
                        className="order-btn track-btn"
                        onClick={() => trackOrder(order)}
                      >
                        📦 Track Order
                      </button>

                      {/* CANCEL ORDER */}
                      {canCancel && (
                        <button
                          className="order-btn cancel-btn"
                          disabled={
                            cancelling === order.orderId
                          }
                          onClick={() =>
                            cancelOrder(order.orderId)
                          }
                        >
                          {cancelling === order.orderId
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      )}

                    </div>
                  </div>

                  {/* CANCELLATION REASON */}
                  {isCancelled && order.cancellationReason && (
                    <p
                      style={{
                        color: "#d93636",
                        fontSize: 13,
                        marginTop: 12,
                      }}
                    >
                      Cancellation reason:{" "}
                      {order.cancellationReason}
                    </p>
                  )}

                </div>
              );
            })}

        </div>
      </div>
    </>
  );
}

export default MyOrders;