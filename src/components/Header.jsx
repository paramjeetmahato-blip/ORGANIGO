import React from "react";
import { useCart } from "../context/CartContext";
import "../styles/Header.css";

function Header() {
  const { cartCount } = useCart();

  const handleSearch = (e) => {
    window.dispatchEvent(
      new CustomEvent("organigoSearch", {
        detail: e.target.value,
      })
    );
  };

  return (
    <header className="Organigo-header">
      <div className="header-container">

        {/* Logo */}
        <a href="/" className="Organigo-logo">
          ORGANIGO
          <span className="veg-symbol">
            <span></span>
          </span>
        </a>

        {/* Delivery Location */}
        <div className="delivery-location">
          <span className="veg-mark">📍</span>

          <div>
            <small>Delivering to</small>
            <h4>Chaibasa, Jharkhand</h4>
          </div>
        </div>

        {/* Search */}
        <div className="header-search">
          <span>🔍</span>

          <input
            type="search"
            placeholder="Search fruits, vegetables and groceries..."
            onChange={handleSearch}
          />
        </div>

        {/* Login */}
        <a href="/login" className="header-login">
          Login
        </a>

        {/* Cart */}
        <a href="/cart" className="header-cart">
          🛒 My Cart

          <span className="cart-count">
            {cartCount}
          </span>
        </a>

      </div>
    </header>
  );
}

export default Header;