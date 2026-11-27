import API_BASE_URL from "../services/api";
import { useState, useEffect } from "react";
import { getToken, getUser, clearSession } from "../utils/auth";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../styles/Checkout.css";

const API_URL = `${API_BASE_URL}/api/orders`;
const ADDRESS_API = `${API_BASE_URL}/api/addresses`;
const DELIVERY_SETTINGS_API = `${API_BASE_URL}/api/delivery-settings`;

const DEFAULT_HUB = {
latitude: 22.5504,
longitude: 85.8025,
radius: 10,
active: true,
city: "Chaibasa",
state: "Jharkhand",
};

// HEADER STYLE LOCATION ICON
function LocationIcon({ className = "" }) {
return (
<svg
   className={className}
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="2"
   strokeLinecap="round"
   strokeLinejoin="round"
   aria-hidden="true"
 >
<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
<circle cx="12" cy="10" r="2.5" />
</svg>
);
}

function getSavedLocation() {
try {
const saved = localStorage.getItem("organigoSelectedLocation");
return saved ? JSON.parse(saved) : null;
} catch {
return null;
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

function verifyDelivery(location, settings = DEFAULT_HUB) {
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

function getAddressLocation(address) {
if (
!address ||
address.latitude === null ||
address.latitude === undefined ||
address.longitude === null ||
address.longitude === undefined
) {
return null;
}

const latitude = Number(address.latitude);
const longitude = Number(address.longitude);

if (
!Number.isFinite(latitude) ||
!Number.isFinite(longitude) ||
Math.abs(latitude) > 90 ||
Math.abs(longitude) > 180
) {
return null;
}

const fullAddress = [
address.houseNo,
address.area,
address.landmark,
address.city,
address.state,
address.pincode,
]
.filter(Boolean)
.join(", ");

return {
latitude,
longitude,
name: address.label || "Saved Address",
fullAddress,
source: "saved-address",
updatedAt: new Date().toISOString(),
};
}

function Checkout() {
const navigate = useNavigate();
const { cartItems, cartTotal, clearCart } = useCart();

const savedLocation = getSavedLocation();

const [hubSettings, setHubSettings] = useState({
...DEFAULT_HUB,
active: false,
});

const [deliverySettingsLoading, setDeliverySettingsLoading] =
useState(true);

const savedUser = getUser();

const [formData, setFormData] = useState({
name: savedUser?.name || "",
phone: savedUser?.phone || "",
address: savedLocation?.fullAddress || "",
city: DEFAULT_HUB.city,
state: DEFAULT_HUB.state,
pincode: "",
});

const [location, setLocation] = useState(savedLocation);
const [locationLoading, setLocationLoading] = useState(false);
const [locationMessage, setLocationMessage] = useState("");

const [savedAddresses, setSavedAddresses] = useState([]);
const [selectedAddressId, setSelectedAddressId] = useState("");
const [deliveryAddressType, setDeliveryAddressType] = useState("saved");
const [addressLoading, setAddressLoading] = useState(true);

const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

const [orderPlaced, setOrderPlaced] = useState(false);
const [orderId, setOrderId] = useState("");

const [placingOrder, setPlacingOrder] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

const delivery = verifyDelivery(location, hubSettings);

// APPLY SELECTED SAVED ADDRESS
const applyAddress = (address) => {
setDeliveryAddressType("saved");

if (!address) return;

setSelectedAddressId(address._id);

setFormData((previous) => ({
  ...previous,
  name: address.fullName || previous.name,
  phone: address.phone || previous.phone,
  address: [
    address.houseNo,
    address.area,
    address.landmark,
  ]
    .filter(Boolean)
    .join(", "),
  city: address.city || previous.city,
  state: address.state || previous.state,
  pincode: address.pincode || previous.pincode,
}));

const addressLocation = getAddressLocation(address);

setLocation(addressLocation);

if (addressLocation) {
  localStorage.setItem(
    "organigoSelectedLocation",
    JSON.stringify(addressLocation)
  );

  setLocationMessage("Saved address selected successfully.");
} else {
  localStorage.removeItem("organigoSelectedLocation");

  setLocationMessage(
    "Address selected. Please confirm your GPS location."
  );
}

window.dispatchEvent(new Event("organigoLocationUpdated"));

};

// LOAD LIVE DELIVERY SETTINGS FROM MONGODB
useEffect(() => {
const loadDeliverySettings = async () => {
try {
const response = await fetch(DELIVERY_SETTINGS_API);
const data = await response.json();

    if (!response.ok || !data.success || !data.settings) {
      throw new Error(data.message || "Delivery settings load nahi hui.");
    }

    const settings = data.settings;
    const latitude = Number(settings.hubLatitude);
    const longitude = Number(settings.hubLongitude);
    const radius = Number(settings.deliveryRadiusKm);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(radius) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180 ||
      radius <= 0
    ) {
      throw new Error("MongoDB delivery settings invalid hain.");
    }

    const updatedSettings = {
      latitude,
      longitude,
      radius,
      active: Boolean(settings.isDeliveryActive),
      city: "Chaibasa",
      state: "Jharkhand",
    };

    setHubSettings(updatedSettings);

    localStorage.setItem(
      "organigoDeliverySettings",
      JSON.stringify(updatedSettings)
    );
  } catch (error) {
    console.error("Delivery Settings Error:", error);

    setHubSettings((previous) => ({
      ...previous,
      active: false,
    }));

    setLocationMessage(
      "Delivery settings load nahi hui. Please refresh and try again."
    );
  } finally {
    setDeliverySettingsLoading(false);
  }
};

loadDeliverySettings();

}, []);

// LOAD ADDRESSES FROM MONGODB
useEffect(() => {
const loadSavedAddresses = async () => {
try {
const token = getToken();

    if (!token) {
      setAddressLoading(false);
      return;
    }

    const response = await fetch(ADDRESS_API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Addresses load nahi hue.");
    }

    const addresses = data.addresses || [];
    setSavedAddresses(addresses);

    if (addresses.length === 0) {
      return;
    }

    let selectedAddress = null;

    if (data.selectedAddressId) {
      selectedAddress = addresses.find(
        (address) =>
          address._id === String(data.selectedAddressId)
      );
    }

    if (!selectedAddress) {
      selectedAddress =
        addresses.find((address) => address.isDefault) ||
        addresses[0];
    }

    if (selectedAddress) {
      applyAddress(selectedAddress);
    }
  } catch (error) {
    console.error("Address Loading Error:", error);

    setLocationMessage(
      "Saved addresses load nahi ho paye. Please try again."
    );
  } finally {
    setAddressLoading(false);
  }
};

loadSavedAddresses();

}, []);

// HANDLE INPUT
const handleChange = (e) => {
const { name, value } = e.target;

setFormData((previous) => ({
  ...previous,
  [name]: value,
}));

setErrorMessage("");

};

// SELECT ADDRESS FROM MONGODB
const handleSelectAddress = async (addressId) => {
const address = savedAddresses.find(
(item) => item._id === addressId
);

if (!address) return;

const token = getToken();

if (!token) {
  navigate("/login", {
    state: { from: "/checkout" },
  });
  return;
}

try {
  setErrorMessage("");

  const response = await fetch(
    `${ADDRESS_API}/${addressId}/select`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Address select nahi hua.");
  }

  applyAddress(address);

  window.dispatchEvent(
    new Event("organigoSelectedAddressUpdated")
  );
} catch (error) {
  console.error("Address Selection Error:", error);

  setErrorMessage(
    error.message || "Unable to select address."
  );
}

};

// GET CURRENT GPS LOCATION
const handleGetLocation = async () => {
if (!navigator.geolocation) {
setLocationMessage("Your browser does not support location.");
return;
}

setLocationLoading(true);
setLocationMessage("Getting your location...");

navigator.geolocation.getCurrentPosition(
  async (position) => {
    setDeliveryAddressType("gps");

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
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
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

    const result = verifyDelivery(selectedLocation, hubSettings);

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

// PLACE ORDER IN MONGODB
const handlePlaceOrder = async (e) => {
e.preventDefault();
setErrorMessage("");

if (placingOrder) return;

if (deliverySettingsLoading) {
  setErrorMessage("Please wait. Delivery settings are loading.");
  return;
}

if (cartItems.length === 0) {
  setErrorMessage("Your cart is empty.");
  return;
}

const token = getToken();

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

if (!formData.address.trim()) {
  setErrorMessage("Please enter your delivery address.");
  return;
}

const finalDelivery = verifyDelivery(location, hubSettings);

if (!finalDelivery.available) {
  setErrorMessage(finalDelivery.message);
  return;
}

if (paymentMethod !== "Cash on Delivery") {
  setErrorMessage(
    "Online UPI payment is coming soon. Please select COD."
  );
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

  deliveryAddressType: deliveryAddressType,

  selectedAddressId:
    deliveryAddressType === "saved"
      ? selectedAddressId || null
      : null,

  location: {
    name: location?.name || "",
    fullAddress: location?.fullAddress || "",
    latitude: Number(location?.latitude),
    longitude: Number(location?.longitude),
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
      clearSession();

      navigate("/login", {
        state: { from: "/checkout" },
      });

      return;
    }

    throw new Error(result.message || "Unable to place your order.");
  }

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

// SUCCESS SCREEN
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
        className="checkout-success-location"
        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
        target="_blank"
        rel="noreferrer"
      >
        <LocationIcon className="checkout-location-icon" />
        View Delivery Location
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

// CHECKOUT PAGE
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

      <div className="saved-address-section">
        <h3 className="checkout-location-heading">
          <LocationIcon className="checkout-location-icon" />
          Select Delivery Address
        </h3>

        {addressLoading ? (
          <p>Loading your saved addresses...</p>
        ) : savedAddresses.length > 0 ? (
          <>
            <select
              value={selectedAddressId}
              onChange={(e) =>
                handleSelectAddress(e.target.value)
              }
            >
              {savedAddresses.map((address) => (
                <option key={address._id} value={address._id}>
                  {address.label} - {address.houseNo},{" "}
                  {address.area}
                  {address.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>

            <p className="saved-address-details">
              {
                savedAddresses.find(
                  (item) => item._id === selectedAddressId
                )?.fullName
              }
              {" — "}
              {
                savedAddresses.find(
                  (item) => item._id === selectedAddressId
                )?.city
              }
            </p>
          </>
        ) : (
          <p>
            No saved addresses found. Please enter your address manually.
          </p>
        )}

        <button
          type="button"
          className="location-btn"
          onClick={() => navigate("/addresses")}
        >
          + Manage / Add New Address
        </button>
      </div>

      <label>Registered Full Name</label>

      <input
        type="text"
        name="name"
        placeholder="Your registered name"
        value={formData.name}
        readOnly
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
        <h3 className="checkout-location-heading">
          <LocationIcon className="checkout-location-icon" />
          Delivery Location
        </h3>

        <p>
          Your selected location will be used to verify delivery availability.
        </p>

        <button
          type="button"
          className="location-btn"
          onClick={handleGetLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            "Getting Location..."
          ) : (
            <>
              <LocationIcon className="checkout-location-icon" />
              Use My Current Location
            </>
          )}
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

      {deliverySettingsLoading && (
        <p className="location-message">
          Loading latest delivery availability...
        </p>
      )}

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
        disabled={
          !delivery.available ||
          placingOrder ||
          addressLoading ||
          deliverySettingsLoading
        }
      >
        {placingOrder ? "Placing Order..." : "Place Order →"}
      </button>
    </form>

    <div className="checkout-summary">
      <h2>Order Summary</h2>

      {cartItems.map((item) => (
        <div
          className="checkout-item"
          key={item.id || item._id}
        >
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