import API_BASE_URL from "../services/api";
import { Link } from "react-router-dom";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import { useCart } from "../context/CartContext";
import Footer from "../components/Footer";
import "../styles/Home.css";

const API_URL = `${API_BASE_URL}/api`;

// =========================================
// CATEGORY IMAGES
// =========================================

const categoryImages = {
  Fruits:
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=85",

  Vegetables:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=85",

  Juice:
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=85",

  Dairy:
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=85",

  Bakery:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=85",

  Snacks:
    "https://images.unsplash.com/photo-1621939514649-280e2aa2f7c1?w=400&q=85",

  Beverages:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=85",

  Grocery:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=85",
};

// =========================================
// HOME COMPONENT
// =========================================

function Home() {
const {
  cartItems,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  cartCount,
  cartTotal,
} = useCart();

  const [products, setProducts] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  useEffect(() => {
  const handleFooterCategory = (event) => {
    setSelectedCategory(event.detail);

    setTimeout(() => {
      document
        .getElementById("shop-products")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  window.addEventListener(
    "organigoCategorySelect",
    handleFooterCategory
  );

  return () => {
    window.removeEventListener(
      "organigoCategorySelect",
      handleFooterCategory
    );
  };
}, []);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  // =========================================
  // LOAD PRODUCTS FROM MONGODB
  // =========================================

  const loadProducts = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error("Products load nahi ho paaye.");
      }

      const data = await response.json();

      const productList = Array.isArray(data)
        ? data
        : data.products || data.data || [];

      const formattedProducts = productList.map((product) => ({
        ...product,

        id: String(
          product._id || product.id || product.name
        ),

        quantity:
          product.quantity || product.unit || "1 Unit",

        oldPrice:
          product.originalPrice || product.oldPrice || 0,

        isSpecial: Boolean(product.isSpecial),
        isDemanding: Boolean(product.isDemanding),
        isOnOffer: Boolean(product.isOnOffer),
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error("Product Loading Error:", err);

      setError(
        "Products load nahi ho pa rahe hain. Backend check karo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================
  // LOAD PRODUCTS AND LISTEN TO EVENTS
  // =========================================

  useEffect(() => {
    loadProducts();

    const handleProductUpdate = () => {
      loadProducts();
    };

    const handleSearch = (event) => {
      setSearchQuery(event.detail || "");
    };

    window.addEventListener(
      "organigoProductsUpdated",
      handleProductUpdate
    );

    window.addEventListener(
      "organigoSearch",
      handleSearch
    );

    return () => {
      window.removeEventListener(
        "organigoProductsUpdated",
        handleProductUpdate
      );

      window.removeEventListener(
        "organigoSearch",
        handleSearch
      );
    };
  }, [loadProducts]);

  // =========================================
  // CART PRODUCT QUANTITY
  // =========================================

  const getProductQuantity = (product) => {
    const productId = String(
      product._id || product.id || product.name
    );

    const cartProduct = cartItems.find(
      (item) => String(item.id) === productId
    );

    return cartProduct ? cartProduct.quantity : 0;
  };

  // =========================================
  // SEARCH FILTER
  // =========================================

  const searchFilteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchText = searchQuery.trim().toLowerCase();

      const nameMatch = product.name
        ?.toLowerCase()
        .includes(searchText);

      const categoryMatch = product.category
        ?.toLowerCase()
        .includes(searchText);

      return !searchText || nameMatch || categoryMatch;
    });
  }, [products, searchQuery]);

  // =========================================
  // AVAILABLE PRODUCTS
  // =========================================

  const availableProducts = useMemo(() => {
    return searchFilteredProducts.filter(
      (product) => Number(product.stock) > 0
    );
  }, [searchFilteredProducts]);

  // =========================================
  // DYNAMIC CATEGORIES
  // =========================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];

    return uniqueCategories.sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  // =========================================
  // CATEGORY FILTER
  // =========================================

  const filteredProducts = useMemo(() => {
    return availableProducts.filter((product) => {
      return (
        selectedCategory === "All" ||
        product.category?.toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    });
  }, [availableProducts, selectedCategory]);

  // =========================================
  // OFFER PRODUCTS
  // =========================================

  const offerProducts = useMemo(() => {
    return availableProducts.filter(
      (product) =>
        product.isOnOffer &&
        Number(product.oldPrice) > Number(product.price)
    );
  }, [availableProducts]);

  // =========================================
  // LATEST PRODUCTS
  // =========================================

  const latestProducts = useMemo(() => {
    return [...availableProducts]
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [availableProducts]);

  // =========================================
  // HERO BANNER SLIDES
  // Offers + Latest Products
  // =========================================

  const heroSlides = useMemo(() => {
    const slides = [];

    // Offers first
    offerProducts.forEach((product) => {
      slides.push({
        product,
        type: "offer",
      });
    });

    // Latest products after offers
    latestProducts.forEach((product) => {
      const alreadyAdded = slides.some(
        (slide) =>
          slide.product.id === product.id
      );

      if (!alreadyAdded) {
        slides.push({
          product,
          type: "latest",
        });
      }
    });

    return slides;
  }, [offerProducts, latestProducts]);

  // =========================================
  // HERO AUTO SLIDER
  // =========================================

  useEffect(() => {
    if (heroSlides.length <= 1) {
      setActiveHeroIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveHeroIndex((previousIndex) => {
        return (previousIndex + 1) % heroSlides.length;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [heroSlides]);

  // Keep active slide in range after product updates
  useEffect(() => {
    if (activeHeroIndex >= heroSlides.length) {
      setActiveHeroIndex(0);
    }
  }, [heroSlides.length, activeHeroIndex]);

  const activeHero = heroSlides[activeHeroIndex];

  // =========================================
  // PRODUCT CARD
  // =========================================

  const renderProductCard = (product) => {
    const quantity = getProductQuantity(product);

    const hasDiscount =
      Number(product.oldPrice) > Number(product.price);

    const discountPercentage = hasDiscount
      ? Math.round(
          ((Number(product.oldPrice) -
            Number(product.price)) /
            Number(product.oldPrice)) *
            100
        )
      : 0;

    return (
      <div
        className="organigo-product-card"
        key={product._id || product.id || product.name}
      >
        <div className="product-image-box">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
            />
          ) : (
            <span className="product-placeholder">
              {product.icon || "🥬"}
            </span>
          )}

          {hasDiscount ? (
            <span className="fresh-tag">
              {discountPercentage}% OFF
            </span>
          ) : (
            <span className="fresh-tag">FRESH</span>
          )}
        </div>

        <div className="product-details">
          <span className="product-category">
            {product.category || "Fresh"}
          </span>

          <h3>{product.name}</h3>

          <p className="product-unit">
            {product.quantity || "1 Unit"}
          </p>

          <div className="product-bottom">
            <div className="product-price">
              <strong>₹{product.price}</strong>

              {hasDiscount && (
                <del>₹{product.oldPrice}</del>
              )}
            </div>

            {quantity === 0 ? (
              <button
                className="product-add-button"
                onClick={() => addToCart(product)}
              >
                ADD +
              </button>
            ) : (
              <div className="product-quantity-control">
                <button
                  onClick={() => decreaseQuantity(product.id)}
                >
                  −
                </button>

                <span>{quantity}</span>

                <button
                  onClick={() => increaseQuantity(product.id)}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================
  // LOADING SCREEN
  // =========================================

  if (loading) {
    return (
      <>
        <main className="organigo-home">
          <div className="organigo-empty-state">
            <span>🥬</span>
            <h3>Loading ORGANIGO...</h3>
            <p>Fresh products are coming.</p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================
  // ERROR SCREEN
  // =========================================

  if (error) {
    return (
      <>
        <main className="organigo-home">
          <div className="organigo-empty-state">
            <span>⚠️</span>
            <h3>Something Went Wrong</h3>
            <p>{error}</p>

            <button onClick={loadProducts}>
              Try Again
            </button>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================
  // MAIN HOME PAGE
  // =========================================

  return (
    <>
      <main className="organigo-home">

        {/* =================================
            HERO BANNER
            DYNAMIC OFFERS + LATEST PRODUCTS
        ================================= */}

        <section className="organigo-hero">

          <div className="hero-content">

            {activeHero ? (
              <>
                <span className="hero-tag">
                  {activeHero.type === "offer"
                    ? "🔥 SPECIAL OFFER"
                    : "✨ JUST ARRIVED"}
                </span>

                <h1>
                  {activeHero.type === "offer"
                    ? "Amazing Deals."
                    : "Fresh Arrival."}

                  <br />

                  <span>{activeHero.product.name}</span>
                </h1>

                <p>
                  {activeHero.product.description ||
                    "Fresh quality products delivered straight to your doorstep."}
                </p>

                <div className="hero-product-price">
                  <strong>
                    ₹{activeHero.product.price}
                  </strong>

                  {Number(activeHero.product.oldPrice) >
                    Number(activeHero.product.price) && (
                    <del>
                      ₹{activeHero.product.oldPrice}
                    </del>
                  )}
                </div>

                <a
                  href="#shop-products"
                  className="hero-button"
                >
                  Shop Now →
                </a>
              </>
            ) : (
              <>
                <span className="hero-tag">
                  FRESHNESS YOU CAN TRUST
                </span>

                <h1>
                  Eat Healthy.
                  <br />
                  <span>Live Fresh.</span>
                </h1>

                <p>
                  Fresh fruits, vegetables, dairy, bakery and
                  healthy products delivered straight to your
                  doorstep.
                </p>

                <a
                  href="#shop-products"
                  className="hero-button"
                >
                  Shop Fresh Products →
                </a>
              </>
            )}

            <div className="hero-features">
              <span>✓ Fresh Quality</span>
              <span>✓ Great Prices</span>
              <span>✓ Quick Delivery</span>
            </div>

            {heroSlides.length > 1 && (
              <div className="hero-slider-dots">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`${slide.product.id}-${index}`}
                    className={
                      activeHeroIndex === index
                        ? "active"
                        : ""
                    }
                    onClick={() => setActiveHeroIndex(index)}
                    aria-label={`Show ${slide.product.name}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hero-visual">

            {activeHero?.product.image ? (
              <img
                className="hero-real-image"
                src={activeHero.product.image}
                alt={activeHero.product.name}
              />
            ) : (
              <img
                className="hero-real-image"
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=90"
                alt="Fresh fruits and vegetables"
              />
            )}

            <div className="hero-fresh-badge">
              {activeHero?.type === "offer" ? (
                <>
                  <strong>
                    {Math.round(
                      ((Number(activeHero.product.oldPrice) -
                        Number(activeHero.product.price)) /
                        Number(activeHero.product.oldPrice)) *
                        100
                    )}%
                  </strong>

                  <span>OFF</span>
                </>
              ) : activeHero ? (
                <>
                  <strong>NEW</strong>
                  <span>ARRIVAL</span>
                </>
              ) : (
                <>
                  <strong>100%</strong>
                  <span>Freshness</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* =================================
            BENEFITS
        ================================= */}

        <section className="organigo-benefits">
          <div>
            <span>✓</span>

            <div>
              <h4>Fresh Products</h4>
              <p>Quality you deserve</p>
            </div>
          </div>

          <div>
            <span>🚚</span>

            <div>
              <h4>Fast Delivery</h4>
              <p>At your doorstep</p>
            </div>
          </div>

          <div>
            <span>♥</span>

            <div>
              <h4>Healthy Choices</h4>
              <p>Eat better every day</p>
            </div>
          </div>

          <div>
            <span>★</span>

            <div>
              <h4>Best Quality</h4>
              <p>Freshness matters</p>
            </div>
          </div>
        </section>

        {/* =================================
            CATEGORIES
        ================================= */}

        {categories.length > 0 && (
          <section className="organigo-categories">
           

            <div className="category-list">

              <button
                className={`category-item ${
                  selectedCategory === "All" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("All")}
              >
                <div className="category-image">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=85"
                    alt="All Products"
                    loading="lazy"
                  />
                </div>

                <strong>All</strong>
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-item ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="category-image">
                    <img
                      src={
                        categoryImages[category] ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=85"
                      }
                      alt={category}
                      loading="lazy"
                    />
                  </div>

                  <strong>{category}</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* =================================
            ALL PRODUCTS
        ================================= */}

        <section
          className="organigo-products-section"
          id="shop-products"
        >
          <div className="section-heading">
            <div>
              <span className="section-label">
                FRESH PICKS FOR YOU
              </span>

              <h2>
                {selectedCategory === "All"
                  ? "Our Fresh Products"
                  : selectedCategory}
              </h2>
            </div>

            <span className="product-count">
              {filteredProducts.length} Products
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="organigo-product-grid">
              {filteredProducts.map((product) =>
                renderProductCard(product)
              )}
            </div>
          ) : (
            <div className="organigo-empty-state">
              <span>🥬</span>

              <h3>No Products Found</h3>

              <p>
                {products.length === 0
                  ? "Products will appear here when Admin adds them."
                  : searchQuery
                  ? "No products match your search."
                  : "No products are currently available in this category."}
              </p>

              {(selectedCategory !== "All" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                >
                  View All Products
                </button>
              )}
            </div>
          )}
        </section>

         </main>

      {/* FLOATING CART BAR */}
      {cartCount > 0 && (
        <div className="organigo-floating-cart">
          <div className="floating-cart-info">
            <span className="floating-cart-icon">🛒</span>

            <div>
              <strong>
                {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </strong>

              <p>₹{Number(cartTotal).toFixed(0)}</p>
            </div>
          </div>

          <Link to="/cart" className="floating-cart-button">
            View Cart <span>→</span>
          </Link>
        </div>
      )}

      <Footer />
    </>
  );
}

export default Home;