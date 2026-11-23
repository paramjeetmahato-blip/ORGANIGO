import React, { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "./BottomNavigation.css";

// Professional SVG Icons
const HomeIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M3 10.5L12 3L21 10.5V20H14.5V14H9.5V20H3V10.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? "0.12" : "0"}
    />
  </svg>
);

const CategoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="8" height="8" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="3" width="8" height="8" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <rect x="3" y="13" width="8" height="8" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="13" width="8" height="8" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const OrdersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M5 4H19V21H5V4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9 4V2H15V4"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" />
    <path d="M9 10H15M9 14H15M9 18H13"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" />
  </svg>
);

const AccountIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4"
      stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M4 21C4 16.8 7.5 14 12 14C16.5 14 20 16.8 20 21"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M3 13V11C3 6 7 3 12 3C17 3 21 6 21 11V13"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <rect x="3" y="11" width="4" height="7" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <rect x="17" y="11" width="4" height="7" rx="2"
      stroke="currentColor" strokeWidth="1.8" />
    <path d="M19 18C19 20 17 21 14 21"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" />
  </svg>
);

function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isCategoriesActive =
    location.pathname === "/" && location.hash === "#categories";

  const isHomeActive =
    location.pathname === "/" && !isCategoriesActive;

  useEffect(() => {
    if (isCategoriesActive) {
      const timer = setTimeout(() => {
        document.querySelector(".category-list")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isCategoriesActive]);

  const handleCategories = () => {
    navigate({
      pathname: "/",
      hash: "#categories",
    });
  };

  const handleSupport = () => {
    window.dispatchEvent(new Event("organigoOpenSupport"));
  };

  return (
    <nav className="organigo-bottom-nav">

      <NavLink
        to="/"
        end
        className={`bottom-nav-item ${isHomeActive ? "active" : ""}`}
      >
        <span className="bottom-nav-icon">
          <HomeIcon active={isHomeActive} />
        </span>
        <span>Home</span>
      </NavLink>

      <button
        className={`bottom-nav-item ${
          isCategoriesActive ? "active" : ""
        }`}
        onClick={handleCategories}
      >
        <span className="bottom-nav-icon">
          <CategoryIcon />
        </span>
        <span>Categories</span>
      </button>

      <NavLink to="/my-orders" className="bottom-nav-item">
        <span className="bottom-nav-icon">
          <OrdersIcon />
        </span>
        <span>Orders</span>
      </NavLink>

      <NavLink to="/account" className="bottom-nav-item">
        <span className="bottom-nav-icon">
          <AccountIcon />
        </span>
        <span>Account</span>
      </NavLink>

      <button className="bottom-nav-item" onClick={handleSupport}>
        <span className="bottom-nav-icon">
          <SupportIcon />
        </span>
        <span>Support</span>
      </button>

    </nav>
  );
}

export default BottomNavigation;