import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://10.124.82.244:5000/api";

const trackingSteps = [
  {
    status: "Order Placed",
    title: "Order Placed",
    description: "We have received your order.",
    icon: "🛒",
  },
  {
    status: "Confirmed",
    title: "Order Confirmed",
    description: "Your order has been accepted.",
    icon: "✓",
  },
  {
    status: "Packed",
    title: "Order Packed",
    description: "Your groceries are packed and ready.",
    icon: "📦",
  },
  {
    status: "Out for Delivery",
    title: "Out for Delivery",
    description: "Your delivery partner is on the way.",
    icon: "🛵",
  },
  {
    status: "Delivered",
    title: "Delivered",
    description: "Your order has been delivered.",
    icon: "🏠",
  },
];

function OrderTracking() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem("organigoToken");

      if (!token) {
        setError("Please login to track your order.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/orders/my-orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load order.");
      }

      setOrder(data.order);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    const interval = setInterval(fetchOrder, 10000);

    return () => clearInterval(interval);
  }, [fetchOrder]);

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentStep = trackingSteps.findIndex(
    (step) => step.status === order?.status
  );

  const isCancelled = order?.status === "Cancelled";

  const styles = `
    .tracking-page {
      min-height: 85vh;
      background: #f5f8f5;
      padding: 30px 15px;
      font-family: Arial, sans-serif;
    }

    .tracking-container {
      max-width: 850px;
      margin: auto;
    }

    .tracking-back {
      display: inline-block;
      color: #168b45;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 22px;
    }

    .tracking-heading h1 {
      color: #173d26;
      font-size: 27px;
      margin-bottom: 7px;
    }

    .tracking-heading p {
      color: #858585;
      font-size: 14px;
    }

    .tracking-card {
      background: white;
      border-radius: 16px;
      padding: 25px;
      margin-top: 22px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.04);
    }

    .tracking-order-info {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 15px;
      border-bottom: 1px solid #edf0ed;
      padding-bottom: 20px;
    }

    .tracking-order-info small {
      display: block;
      color: #888;
      font-size: 12px;
      margin-bottom: 6px;
    }

    .tracking-order-info strong {
      color: #173d26;
      font-size: 15px;
    }

    .tracking-current-status {
      background: #edf9f0;
      padding: 20px;
      border-radius: 12px;
      margin: 22px 0;
    }

    .tracking-current-status h2 {
      color: #168b45;
      font-size: 19px;
      margin-bottom: 7px;
    }

    .tracking-current-status p {
      color: #66756a;
      font-size: 13px;
    }

    .tracking-progress-heading {
      color: #173d26;
      font-size: 17px;
      margin-bottom: 22px;
    }

    .tracking-timeline {
      position: relative;
      margin-left: 12px;
    }

    .tracking-item {
      display: flex;
      gap: 16px;
      position: relative;
      min-height: 85px;
    }

    .tracking-line {
      position: absolute;
      left: 16px;
      top: 34px;
      width: 3px;
      height: 53px;
      background: #e5ebe6;
    }

    .tracking-line.active {
      background: #168b45;
    }

    .tracking-icon {
      width: 35px;
      height: 35px;
      flex-shrink: 0;
      border-radius: 50%;
      background: #edf0ed;
      color: #999;
      display: grid;
      place-items: center;
      font-size: 16px;
      font-weight: bold;
      z-index: 1;
    }

    .tracking-icon.active {
      background: #168b45;
      color: white;
    }

    .tracking-item-content {
      padding-top: 3px;
    }

    .tracking-item-content strong {
      display: block;
      color: #999;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .tracking-item-content strong.active {
      color: #168b45;
    }

    .tracking-item-content p {
      color: #999;
      font-size: 12px;
    }

    .tracking-history-time {
      color: #168b45 !important;
      margin-top: 5px;
    }

    .tracking-products {
      border-top: 1px solid #edf0ed;
      padding-top: 20px;
      margin-top: 15px;
    }

    .tracking-products h3 {
      color: #173d26;
      font-size: 16px;
      margin-bottom: 15px;
    }

    .tracking-product {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 13px;
    }

    .tracking-product img {
      width: 50px;
      height: 50px;
      object-fit: contain;
      border-radius: 8px;
      background: #f5f8f5;
    }

    .tracking-product strong {
      color: #26392c;
      font-size: 13px;
    }

    .tracking-product small {
      display: block;
      color: #888;
      margin-top: 5px;
    }

    .tracking-total {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #edf0ed;
      padding-top: 15px;
      margin-top: 15px;
      color: #173d26;
      font-weight: 800;
    }

    .tracking-cancelled {
      background: #fff0f0;
      color: #d93636;
      padding: 22px;
      border-radius: 12px;
      margin-top: 20px;
    }

    .tracking-cancelled h2 {
      font-size: 19px;
      margin-bottom: 8px;
    }

    .tracking-error {
      text-align: center;
      background: white;
      padding: 35px 15px;
      border-radius: 12px;
      color: #555;
    }

    .tracking-refresh {
      color: #888;
      font-size: 11px;
      text-align: center;
      margin-top: 18px;
    }

    @media (max-width: 600px) {
      .tracking-page {
        padding: 22px 12px;
      }

      .tracking-card {
        padding: 17px;
      }

      .tracking-heading h1 {
        font-size: 23px;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>

      <div className="tracking-page">
        <div className="tracking-container">

          <Link to="/my-orders" className="tracking-back">
            ← Back to My Orders
          </Link>

          <div className="tracking-heading">
            <h1>Track Your Order</h1>
            <p>Follow your ORGANIGO delivery journey.</p>
          </div>

          {loading && (
            <div className="tracking-error">
              Loading your order details...
            </div>
          )}

          {!loading && error && (
            <div className="tracking-error">
              <h3>Unable to load order</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && order && (
            <div className="tracking-card">

              <div className="tracking-order-info">
                <div>
                  <small>ORDER ID</small>
                  <strong>{order.orderId}</strong>
                </div>

                <div>
                  <small>ORDER DATE</small>
                  <strong>
                    {formatDate(order.orderDate || order.createdAt)}
                  </strong>
                </div>
              </div>

              {isCancelled ? (
                <div className="tracking-cancelled">
                  <h2>Order Cancelled</h2>
                  <p>This order is no longer being processed.</p>

                  {order.cancellationReason && (
                    <p style={{ marginTop: 10 }}>
                      Reason: {order.cancellationReason}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="tracking-current-status">
                    <h2>
                      {order.status === "Delivered"
                        ? "🎉 Your Order is Delivered!"
                        : `✓ ${order.status}`}
                    </h2>

                    <p>
                      {trackingSteps.find(
                        (step) => step.status === order.status
                      )?.description || "Your order is being processed."}
                    </p>
                  </div>

                  <h3 className="tracking-progress-heading">
                    Delivery Progress
                  </h3>

                  <div className="tracking-timeline">
                    {trackingSteps.map((step, index) => {
                      const completed = currentStep >= index;

                      const history = order.statusHistory?.find(
                        (item) => item.status === step.status
                      );

                      return (
                        <div className="tracking-item" key={step.status}>
                          {index !== trackingSteps.length - 1 && (
                            <div
                              className={`tracking-line ${
                                currentStep > index ? "active" : ""
                              }`}
                            />
                          )}

                          <div
                            className={`tracking-icon ${
                              completed ? "active" : ""
                            }`}
                          >
                            {completed ? "✓" : step.icon}
                          </div>

                          <div className="tracking-item-content">
                            <strong className={completed ? "active" : ""}>
                              {step.title}
                            </strong>

                            <p>{step.description}</p>

                            {history?.updatedAt && (
                              <p className="tracking-history-time">
                                {formatDate(history.updatedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="tracking-products">
                <h3>Order Summary</h3>

                {(order.items || []).map((item, index) => (
                  <div className="tracking-product" key={index}>
                    {item.image && (
                      <img src={item.image} alt={item.name} />
                    )}

                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.unit} × {item.quantity}
                      </small>
                    </div>
                  </div>
                ))}

                <div className="tracking-total">
                  <span>Total Amount</span>
                  <span>₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>

              <p className="tracking-refresh">
                Order status automatically refreshes every 10 seconds.
              </p>

            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default OrderTracking;