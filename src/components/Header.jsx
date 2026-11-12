import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import "../styles/Header.css";

function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { cartItems } = useCart();

  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    window.dispatchEvent(
      new CustomEvent("organigoSearch", {
        detail: value,
      })
    );
  };

  return (
    <header className="Organigo-header">

      {/* MOBILE APP DOWNLOAD BANNER */}
      <div className="organigo-app-banner">
        <div className="app-banner-icon">🥬</div>

        <div className="app-banner-text">
          <strong>ORGANIGO APP</strong>
          <small>Get a fresher shopping experience!</small>
        </div>

        <button
          className="app-download-button"
          type="button"
          disabled
        >
          Coming Soon
        </button>
      </div>

      <div className="header-container">

        {/* LOGO */}
        <a href="/" className="Organigo-logo">
          <img
            src="/organigo-logo.png"
            alt="ORGANIGO"
          />
        </a>

        {/* DELIVERY LOCATION */}
        <div className="delivery-location">
          <span className="location-icon">📍</span>

          <div>
            <small>Delivering to</small>
            <strong>Chaibasa, Jharkhand</strong>
          </div>
        </div>

        {/* SEARCH */}
        <div className="header-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search fruits, vegetables, juice..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* HYGIENE */}
        <div className="hygiene-badge">
          <span className="hygiene-icon">🛡️</span>

          <div>
            <strong>100% SANITIZED</strong>
            <small>SAFE & HYGIENIC HUB</small>
          </div>
        </div>

        {/* CART */}
        <a href="/cart" className="header-cart">
          <span className="cart-icon">🛒</span>
          <span>My Cart</span>

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </a>

      </div>
    </header>
  );
}

export default Header;