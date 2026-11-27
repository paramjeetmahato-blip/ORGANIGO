import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import API_BASE_URL from "../services/api";
import { useCart } from "../context/CartContext";

import "../styles/ProductDetails.css";

const API_URL = `${API_BASE_URL}/api`;

// =====================================
// NORMALIZE PRODUCT DATA
// =====================================

const normalizeProduct = (item) => {
  if (!item) return null;

  return {
    ...item,

    id: String(
      item._id || item.id || item.name
    ),

    quantity:
      item.unit ||
      item.quantity ||
      "1 Unit",

    oldPrice: Number(
      item.originalPrice ||
      item.oldPrice ||
      0
    ),

    price: Number(item.price || 0),

    stock: Number(item.stock || 0),
  };
};

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const initialProduct = normalizeProduct(
    location.state?.product
  );

  const [product, setProduct] = useState(
    initialProduct &&
    initialProduct.id === String(productId)
      ? initialProduct
      : null
  );

  const [loading, setLoading] = useState(
    !initialProduct ||
    initialProduct.id !== String(productId)
  );

  const [error, setError] = useState("");

  // =====================================
  // LOAD PRODUCT WHEN DIRECTLY OPENED
  // =====================================

  useEffect(() => {
    const stateProduct = normalizeProduct(
      location.state?.product
    );

    if (
      stateProduct &&
      stateProduct.id === String(productId)
    ) {
      setProduct(stateProduct);
      setLoading(false);
      setError("");
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);

        const response = await fetch(
          `${API_URL}/products`
        );

        if (!response.ok) {
          throw new Error("Unable to load product.");
        }

        const data = await response.json();

        const products = Array.isArray(data)
          ? data
          : data.products ||
            data.data?.products ||
            data.data ||
            [];

        const foundProduct = products.find(
          (item) =>
            String(
              item._id ||
              item.id ||
              item.name
            ) === String(productId)
        );

        if (!foundProduct) {
          throw new Error("Product not found.");
        }

        setProduct(
          normalizeProduct(foundProduct)
        );

      } catch (err) {
        console.error(
          "Product Details Error:",
          err
        );

        setError(err.message);

      } finally {
        setLoading(false);
      }
    };

    loadProduct();

  }, [productId, location.state]);

  // =====================================
  // CART QUANTITY
  // =====================================

  const cartProduct = cartItems.find(
    (item) =>
      String(item.id) === String(productId)
  );

  const cartQuantity = cartProduct
    ? Number(cartProduct.quantity || 0)
    : 0;

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <main className="organigo-product-page">
        <div className="product-page-message">
          <span>🥬</span>
          <h2>Loading Product...</h2>
        </div>
      </main>
    );
  }

  // =====================================
  // ERROR
  // =====================================

  if (error || !product) {
    return (
      <main className="organigo-product-page">
        <div className="product-page-message">
          <span>⚠️</span>

          <h2>Product Not Found</h2>

          <p>
            {error ||
              "This product is unavailable."}
          </p>

          <button onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  // =====================================
  // PRODUCT CONDITIONS
  // =====================================

  const hasDiscount =
    product.oldPrice > product.price;

  const discount = hasDiscount
    ? Math.round(
        ((product.oldPrice - product.price) /
          product.oldPrice) *
          100
      )
    : 0;

  const outOfStock = product.stock <= 0;

  const maximumQuantityReached =
    cartQuantity >= product.stock;

  // =====================================
  // ADD TO CART
  // =====================================

  const handleAddToCart = () => {
    if (outOfStock) return;

    addToCart(product);
  };

  // =====================================
  // INCREASE QUANTITY
  // =====================================

  const handleIncrease = () => {
    if (maximumQuantityReached) return;

    increaseQuantity(product.id);
  };

  // =====================================
  // DECREASE QUANTITY
  // =====================================

  const handleDecrease = () => {
    decreaseQuantity(product.id);
  };

  return (
    <main className="organigo-product-page">

      <div className="product-page-container">

        {/* BACK BUTTON */}

        <button
          className="product-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="product-main-layout">

          {/* PRODUCT IMAGE */}

          <div className="product-detail-image">

            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
              />
            ) : (
              <span>
                {product.icon || "🥬"}
              </span>
            )}

            {hasDiscount && (
              <div className="product-discount-badge">
                {discount}% OFF
              </div>
            )}

          </div>

          {/* PRODUCT INFORMATION */}

          <div className="product-detail-info">

            <span className="product-detail-category">
              {product.category || "Fresh Products"}
            </span>

            <h1>{product.name}</h1>

            <p className="product-detail-unit">
              {product.quantity}
            </p>

            <div className="product-detail-rating">
              🌿 Fresh Quality Product
            </div>

            {/* PRICE */}

            <div className="product-detail-price">

              <strong>
                ₹{product.price}
              </strong>

              {hasDiscount && (
                <>
                  <del>
                    ₹{product.oldPrice}
                  </del>

                  <span>
                    Save {discount}%
                  </span>
                </>
              )}

            </div>

            {/* STOCK */}

            <p className="product-detail-stock">
              {outOfStock
                ? "Currently Out of Stock"
                : "✓ In Stock"}
            </p>

            {/* CART ACTIONS */}

            <div className="product-detail-actions">

              {outOfStock ? (

                <button
                  disabled
                  className="product-out-button"
                >
                  Out of Stock
                </button>

              ) : cartQuantity === 0 ? (

                <button
                  className="product-add-cart"
                  onClick={handleAddToCart}
                >
                  ADD TO CART +
                </button>

              ) : (

                <div className="product-detail-quantity">

                  <button
                    onClick={handleDecrease}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <strong>
                    {cartQuantity}
                  </strong>

                  <button
                    onClick={handleIncrease}
                    disabled={maximumQuantityReached}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>

                </div>

              )}

              <button
                className="product-go-cart"
                onClick={() => navigate("/cart")}
              >
                View Cart
              </button>

            </div>

            {maximumQuantityReached &&
              !outOfStock && (
                <p className="product-detail-stock">
                  Maximum available stock reached.
                </p>
              )}

            {/* FEATURES */}

            <div className="product-detail-features">

              <div>
                <span>🌱</span>
                <p>Fresh Products</p>
              </div>

              <div>
                <span>🚚</span>
                <p>Doorstep Delivery</p>
              </div>

              <div>
                <span>💚</span>
                <p>Trusted Quality</p>
              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="product-description">

              <h3>Product Description</h3>

              <p>
                {product.description ||
                  `${product.name} is available at ORGANIGO. Enjoy quality products delivered to your doorstep.`}
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

export default ProductDetails;