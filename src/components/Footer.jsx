import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {

  // CATEGORY FILTER
  const selectCategory = (event, category) => {
    event.preventDefault();

    window.dispatchEvent(
      new CustomEvent("organigoCategorySelect", {
        detail: category,
      })
    );
  };

  // CATEGORY LINK
  const CategoryLink = ({ name, category }) => (
    <a
      href="/#shop-products"
      onClick={(event) => selectCategory(event, category)}
    >
      {name}
    </a>
  );

  return (
    <footer className="organigo-footer">

      {/* DESKTOP FOOTER */}
      <div className="footer-desktop">

        <div className="footer-main">

          {/* BRAND */}
          <div className="footer-brand">
            <img src="/organigo-logo.png" alt="ORGANIGO" />

            <h3>Eat Healthy. Live Fresh.</h3>

            <p>
              Fresh fruits, vegetables and daily essentials
              delivered fresh to your doorstep.
            </p>

            <div className="footer-app">
              <span>🥬</span>

              <div>
                <strong>ORGANIGO APP</strong>
                <small>Coming Soon!</small>
              </div>
            </div>
          </div>

          {/* COMPANY */}
          <div className="footer-column">
            <h4>Company</h4>

            <Link to="/">Home</Link>
            <Link to="/#shop-products">Shop Products</Link>
            <Link to="/about">About ORGANIGO</Link>
            <Link to="/about/contact">Contact Us</Link>
          </div>

          {/* CATEGORIES */}
          <div className="footer-column">
            <h4>Categories</h4>

            <CategoryLink name="Fresh Fruits" category="Fruits" />
            <CategoryLink name="Vegetables" category="Vegetables" />
            <CategoryLink name="Fresh Juice" category="Juice" />
            <CategoryLink name="Dairy Products" category="Dairy" />
            <CategoryLink name="Bakery" category="Bakery" />
          </div>

          {/* CUSTOMER SUPPORT */}
          <div className="footer-column">
            <h4>Customer Support</h4>

            <Link to="/about/help">Help Center</Link>
            <Link to="/about/faqs">FAQs</Link>
            <Link to="/about/order-support">Order Support</Link>
            <Link to="/about/delivery">Delivery Information</Link>
          </div>

          {/* LEGAL */}
          <div className="footer-column">
            <h4>Legal</h4>

            <Link to="/about/terms">Terms of Service</Link>
            <Link to="/about/privacy">Privacy Policy</Link>
            <Link to="/about/refund">Refund & Cancellation</Link>
            <Link to="/about/open-source">Open Source Libraries</Link>
            <Link to="/about/licenses">Licenses and Registrations</Link>
          </div>

          {/* CONTACT */}
          <div className="footer-column footer-contact">
            <h4>Get In Touch</h4>

            <p>📍 Chaibasa, Jharkhand, India</p>
            <p>🥬 Freshness Delivered Daily</p>
            <p>💚 Thank you for choosing ORGANIGO</p>
          </div>

        </div>

        {/* DOWNLOAD APP */}
        <div className="footer-download">
          <div>
            <strong>Shop Fresh with ORGANIGO</strong>
            <p>Your daily freshness partner.</p>
          </div>

          <span>APP COMING SOON</span>
        </div>

        {/* COPYRIGHT */}
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} ORGANIGO. All Rights Reserved.
          </p>
        </div>

      </div>

      {/* MOBILE FOOTER */}
      <div className="footer-mobile">

        {/* APP BANNER */}
        <div className="mobile-footer-app">
          <div>
            <strong>🥬 ORGANIGO APP</strong>
            <p>Your daily freshness partner</p>
          </div>

          <span>Coming Soon</span>
        </div>

        <div className="mobile-footer-links">

          {/* COMPANY */}
          <details>
            <summary>Company</summary>

            <Link to="/">Home</Link>
            <Link to="/#shop-products">Shop Products</Link>
            <Link to="/about">About ORGANIGO</Link>
            <Link to="/about/contact">Contact Us</Link>
          </details>

          {/* CATEGORIES */}
          <details>
            <summary>Shop by Category</summary>

            <CategoryLink name="Fresh Fruits" category="Fruits" />
            <CategoryLink name="Vegetables" category="Vegetables" />
            <CategoryLink name="Fresh Juice" category="Juice" />
            <CategoryLink name="Dairy Products" category="Dairy" />
            <CategoryLink name="Bakery" category="Bakery" />
          </details>

          {/* CUSTOMER SUPPORT */}
          <details>
            <summary>Customer Support</summary>

            <Link to="/about/help">Help Center</Link>
            <Link to="/about/faqs">FAQs</Link>
            <Link to="/about/order-support">Order Support</Link>
            <Link to="/about/delivery">Delivery Information</Link>
          </details>

          {/* LEGAL */}
          <details>
            <summary>Legal</summary>

            <Link to="/about/terms">Terms of Service</Link>
            <Link to="/about/privacy">Privacy Policy</Link>
            <Link to="/about/refund">Refund & Cancellation</Link>
            <Link to="/about/open-source">Open Source Libraries</Link>
            <Link to="/about/licenses">Licenses and Registrations</Link>
          </details>

        </div>

        {/* LOCATION */}
        <div className="mobile-footer-location">
          <strong>📍 Delivering in</strong>
          <p>Chaibasa, Jharkhand, India</p>
        </div>

        {/* MOBILE COPYRIGHT */}
        <div className="mobile-footer-bottom">
          <p>© {new Date().getFullYear()} ORGANIGO</p>

          <small>Freshness from Farm to Family 🌿</small>
        </div>

      </div>

    </footer>
  );
}

export default Footer;