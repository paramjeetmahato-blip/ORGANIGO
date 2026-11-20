import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./BottomNavigation.css";

function BottomNavigation() {
  const navigate = useNavigate();

  const handleCategories = () => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.querySelector(".category-list")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    } else {
      document.querySelector(".category-list")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleSupport = () => {
    window.dispatchEvent(new Event("organigoOpenSupport"));
  };

  return (
    <nav className="organigo-bottom-nav">

      <NavLink to="/" className="bottom-nav-item">
        <span className="bottom-nav-icon">⌂</span>
        <span>Home</span>
      </NavLink>

      <button
        className="bottom-nav-item"
        onClick={handleCategories}
      >
        <span className="bottom-nav-icon">▦</span>
        <span>Categories</span>
      </button>

      <NavLink to="/my-orders" className="bottom-nav-item">
        <span className="bottom-nav-icon">📋</span>
        <span>Orders</span>
      </NavLink>

      <NavLink to="/account" className="bottom-nav-item">
        <span className="bottom-nav-icon">♙</span>
        <span>Account</span>
      </NavLink>

      <button
        className="bottom-nav-item"
        onClick={handleSupport}
      >
        <span className="bottom-nav-icon">☏</span>
        <span>Support</span>
      </button>

    </nav>
  );
}

export default BottomNavigation;