
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../styles/Checkout.css";

const API_URL = "http://localhost:5000/api/orders";

const DEFAULT_HUB = {
  latitude: 22.5504,
  longitude: 85.8025,
  radius: 10,
  active: true,
  city: "Chaibasa",
  state: "Jharkhand",
};

function getSavedLocation() {
  try {
    const saved = localStorage.getItem("organigoSelectedLocation");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getHubSettings() {
  try {
    const saved = localStorage.getItem("organigoDeliverySettings");

    return saved
      ? { ...DEFAULT_HUB, ...JSON.parse(saved) }
      : DEFAULT_HUB;
  } catch {
    return DEFAULT_HUB;
  }
}

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

function verifyDelivery(location) {
  const settings = getHubSettings();

  if (!location) {
    return {
      available: false,
      message: "Please select your delivery location.",
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
    Math.abs(customerLat) > 90 ||
    Math.abs(customerLon) > 180 ||
    Math.abs(hubLat) > 90 ||
    Math.abs(hubLon) > 180 ||
    radius <= 0
  ) {
    return {
      available: false,
      message: "Invalid location. Please select your location again.",
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
      message: "Delivery is available at your location!",
    };
  }

  return {
    available: false,
    distance: distance.toFixed(2),
    message: `Your location is outside our ${radius} km delivery area.`,
  };
}

function Checkout() {
  const navigate = useNavigate();

  const { cartItems, cartTotal, clearCart } = useCart();

  const savedLocation = getSavedLocation();
  const hubSettings = getHubSettings();

  const savedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("organigoUser") || "null");
    } catch {
      return null;
    }
  })();

  const [formData, setFormData] = useState({
    name: savedUser?.name || "",
    phone: savedUser?.phone || "",
    address: savedLocation?.fullAddress || "",
    city: hubSettings.city || "Chaibasa",
    state: hubSettings.state || "Jharkhand",
    pincode: "",
  });

  const [location, setLocation] = useState(savedLocation);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const delivery = verifyDelivery(location);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  };

  // =================================
  // GET CURRENT GPS LOCATION
  // =================================

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support location.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        let selectedLocation = {
          latitude,
          longitude,
          source: "gps",
          updatedAt: new Date().toISOString(),
        };

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};

            selectedLocation = {
              ...selectedLocation,
              name: data.name || data.display_name,
              fullAddress: data.display_name,
              postcode: address.postcode || "",
            };

            setFormData((previous) => ({
              ...previous,
              address: data.display_name || previous.address,
              city:
                address.city ||
                address.town ||
                address.village ||
                address.county ||
                previous.city,
              state: address.state || previous.state,
              pincode: address.postcode || previous.pincode,
            }));

            setLocationMessage("Address filled successfully!");
          } else {
            setLocationMessage(
              "Location captured. Please enter your address manually."
            );
          }
        } catch {
          setLocationMessage(
            "Location captured. Please enter your address manually."
          );
        }

        setLocation(selectedLocation);

        localStorage.setItem(
          "organigoSelectedLocation",
          JSON.stringify(selectedLocation)
        );

        window.dispatchEvent(new Event("organigoLocationUpdated"));

        const result = verifyDelivery(selectedLocation);

        if (!result.available) {
          setLocationMessage(result.message);
        }

        setLocationLoading(false);
      },
      (error) => {
        if (error.code === 1) {
          setLocationMessage(
            "Location permission denied. Please allow location access."
          );
        } else if (error.code === 2) {
          setLocationMessage("Location unavailable. Please try again.");
        } else {
          setLocationMessage("Location request timed out. Try again.");
        }

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  // =================================
  // PLACE ORDER IN MONGODB
  // =================================

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (placingOrder) return;

    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    // Check login token
    const token = localStorage.getItem("organigoToken");

    if (!token) {
      navigate("/login", {
        state: { from: "/checkout" },
      });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      setErrorMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    const finalDelivery = verifyDelivery(location);

    if (!finalDelivery.available) {
      setErrorMessage(finalDelivery.message);
      return;
    }

    if (paymentMethod !== "Cash on Delivery") {
      setErrorMessage("Online UPI payment is coming soon. Please select COD.");
      return;
    }

    const newOrderId = "ORG" + Date.now().toString().slice(-8);

    const mapLink = location
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : "";

    const newOrder = {
      orderId: newOrderId,

      customer: {
        ...formData,
      },

      location: {
        name: location?.name || "",
        fullAddress: location?.fullAddress || "",
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      },

      mapLink,

      items: cartItems.map((item) => ({
        productId: String(item.id || item._id || ""),
        name: item.name,
        image: item.image || item.imageUrl || "",
        price: Number(item.price),
        quantity: Number(item.quantity),
        unit: item.unit || "",
      })),

      total: Number(cartTotal),

      paymentMethod: "Cash on Delivery",

      paymentStatus: "Pending - Cash on Delivery",

      deliveryDistance: Number(finalDelivery.distance),

      status: "Order Placed",

      orderDate: new Date().toISOString(),
    };

    try {
      setPlacingOrder(true);

      // Send order with login token
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newOrder),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          localStorage.removeItem("organigoToken");
          localStorage.removeItem("organigoUser");

          navigate("/login", {
            state: { from: "/checkout" },
          });

          return;
        }

        throw new Error(
          result.message || "Unable to place your order."
        );
      }

      // Save local copy for existing Admin Panel
      const savedOrders = JSON.parse(
        localStorage.getItem("organigoOrders") || "[]"
      );

      localStorage.setItem(
        "organigoOrders",
        JSON.stringify([...savedOrders, result.order])
      );

      setOrderId(result.order.orderId || newOrderId);

      clearCart();

      setOrderPlaced(true);
    } catch (error) {
      console.error("Order Placement Error:", error);

      setErrorMessage(
        error.message ||
          "Unable to connect to ORGANIGO server. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // =================================
  // SUCCESS SCREEN
  // =================================

  if (orderPlaced) {
    return (
      <div className="checkout-success">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>

        <p>Thank you for shopping with ORGANIGO.</p>

        <h3>Order ID: {orderId}</h3>

        <p>Payment Method: Cash on Delivery</p>

        {location && (
          <a
            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            View Delivery Location 📍
          </a>
        )}

        <br />

        <button
          className="success-home-btn"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </button>

        <br />

        <button
          className="success-home-btn"
          onClick={() => navigate("/my-orders")}
        >
          View My Orders
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your Cart is Empty 🛒</h2>

        <button onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    );
  }

  // =================================
  // CHECKOUT PAGE
  // =================================

  return (
    <div className="checkout-page">
      <div className="checkout-heading">
        <h1>Checkout</h1>
        <p>Complete your order details</p>
      </div>

      <div className="checkout-container">
        <form
          className="checkout-form"
          onSubmit={handlePlaceOrder}
        >
          <h2>Delivery Information</h2>

          <label>Full Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Mobile Number</label>

          <input
            type="tel"
            name="phone"
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChange={handleChange}
            maxLength="10"
            required
          />

          <div className="location-box">
            <h3>📍 Delivery Location</h3>

            <p>
              Your selected location will be used to verify delivery availability.
            </p>

            <button
              type="button"
              className="location-btn"
              onClick={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading
                ? "Getting Location..."
                : "📍 Use My Current Location"}
            </button>

            {locationMessage && (
              <p className="location-message">
                {locationMessage}
              </p>
            )}

            {location && (
              <div className="checkout-selected-location">
                <strong>Selected Location</strong>

                <p>
                  {location.fullAddress ||
                    location.name ||
                    "GPS location selected"}
                </p>

                <a
                  className="map-link"
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Google Maps ↗
                </a>
              </div>
            )}
          </div>

          <label>House No. / Street / Landmark</label>

          <textarea
            name="address"
            placeholder="Enter house number, street, area and landmark"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <div className="checkout-input-row">
            <div>
              <label>City</label>

              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>State</label>

              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label>PIN Code</label>

          <input
            type="text"
            name="pincode"
            placeholder="6-digit PIN code"
            value={formData.pincode}
            onChange={handleChange}
            maxLength="6"
            required
          />

          <div
            className={`checkout-delivery-status ${
              delivery.available ? "available" : "unavailable"
            }`}
          >
            <strong>
              {delivery.available
                ? "✓ Delivery Available"
                : "✕ Delivery Not Available"}
            </strong>

            <p>{delivery.message}</p>

            {delivery.distance && (
              <small>
                Distance from hub: {delivery.distance} km
              </small>
            )}
          </div>

          <div className="payment-method">
            <h3>Payment Method</h3>

            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="Cash on Delivery"
                checked={paymentMethod === "Cash on Delivery"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />

              <span>💵 Cash on Delivery</span>
            </label>

            <label className="payment-option payment-disabled">
              <input
                type="radio"
                name="payment"
                value="UPI"
                disabled
              />

              <span>📱 UPI Payment (Coming Soon)</span>
            </label>
          </div>

          {errorMessage && (
            <div className="checkout-error">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="place-order-btn"
            disabled={!delivery.available || placingOrder}
          >
            {placingOrder ? "Placing Order..." : "Place Order →"}
          </button>
        </form>

        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {cartItems.map((item) => (
            <div className="checkout-item" key={item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>

              <strong>
                ₹{Number(item.price) * item.quantity}
              </strong>
            </div>
          ))}

          <hr />

          <div className="checkout-total">
            <span>Total Amount</span>

            <strong>₹{cartTotal}</strong>
          </div>

          <p className="checkout-delivery">
            🚚 Free Delivery
          </p>

          <p className="checkout-secure">
            🔒 Your delivery details will be used to process your order.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;