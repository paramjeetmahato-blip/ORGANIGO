
import { useState } from "react";
import { useCart } from "../context/CartContext";
import "../styles/Checkout.css";

function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // GET CUSTOMER CURRENT LOCATION
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

        setLocation({ latitude, longitude });

        setLocationMessage("Location captured successfully!");

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};

            setFormData((previous) => ({
              ...previous,
              address:
                data.display_name || previous.address,
              city:
                address.city ||
                address.town ||
                address.village ||
                address.county ||
                previous.city,
              state: address.state || previous.state,
              pincode: address.postcode || previous.pincode,
            }));

            setLocationMessage(
              "Location captured and address filled successfully!"
            );
          }
        } catch (error) {
          setLocationMessage(
            "Location captured. Please enter your address manually."
          );
        }

        setLocationLoading(false);
      },

      (error) => {
        if (error.code === 1) {
          setLocationMessage(
            "Location permission denied. Please allow location access."
          );
        } else if (error.code === 2) {
          setLocationMessage("Location is unavailable. Try again.");
        } else {
          setLocationMessage("Location request timed out. Try again.");
        }

        setLocationLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // PLACE ORDER
  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      alert("Please enter a valid 6-digit PIN code.");
      return;
    }

    const newOrderId = "ORG" + Date.now().toString().slice(-8);

    const newOrder = {
      orderId: newOrderId,
      customer: formData,
      location: location,
      mapLink: location
        ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        : "",
      items: cartItems,
      total: cartTotal,
      paymentMethod: "Cash on Delivery",
      status: "Order Placed",
      orderDate: new Date().toLocaleString(),
    };

    try {
      const savedOrders = JSON.parse(
        localStorage.getItem("organigoOrders") || "[]"
      );

      localStorage.setItem(
        "organigoOrders",
        JSON.stringify([...savedOrders, newOrder])
      );

      setOrderId(newOrderId);
      clearCart();
      setOrderPlaced(true);
    } catch (error) {
      alert("Unable to save your order. Please try again.");
    }
  };

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

        <a href="/" className="success-home-btn">
          Continue Shopping
        </a>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your Cart is Empty 🛒</h2>
        <a href="/">Continue Shopping</a>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-heading">
        <h1>Checkout</h1>
        <p>Complete your order details</p>
      </div>

      <div className="checkout-container">
        <form className="checkout-form" onSubmit={handlePlaceOrder}>
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

          {/* CURRENT LOCATION BUTTON */}
          <div className="location-box">
            <h3>📍 Delivery Location</h3>

            <p>Use your current location for delivery.</p>

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
              <a
                className="map-link"
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                View Location on Google Maps ↗
              </a>
            )}
          </div>

          <label>Full Address</label>
          <textarea
            name="address"
            placeholder="House number, street, landmark"
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

          <div className="payment-method">
            <h3>Payment Method</h3>
            <p>💵 Cash on Delivery</p>
          </div>

          <button type="submit" className="place-order-btn">
            Place Order →
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
        </div>
      </div>
    </div>
  );
}

export default Checkout;