import React from "react";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="organigo-footer">

      {/* DESKTOP FOOTER */}
      <div className="footer-desktop">

        <div className="footer-main">

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

          <div className="footer-column">
            <h4>Company</h4>
            <a href="/">Home</a>
            <a href="#shop-products">Shop Products</a>
            <a href="#shop-products">About ORGANIGO</a>
            <a href="#shop-products">Contact Us</a>
          </div>

          <div className="footer-column">
            <h4>Categories</h4>
            <a href="#shop-products">Fresh Fruits</a>
            <a href="#shop-products">Vegetables</a>
            <a href="#shop-products">Fresh Juice</a>
            <a href="#shop-products">Dairy Products</a>
            <a href="#shop-products">Bakery</a>
          </div>

          <div className="footer-column">
            <h4>Customer Support</h4>
            <a href="#shop-products">Help Center</a>
            <a href="#shop-products">FAQs</a>
            <a href="#shop-products">Order Support</a>
            <a href="#shop-products">Delivery Information</a>
          </div>

          <div className="footer-column footer-contact">
            <h4>Get In Touch</h4>
            <p>📍 Chaibasa, Jharkhand, India</p>
            <p>🥬 Freshness Delivered Daily</p>
            <p>💚 Thank you for choosing ORGANIGO</p>
          </div>

        </div>

        <div className="footer-download">
          <div>
            <strong>Shop Fresh with ORGANIGO</strong>
            <p>Your daily freshness partner.</p>
          </div>
          <span>APP COMING SOON</span>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ORGANIGO. All Rights Reserved.</p>
          <div>
            <a href="#shop-products">Privacy Policy</a>
            <a href="#shop-products">Terms & Conditions</a>
          </div>
        </div>

      </div>

      {/* MOBILE FOOTER */}
      <div className="footer-mobile">

        

        <div className="mobile-footer-app">
          <div>
            <strong>🥬 ORGANIGO APP</strong>
            <p>Your daily freshness partner</p>
          </div>
          <span>Coming Soon</span>
        </div>

        <div className="mobile-footer-links">

          <details>
            <summary>Company</summary>
            <a href="/">Home</a>
            <a href="#shop-products">Shop Products</a>
            <a href="#shop-products">About ORGANIGO</a>
            <a href="#shop-products">Contact Us</a>
          </details>

          <details>
            <summary>Shop by Category</summary>
            <a href="#shop-products">Fresh Fruits</a>
            <a href="#shop-products">Vegetables</a>
            <a href="#shop-products">Fresh Juice</a>
            <a href="#shop-products">Dairy Products</a>
            <a href="#shop-products">Bakery</a>
          </details>

          <details>
            <summary>Customer Support</summary>
            <a href="#shop-products">Help Center</a>
            <a href="#shop-products">FAQs</a>
            <a href="#shop-products">Order Support</a>
            <a href="#shop-products">Delivery Information</a>
          </details>

        </div>

        <div className="mobile-footer-location">
          <strong>📍 Delivering in</strong>
          <p>Chaibasa, Jharkhand, India</p>
        </div>

        <div className="mobile-footer-bottom">
          <p>© {new Date().getFullYear()} ORGANIGO</p>
          <div>
            <a href="#shop-products">Privacy</a>
            <a href="#shop-products">Terms</a>
          </div>
          <small>Freshness from Farm to Family 🌿</small>
        </div>

      </div>

    </footer>
  );
}

export default Footer;