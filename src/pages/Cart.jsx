import { useMemo, useState } from "react";
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

function getDeliverySettings() {
  try {
    const saved = localStorage.getItem("organigoDeliverySettings");
    if (!saved) return DEFAULT_HUB;
    return { ...DEFAULT_HUB, ...JSON.parse(saved) };
  } catch {
    return DEFAULT_HUB;
  }
}

function getCustomerLocation() {
  try {
    const saved = localStorage.getItem("organigoSelectedLocation");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

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
    message: `Your location is ${distance.toFixed(2)} km away. Our delivery radius is ${radius} km.`,
  };
}

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function Cart() {
  const navigate = useNavigate();
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [donationSelected, setDonationSelected] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [showCustomTip, setShowCustomTip] = useState(false);

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
  } = useCart();

  const delivery = useMemo(() => checkDeliveryAvailability(), [cartItems.length]);
  const itemCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
  const subtotal = Number(cartTotal || 0);
  const validCustomTip = Math.max(0, Number(customTip) || 0);
  const tipAmount = showCustomTip ? validCustomTip : selectedTip;
  const donationAmount = donationSelected ? 1 : 0;

  // Delivery/handling fees are intentionally not guessed here.
  // They must be calculated by the existing checkout/backend rules.
  const estimatedTotal = subtotal + tipAmount + donationAmount;

  const handleShare = async () => {
    const shareData = {
      title: "ORGANIGO Cart",
      text: `My ORGANIGO cart has ${itemCount} item(s), worth ${formatPrice(subtotal)}.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.text);
        window.alert("Cart details copied.");
      } else {
        window.alert(shareData.text);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Cart share failed:", error);
      }
    }
  };

  const handleTipSelect = (amount) => {
    setShowCustomTip(false);
    setCustomTip("");
    setSelectedTip((current) => (current === amount ? 0 : amount));
  };

  const handleCheckout = () => {
    const latestDelivery = checkDeliveryAvailability();

    if (!latestDelivery.available) {
      setCheckoutMessage(latestDelivery.message);
      return;
    }

    setCheckoutMessage("");

    // Keep optional extras available for the next checkout integration step.
    const cartExtras = {
      donation: donationSelected ? 1 : 0,
      deliveryTip: tipAmount,
    };

    sessionStorage.setItem("organigoCartExtras", JSON.stringify(cartExtras));

    const token = getToken();
    if (token) {
      navigate("/checkout", { state: { cartExtras } });
    } else {
      navigate("/login", {
        state: { from: "/checkout", cartExtras },
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-shell cart-empty-shell">
          <header className="cart-topbar">
            <button
              type="button"
              className="cart-back-button"
              onClick={() => navigate("/")}
              aria-label="Go back to shopping"
            >
              <span aria-hidden="true">←</span>
            </button>
            <h1>My Cart</h1>
          </header>

          <section className="cart-empty-state">
            <div className="cart-empty-icon" aria-hidden="true">🛒</div>
            <h1>Your cart is empty</h1>
            <p>Fresh fruits, vegetables and daily essentials are waiting for you.</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="cart-primary-button"
            >
              Continue shopping
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-shell">
        <header className="cart-topbar">
          <button
            type="button"
            className="cart-back-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <span aria-hidden="true">←</span>
          </button>
          <h1>My Cart</h1>
          <button type="button" className="cart-share-button" onClick={handleShare}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 16V3m0 0L7 8m5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
            <span>Share</span>
          </button>
        </header>

        <div className="cart-layout">
          <section className="cart-main-column">
            <div className="cart-delivery-card">
              <div className="cart-delivery-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48">
                  <circle cx="24" cy="25" r="16" />
                  <path d="M24 25V13m0 12 8-5M18 4h12" />
                </svg>
              </div>
              <div className="cart-delivery-copy">
                <strong>Delivery estimate at checkout</strong>
                <span>Shipment of {itemCount} {itemCount === 1 ? "item" : "items"}</span>
              </div>
              <span className="cart-delivery-tag">ORGANIGO</span>
            </div>

            <section className="cart-products-card" aria-label="Cart products">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-product-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span>{item.icon || "🛒"}</span>
                    )}
                  </div>

                  <div className="cart-product-details">
                    <h2>{item.name}</h2>
                    <p className="cart-product-weight">{item.weight || "Available"}</p>
                    <strong className="cart-product-price">{formatPrice(item.price)}</strong>
                    <span className="cart-item-line-total">
                      Item total: {formatPrice(Number(item.price) * Number(item.quantity))}
                    </span>
                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="cart-quantity-control" aria-label={`Quantity for ${item.name}`}>
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.id)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => increaseQuantity(item.id)}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section className="cart-bill-card">
              <h2>Bill details</h2>
              <div className="cart-bill-row">
                <span><span className="cart-bill-symbol">▤</span> Items total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="cart-bill-row">
                <span><span className="cart-bill-symbol">♧</span> Delivery charge</span>
                <span className="cart-calculated-label">Calculated at checkout</span>
              </div>
              <div className="cart-bill-row">
                <span><span className="cart-bill-symbol">▣</span> Handling charge</span>
                <span className="cart-calculated-label">If applicable</span>
              </div>
              {donationAmount > 0 && (
                <div className="cart-bill-row cart-extra-row">
                  <span>Feeding India donation</span>
                  <strong>{formatPrice(donationAmount)}</strong>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="cart-bill-row cart-extra-row">
                  <span>Delivery partner tip</span>
                  <strong>{formatPrice(tipAmount)}</strong>
                </div>
              )}
              <div className="cart-bill-divider" />
              <div className="cart-grand-total">
                <strong>Grand total*</strong>
                <strong>{formatPrice(estimatedTotal)}</strong>
              </div>
              <p className="cart-bill-note">
                *Delivery and handling charges, if any, are confirmed at checkout.
              </p>
            </section>

            <section className="cart-donation-card">
              <div className="cart-donation-icon" aria-hidden="true">❤️</div>
              <div className="cart-donation-copy">
                <strong>Feeding India donation</strong>
                <p>Support a meaningful cause with a small contribution.</p>
              </div>
              <strong className="cart-donation-amount">₹1</strong>
              <input
                type="checkbox"
                checked={donationSelected}
                onChange={(event) => setDonationSelected(event.target.checked)}
                aria-label="Add one rupee donation"
              />
            </section>

            <section className="cart-tip-card">
              <h2>Tip your delivery partner</h2>
              <p>Your kindness means a lot! Your tip is intended for your delivery partner.</p>
              <div className="cart-tip-options">
                {[20, 30, 50].map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    className={selectedTip === amount && !showCustomTip ? "selected" : ""}
                    onClick={() => handleTipSelect(amount)}
                    aria-pressed={selectedTip === amount && !showCustomTip}
                  >
                    <span aria-hidden="true">{amount === 20 ? "✌️" : amount === 30 ? "💌" : "❤️"}</span>
                    ₹{amount}
                  </button>
                ))}
                <button
                  type="button"
                  className={showCustomTip ? "selected" : ""}
                  onClick={() => {
                    setShowCustomTip(true);
                    setSelectedTip(0);
                  }}
                  aria-pressed={showCustomTip}
                >
                  <span aria-hidden="true">👏</span> Custom
                </button>
              </div>
              {showCustomTip && (
                <label className="cart-custom-tip">
                  Enter tip amount (₹)
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customTip}
                    onChange={(event) => setCustomTip(event.target.value)}
                    placeholder="Enter amount"
                  />
                </label>
              )}
            </section>

            <section className="cart-policy-card">
              <h2>Cancellation Policy</h2>
              <p>
                Orders may not be cancellable once they are packed for delivery.
                If an unexpected delay occurs, a refund will be provided where applicable
                under ORGANIGO&apos;s policy.
              </p>
            </section>
          </section>

          <aside className="cart-side-column">
            <section className="cart-side-summary">
              <h2>Order summary</h2>
              <div className="cart-bill-row">
                <span>Items ({itemCount})</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="cart-bill-row">
                <span>Delivery</span>
                <span className="cart-calculated-label">At checkout</span>
              </div>
              <div className="cart-bill-divider" />
              <div className="cart-grand-total">
                <strong>Subtotal</strong>
                <strong>{formatPrice(estimatedTotal)}</strong>
              </div>
              <p className="cart-side-note">Final delivery charges are shown before order confirmation.</p>
              <button type="button" className="cart-clear-button" onClick={clearCart}>
                Clear cart
              </button>
            </section>

            <div className={`cart-delivery-status ${delivery.available ? "is-available" : "is-unavailable"}`}>
              <strong>{delivery.available ? "✓ Delivery available" : "Delivery location needed"}</strong>
              <p>{delivery.message}</p>
              {delivery.distance && <span>{delivery.distance} km from delivery hub</span>}
            </div>
            {checkoutMessage && <p className="cart-checkout-error" role="alert">{checkoutMessage}</p>}
          </aside>
        </div>
      </div>

      <div className="cart-sticky-checkout">
        <div className="cart-sticky-total">
          <strong>{formatPrice(estimatedTotal)}</strong>
          <span> TOTAL</span>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={!delivery.available}
          title={!delivery.available ? delivery.message : "Proceed to checkout"}
        >
          Proceed <span aria-hidden="true">›</span>
        </button>
      </div>
    </main>
  );
}

export default Cart;
