import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import API_BASE_URL from "../services/api";
import { useCart } from "../context/CartContext";

import "../styles/ProductDetails.css";

const API_URL = `${API_BASE_URL}/api/products`;

// =====================================
// NORMALIZE PRODUCT DATA
// =====================================

const normalizeProduct = (item) => {
  if (!item) return null;

  return {
    ...item,

    id: String(item._id || item.id || item.name),

    name: item.name || "Fresh Product",

    category: item.category || "Fresh Products",

    image: item.image || "",

    quantity: item.unit || item.quantity || "1 Unit",

    price: Number(item.price ?? 0),

    oldPrice: Number(
      item.originalPrice ?? item.oldPrice ?? 0
    ),

    stock: Number(item.stock ?? 0),

    description: item.description || "",
  };
};

// =====================================
// FORMAT PRICE
// =====================================

const formatPrice = (price) => {
  return Number(price || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

// =====================================
// EXTRACT PRODUCTS FROM API RESPONSE
// =====================================

const extractProducts = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.data?.products)) {
    return data.data.products;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

// =====================================
// PRODUCT DETAILS COMPONENT
// =====================================

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

  const [product, setProduct] = useState(null);

  const [allProducts, setAllProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [imageError, setImageError] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  // =====================================
  // LOAD PRODUCT AND SIMILAR PRODUCTS
  // =====================================

  useEffect(() => {
    const controller = new AbortController();

    const routeProduct = normalizeProduct(
      location.state?.product
    );

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        setImageError(false);

        // Use product passed from Home if available
        if (routeProduct?.id === String(productId)) {
          setProduct(routeProduct);
        } else {
          setProduct(null);
        }

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to connect to product server.");
        }

        const data = await response.json();

        const products = extractProducts(data);

        const normalizedProducts = products
          .filter((item) => item && item.isActive !== false)
          .map(normalizeProduct);

        setAllProducts(normalizedProducts);

        const foundProduct = normalizedProducts.find(
          (item) => item.id === String(productId)
        );

        if (foundProduct) {
          setProduct(foundProduct);
        } else if (routeProduct?.id === String(productId)) {
          setProduct(routeProduct);
        } else {
          throw new Error("Product not found.");
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Product Details Error:", err);

        if (routeProduct?.id === String(productId)) {
          setProduct(routeProduct);
        } else {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [productId, retryCount, location.state]);

  // =====================================
  // GET CART QUANTITY
  // =====================================

  const getCartQuantity = (productItem) => {
    const cartProduct = cartItems.find(
      (item) => String(item.id) === String(productItem.id)
    );

    return Number(cartProduct?.quantity || 0);
  };

  // =====================================
  // SIMILAR PRODUCTS
  // =====================================

  const similarProducts = useMemo(() => {
    if (!product) return [];

    const currentId = String(product.id);

    const currentCategory = String(
      product.category || ""
    )
      .trim()
      .toLowerCase();

    const availableProducts = allProducts.filter((item) => {
      return (
        item.id !== currentId &&
        item.stock > 0
      );
    });

    // Same category products first
    const sameCategory = availableProducts.filter(
      (item) =>
        String(item.category || "")
          .trim()
          .toLowerCase() === currentCategory
    );

    // Other available products as fallback
    const otherProducts = availableProducts.filter(
      (item) =>
        String(item.category || "")
          .trim()
          .toLowerCase() !== currentCategory
    );

    return [...sameCategory, ...otherProducts].slice(0, 8);
  }, [product, allProducts]);

  // =====================================
  // PRODUCT CART QUANTITY
  // =====================================

  const cartQuantity = product
    ? getCartQuantity(product)
    : 0;

  // =====================================
  // PRODUCT CONDITIONS
  // =====================================

  const hasDiscount = product
    ? product.oldPrice > product.price &&
      product.oldPrice > 0
    : false;

  const discount = hasDiscount
    ? Math.round(
        ((product.oldPrice - product.price) /
          product.oldPrice) *
          100
      )
    : 0;

  const outOfStock = product
    ? product.stock <= 0
    : true;

  const maximumQuantityReached = product
    ? cartQuantity >= product.stock
    : false;

  // =====================================
  // MAIN PRODUCT CART ACTIONS
  // =====================================

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;

    if (getCartQuantity(product) >= product.stock) return;

    addToCart(product);
  };

  const handleIncrease = () => {
    if (!product) return;

    if (getCartQuantity(product) >= product.stock) return;

    increaseQuantity(product.id);
  };

  const handleDecrease = () => {
    if (!product) return;

    decreaseQuantity(product.id);
  };

  // =====================================
  // SIMILAR PRODUCT CART ACTIONS
  // =====================================

  const handleSimilarAdd = (item) => {
    if (item.stock <= 0) return;

    if (getCartQuantity(item) >= item.stock) return;

    addToCart(item);
  };

  const handleSimilarIncrease = (item) => {
    if (getCartQuantity(item) >= item.stock) return;

    increaseQuantity(item.id);
  };

  const handleSimilarDecrease = (item) => {
    decreaseQuantity(item.id);
  };

  // =====================================
  // OPEN SIMILAR PRODUCT
  // =====================================

  const openSimilarProduct = (item) => {
    navigate(`/product/${item.id}`, {
      state: { product: item },
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading && !product) {
    return (
      <main className="organigo-product-page">
        <div className="product-page-message">
          <span>🥬</span>

          <h2>Loading Fresh Products...</h2>

          <p>
            Please wait while we get the latest details.
          </p>
        </div>
      </main>
    );
  }

  // =====================================
  // PRODUCT NOT FOUND
  // =====================================

  if (!product) {
    return (
      <main className="organigo-product-page">
        <div className="product-page-message">
          <span>🥬</span>

          <h2>Product Not Found</h2>

          <p>
            {error || "This product is currently unavailable."}
          </p>

          <button
            onClick={() =>
              setRetryCount((prev) => prev + 1)
            }
          >
            Try Again
          </button>

          <button
            className="product-message-home"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  // =====================================
  // RENDER
  // =====================================

  return (
    <main className="organigo-product-page">

      <div className="product-page-container">

        {/* BREADCRUMB */}

        <div className="product-breadcrumb">

          <button onClick={() => navigate("/")}>
            Home
          </button>

          <span>/</span>

          <span>{product.category}</span>

          <span>/</span>

          <strong>{product.name}</strong>

        </div>

        {/* BACK BUTTON */}

        <button
          className="product-back-button"
          onClick={() => navigate(-1)}
        >
          <span>←</span> Back
        </button>

        {/* =====================================
            MAIN PRODUCT DETAILS
        ===================================== */}

        <div className="product-main-layout">

          {/* PRODUCT IMAGE */}

          <div className="product-detail-image">

            {product.image && !imageError ? (
              <img
                src={product.image}
                alt={product.name}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="product-image-placeholder">
                <span>{product.icon || "🥬"}</span>

                <p>Fresh from ORGANIGO</p>
              </div>
            )}

            {hasDiscount && (
              <div className="product-discount-badge">
                {discount}% OFF
              </div>
            )}

            <div className="product-image-brand">
              <span>ORGANIGO</span>

              <small>Freshness Delivered</small>
            </div>

          </div>

          {/* PRODUCT INFORMATION */}

          <div className="product-detail-info">

            <div className="product-category-row">

              <span className="product-detail-category">
                {product.category}
              </span>

              {product.isSpecial && (
                <span className="product-special-badge">
                  SPECIAL
                </span>
              )}

            </div>

            <h1>{product.name}</h1>

            <p className="product-detail-unit">
              {product.quantity}
            </p>

            {/* QUALITY */}

            <div className="product-detail-rating">
              <span>✓</span>

              Fresh Quality Product
            </div>

            {/* PRICE */}

            <div className="product-detail-price">

              <strong>
                ₹{formatPrice(product.price)}
              </strong>

              {hasDiscount && (
                <>
                  <del>
                    ₹{formatPrice(product.oldPrice)}
                  </del>

                  <span>
                    Save {discount}%
                  </span>
                </>
              )}

            </div>

            <p className="product-tax-note">
              Inclusive of all applicable taxes
            </p>

            {/* STOCK */}

            <div
              className={`product-stock-status ${
                outOfStock
                  ? "stock-unavailable"
                  : "stock-available"
              }`}
            >
              <span>
                {outOfStock ? "●" : "✓"}
              </span>

              {outOfStock
                ? "Currently Out of Stock"
                : product.stock <= 5
                ? `Only ${product.stock} left in stock`
                : "In Stock - Ready to Deliver"}
            </div>

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
                  ADD TO CART <span>+</span>
                </button>

              ) : (

                <div className="product-detail-quantity">

                  <button
                    onClick={handleDecrease}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <strong>{cartQuantity}</strong>

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
                View Cart →
              </button>

            </div>

            {maximumQuantityReached && !outOfStock && (
              <p className="product-max-stock-message">
                You have added all available stock to your cart.
              </p>
            )}

            {/* DELIVERY INFORMATION */}

            <div className="product-delivery-card">

              <div className="product-delivery-icon">
                🚚
              </div>

              <div>
                <strong>
                  Delivery to your doorstep
                </strong>

                <p>
                  Check your delivery availability at checkout.
                </p>
              </div>

            </div>

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

            {/* TRUST NOTE */}

            <div className="product-trust-note">

              <span>💚</span>

              <p>
                ORGANIGO - Freshness, Trust & Convenience.
              </p>

            </div>

          </div>

        </div>

        {/* =====================================
            SIMILAR PRODUCTS SECTION
        ===================================== */}

        {similarProducts.length > 0 && (

          <section className="similar-products-section">

            <div className="similar-products-heading">

              <div>
                <span className="similar-section-label">
                  MORE FRESHNESS FOR YOU
                </span>

                <h2>You May Also Like</h2>

                <p>
                  Explore more fresh products from ORGANIGO.
                </p>
              </div>

              <span className="similar-product-count">
                {similarProducts.length} Products
              </span>

            </div>

            <div className="similar-products-grid">

              {similarProducts.map((item) => {

                const quantity = getCartQuantity(item);

                const itemHasDiscount =
                  item.oldPrice > item.price &&
                  item.oldPrice > 0;

                const itemDiscount = itemHasDiscount
                  ? Math.round(
                      ((item.oldPrice - item.price) /
                        item.oldPrice) *
                        100
                    )
                  : 0;

                const itemMaxReached =
                  quantity >= item.stock;

                return (

                  <article
                    className="similar-product-card"
                    key={item.id}
                  >

                    {/* PRODUCT IMAGE */}

                    <div
                      className="similar-product-image"
                      onClick={() =>
                        openSimilarProduct(item)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          openSimilarProduct(item);
                        }
                      }}
                    >

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                        />
                      ) : (
                        <span>
                          {item.icon || "🥬"}
                        </span>
                      )}

                      {itemHasDiscount && (
                        <span className="similar-discount-badge">
                          {itemDiscount}% OFF
                        </span>
                      )}

                    </div>

                    {/* PRODUCT INFORMATION */}

                    <div className="similar-product-info">

                      <span className="similar-product-category">
                        {item.category}
                      </span>

                      <h3
                        onClick={() =>
                          openSimilarProduct(item)
                        }
                      >
                        {item.name}
                      </h3>

                      <p className="similar-product-unit">
                        {item.quantity}
                      </p>

                      <div className="similar-product-price">

                        <strong>
                          ₹{formatPrice(item.price)}
                        </strong>

                        {itemHasDiscount && (
                          <del>
                            ₹{formatPrice(item.oldPrice)}
                          </del>
                        )}

                      </div>

                      {/* ADD / QUANTITY */}

                      <div className="similar-product-cart">

                        {quantity === 0 ? (

                          <button
                            className="similar-add-button"
                            disabled={item.stock <= 0}
                            onClick={() =>
                              handleSimilarAdd(item)
                            }
                          >
                            {item.stock <= 0
                              ? "OUT OF STOCK"
                              : "ADD +"}
                          </button>

                        ) : (

                          <div className="similar-quantity-control">

                            <button
                              onClick={() =>
                                handleSimilarDecrease(item)
                              }
                            >
                              −
                            </button>

                            <strong>{quantity}</strong>

                            <button
                              disabled={itemMaxReached}
                              onClick={() =>
                                handleSimilarIncrease(item)
                              }
                            >
                              +
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  </article>

                );
              })}

            </div>

          </section>

        )}

      </div>

    </main>
  );
}

export default ProductDetails;