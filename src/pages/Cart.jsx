import { useState } from "react";
import { getToken } from "../utils/auth";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";

// Default ORGANIGO delivery hub
const DEFAULT_HUB = {
  latitude: 22.5504,
  longitude: 85.8025,
  radius: 10,
  active: true,
};

// Distance calculate karne ka function
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const earthRadius = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Admin delivery settings
function getDeliverySettings() {
  try {
    const saved = localStorage.getItem("organigoDeliverySettings");

    if (!saved) return DEFAULT_HUB;

    return {
      ...DEFAULT_HUB,
      ...JSON.parse(saved),
    };
  } catch {
    return DEFAULT_HUB;
  }
}

// Customer selected location
function getCustomerLocation() {
  try {
    const saved = localStorage.getItem("organigoSelectedLocation");

    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Delivery verification
function checkDeliveryAvailability() {
  const location = getCustomerLocation();
  const settings = getDeliverySettings();

  if (!location) {
    return {
      available: false,
      message: "Please select your delivery location first.",
    };
  }

  if (!settings.active) {
    return {
      available: false,
      message: "ORGANIGO delivery is currently unavailable.",
    };
  }

  const customerLat = Number(location.latitude);
  const customerLon = Number(location.longitude);

  const hubLat = Number(settings.latitude);
  const hubLon = Number(settings.longitude);
  const radius = Number(settings.radius);

  if (
    !Number.isFinite(customerLat) ||
    !Number.isFinite(customerLon) ||
    !Number.isFinite(hubLat) ||
    !Number.isFinite(hubLon) ||
    !Number.isFinite(radius) ||
    radius <= 0 ||
    Math.abs(customerLat) > 90 ||
    Math.abs(customerLon) > 180 ||
    Math.abs(hubLat) > 90 ||
    Math.abs(hubLon) > 180
  ) {
    return {
      available: false,
      message: "Location details are invalid. Please select your location again.",
    };
  }

  const distance = getDistanceKm(
    hubLat,
    hubLon,
    customerLat,
    customerLon
  );

  if (distance <= radius) {
    return {
      available: true,
      distance: distance.toFixed(2),
      message: "Great! Delivery is available at your location.",
    };
  }

  return {
    available: false,
    distance: distance.toFixed(2),
    message: `Sorry! Your location is ${distance.toFixed(
      2
    )} km away. Our delivery radius is ${radius} km.`,
  };
}

function Cart() {
  const navigate = useNavigate();

  const [checkoutMessage, setCheckoutMessage] = useState("");

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
  } = useCart();

  const delivery = checkDeliveryAvailability();

  const handleCheckout = () => {
    // Fresh delivery verification
    const latestDelivery = checkDeliveryAvailability();

    if (!latestDelivery.available) {
      setCheckoutMessage(latestDelivery.message);
      return;
    }

    setCheckoutMessage("");

    const token = getToken();

    if (token) {
      navigate("/checkout");
    } else {
      navigate("/login", {
        state: { from: "/checkout" },
      });
    }
  };

  return (
    <div className="cart-page">

      <div className="cart-heading">
        <h1>My Shopping Cart 🛒</h1>
        <p>Manage your grocery items</p>
      </div>

      {cartItems.length === 0 ? (

        <div className="empty-cart">
          <div>🛒</div>
          <h2>Your Cart is Empty!</h2>
          <p>Add some fresh products to your cart.</p>

          <button
            className="continue-shopping"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>

      ) : (

        <div className="cart-container">

          <div className="cart-products">

            {cartItems.map((item) => (

              <div className="cart-item" key={item.id}>

                <div className="cart-product-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <span>{item.icon || "🛒"}</span>
                  )}
                </div>

                <div className="cart-product-details">

                  <h3>{item.name}</h3>
                  <p>{item.weight || "Available"}</p>

                  <strong>₹{item.price}</strong>

                  <div className="quantity-controls">

                    <button onClick={() => decreaseQuantity(item.id)}>
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button onClick={() => increaseQuantity(item.id)}>
                      +
                    </button>

                  </div>

                  <p className="item-total">
                    Total: ₹{Number(item.price) * item.quantity}
                  </p>

                  <button
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>

                </div>

              </div>

            ))}

          </div>

          <div className="cart-summary">

            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>₹{cartTotal}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <strong>Free</strong>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total Amount</span>
              <strong>₹{cartTotal}</strong>
            </div>

            {/* DELIVERY STATUS */}

            <div
              style={{
                marginTop: "15px",
                marginBottom: "12px",
                padding: "13px",
                borderRadius: "10px",
                background: delivery.available ? "#eaf8ee" : "#fff0f0",
                border: `1px solid ${
                  delivery.available ? "#c9ebd2" : "#ffdada"
                }`,
                color: delivery.available ? "#087a36" : "#b52b2b",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              <strong>
                {delivery.available
                  ? "✓ Delivery Available"
                  : "✕ Delivery Not Available"}
              </strong>

              <p style={{ margin: "5px 0 0" }}>
                {delivery.message}
              </p>

              {delivery.distance && (
                <p style={{ margin: "5px 0 0" }}>
                  Distance from delivery hub: {delivery.distance} km
                </p>
              )}
            </div>

            {/* CHECKOUT MESSAGE */}

            {checkoutMessage && (
              <p
                style={{
                  color: "#c02b2b",
                  fontSize: "12px",
                  marginBottom: "10px",
                }}
              >
                {checkoutMessage}
              </p>
            )}

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={!delivery.available}
              style={{
                opacity: delivery.available ? 1 : 0.5,
                cursor: delivery.available ? "pointer" : "not-allowed",
              }}
            >
              Proceed to Checkout →
            </button>

            <button
              className="clear-cart-btn"
              onClick={clearCart}
            >
              Clear Cart
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default Cart;