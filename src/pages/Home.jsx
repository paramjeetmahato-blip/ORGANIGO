import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import "../styles/Home.css";

const categories = [
  {
    name: "All",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=85",
  },
  {
    name: "Fruits",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=85",
  },
  {
    name: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=85",
  },
  {
    name: "Juice",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=85",
  },
  {
    name: "Dairy",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=85",
  },
  {
    name: "Bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=85",
  },
  {
    name: "Snacks",
    image: "https://images.unsplash.com/photo-1621939514649-280e2aa2f7c1?w=400&q=85",
  },
];

function Home() {
  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProducts = () => {
    try {
      const savedProducts = JSON.parse(
        localStorage.getItem("organigoProducts") || "[]"
      );

      setProducts(savedProducts);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();

    window.addEventListener("storage", loadProducts);
    window.addEventListener("organigoProductsUpdated", loadProducts);

    const handleSearch = (event) => {
      setSearchQuery(event.detail || "");
    };

    window.addEventListener("organigoSearch", handleSearch);

    return () => {
      window.removeEventListener("storage", loadProducts);
      window.removeEventListener(
        "organigoProductsUpdated",
        loadProducts
      );
      window.removeEventListener("organigoSearch", handleSearch);
    };
  }, []);

  const getProductQuantity = (product) => {
    const productId = String(
      product._id || product.id || product.name
    );

    const cartProduct = cartItems.find(
      (item) => String(item.id) === productId
    );

    return cartProduct ? cartProduct.quantity : 0;
  };

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "All" ||
      product.category?.toLowerCase() ===
        selectedCategory.toLowerCase();

    const searchMatch =
      product.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  return (
    <main className="organigo-home">

      {/* HERO SECTION */}
      <section className="organigo-hero">
        <div className="hero-content">
          <span className="hero-tag">
            FRESHNESS YOU CAN TRUST
          </span>

          <h1>
            Eat Healthy.
            <br />
            <span>Live Fresh.</span>
          </h1>

          <p>
            Fresh fruits, vegetables, dairy, bakery and healthy snacks
            delivered straight to your doorstep.
          </p>

          <a href="#shop-products" className="hero-button">
            Shop Fresh Products →
          </a>

          <div className="hero-features">
            <span>✓ Fresh Quality</span>
            <span>✓ Great Prices</span>
            <span>✓ Quick Delivery</span>
          </div>
        </div>

        <div className="hero-visual">
          <img
            className="hero-real-image"
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=90"
            alt="Fresh fruits and vegetables"
          />

          <div className="hero-fresh-badge">
            <strong>100%</strong>
            <span>Freshness</span>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
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

      {/* REAL PHOTO CATEGORIES */}
      <section className="organigo-categories">
        <div className="section-heading">
          <div>
            <span className="section-label">EXPLORE ORGANIGO</span>
            <h2>Shop by Category</h2>
          </div>

          <p>Everything fresh, all in one place.</p>
        </div>

        <div className="category-list">
          {categories.map((category) => (
            <button
              key={category.name}
              className={`category-item ${
                selectedCategory === category.name ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <div className="category-image">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                />
              </div>

              <strong>{category.name}</strong>
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        className="organigo-products-section"
        id="shop-products"
      >
        <div className="section-heading">
          <div>
            <span className="section-label">FRESH PICKS FOR YOU</span>

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
            {filteredProducts.map((product) => {
              const quantity = getProductQuantity(product);

              return (
                <div
                  className="organigo-product-card"
                  key={product._id || product.id || product.name}
                >
                  <div className="product-image-box">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span className="product-placeholder">
                        {product.icon || "🥬"}
                      </span>
                    )}

                    <span className="fresh-tag">FRESH</span>
                  </div>

                  <div className="product-details">
                    <span className="product-category">
                      {product.category || "Fresh"}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="product-unit">
                      {product.quantity || product.unit || "1 Unit"}
                    </p>

                    <div className="product-bottom">
                      <div className="product-price">
                        <strong>₹{product.price}</strong>
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
                            onClick={() =>
                              decreaseQuantity(
                                product._id || product.id || product.name
                              )
                            }
                          >
                            −
                          </button>

                          <span>{quantity}</span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                product._id || product.id || product.name
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="organigo-empty-state">
            <span>🥬</span>
            <h3>No Products Found</h3>

            <p>
              {products.length === 0
                ? "Our fresh products will appear here when the Admin adds them."
                : "Try another category or search for a different product."}
            </p>

            {selectedCategory !== "All" && (
              <button onClick={() => setSelectedCategory("All")}>
                View All Products
              </button>
            )}
          </div>
        )}
      </section>

      {/* BOTTOM BANNER */}
      <section className="organigo-bottom-banner">
        <div>
          <span>A HEALTHIER WAY OF LIVING</span>
          <h2>Good Food. Good Mood.</h2>

          <p>
            Make every meal fresh, colourful and full of goodness.
          </p>
        </div>

        <div className="banner-emoji">
          Fresh & Healthy
        </div>
      </section>

    </main>
  );
}

export default Home;