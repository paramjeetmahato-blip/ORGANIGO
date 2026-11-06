import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import "../styles/Home.css";

function Home() {
  const { cartCount } = useCart();
  const [adminProducts, setAdminProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();

  // Load Admin Products
  const loadProducts = () => {
    try {
      const savedProducts = JSON.parse(
        localStorage.getItem("organigoProducts") || "[]"
      );

      setAdminProducts(savedProducts);
    } catch (error) {
      console.error("Product loading error:", error);
      setAdminProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();

    // Listen for Admin Product Updates
    window.addEventListener("storage", loadProducts);

    window.addEventListener("organigoProductsUpdated", loadProducts);

    // Header Search Event
    const handleSearch = (event) => {
      setSearchQuery(event.detail || "");
      setSelectedCategory("All");

      document
        .getElementById("all-products")
        ?.scrollIntoView({ behavior: "smooth" });
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

  // Categories
  const categories = [
    { name: "All", icon: "🛒" },
    { name: "Fruits", icon: "🍎" },
    { name: "Vegetables", icon: "🥦" },
    { name: "Dairy", icon: "🥛" },
    { name: "Bakery", icon: "🍞" },
    { name: "Snacks", icon: "🍿" },
    { name: "Beverages", icon: "🥤" },
  ];

  // Demo Products
  const demoProducts = [
    {
      id: "demo-1",
      name: "Fresh Apple",
      category: "Fruits",
      weight: "1 kg",
      price: 120,
      oldPrice: 150,
      icon: "🍎",
    },
    {
      id: "demo-2",
      name: "Fresh Banana",
      category: "Fruits",
      weight: "1 dozen",
      price: 50,
      oldPrice: 65,
      icon: "🍌",
    },
    {
      id: "demo-3",
      name: "Fresh Tomato",
      category: "Vegetables",
      weight: "1 kg",
      price: 30,
      oldPrice: 40,
      icon: "🍅",
    },
    {
      id: "demo-4",
      name: "Fresh Broccoli",
      category: "Vegetables",
      weight: "500 g",
      price: 45,
      oldPrice: 60,
      icon: "🥦",
    },
    {
      id: "demo-5",
      name: "Fresh Orange",
      category: "Fruits",
      weight: "1 kg",
      price: 80,
      oldPrice: 100,
      icon: "🍊",
    },
    {
      id: "demo-6",
      name: "Fresh Carrot",
      category: "Vegetables",
      weight: "1 kg",
      price: 40,
      oldPrice: 50,
      icon: "🥕",
    },
  ];

  // All Products
  const allProducts = [...demoProducts, ...adminProducts];

  // Search + Category Filter
  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category?.toLowerCase() ===
        selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Select Category
  const handleCategory = (category) => {
    setSelectedCategory(category);

    document
      .getElementById("all-products")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Clear Search
  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return (
    <div className="home-page">

      {/* HERO BANNER */}
      <section className="hero-banner">

        <div className="hero-content">

          <span className="hero-tag">
            FRESH & HEALTHY
          </span>

          <h1>
            Fresh Groceries
            <br />
            Delivered to Your Doorstep!
          </h1>

          <p>
            Get fresh fruits, vegetables and daily essentials
            at great prices.
          </p>

          <button
            onClick={() =>
              document
                .getElementById("all-products")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Shop Now →
          </button>

        </div>

        <div className="hero-image">
          🥬 🥑 🍎
        </div>

      </section>

      {/* CATEGORIES */}
      <section className="category-section">

        <h2>Shop by Category</h2>

        <p>Explore our fresh grocery categories</p>

        <div className="category-grid">

          {categories.map((category) => (

            <div
              className={`category-card ${
                selectedCategory === category.name
                  ? "active-category"
                  : ""
              }`}
              key={category.name}
              onClick={() => handleCategory(category.name)}
            >

              <span>{category.icon}</span>

              <h3>{category.name}</h3>

            </div>

          ))}

        </div>

      </section>

      {/* OFFER BANNER */}
      <section className="offer-banner">

        <div>
          <h2>Fresh Deals, Great Savings!</h2>

          <p>
            Save more on your everyday groceries.
          </p>
        </div>

        <span>🛍️</span>

      </section>

      {/* ALL PRODUCTS */}
      <section className="products-section" id="all-products">

        <div className="section-heading">

          <div>

            <h2>
              {selectedCategory === "All"
                ? "All Products"
                : selectedCategory}
            </h2>

            <p>
              {filteredProducts.length} Products Available
            </p>

          </div>

          <span onClick={clearSearch}>
            View All →
          </span>

        </div>

        {/* SEARCH INFO */}
        {searchQuery && (
          <div className="search-result-info">
            Search Results for: <strong>{searchQuery}</strong>

            <button onClick={clearSearch}>
              Clear ✕
            </button>
          </div>
        )}

        {/* PRODUCT GRID */}
        {filteredProducts.length > 0 ? (

          <div className="product-grid">

            {filteredProducts.map((product, index) => (

              <div
                className="product-card"
                key={product.id || `${product.name}-${index}`}
              >

                {/* PRODUCT IMAGE */}
                <div className="product-image">

                  {product.image ? (

                    <img
                      src={product.image}
                      alt={product.name}
                    />

                  ) : (

                    product.icon || "🛒"

                  )}

                </div>

                {/* PRODUCT DETAILS */}
                <h3>{product.name}</h3>

                <p>{product.weight || "Available"}</p>

                {/* PRICE */}
                <div className="product-price">

                  <strong>₹{product.price}</strong>

                  {product.oldPrice && (
                    <del>₹{product.oldPrice}</del>
                  )}

                </div>

                {/* ADD TO CART */}
              <button
            className="add-cart-btn"
          onClick={() => {
          addToCart(product);
           alert(`${product.name} added to cart!`);
            }}
            >
             ADD +
              </button>

              </div>

            ))}

          </div>

        ) : (

          <div className="no-products">

            <h2>😕 No Products Found</h2>

            <p>
              Try another product name or category.
            </p>

            <button
              className="add-cart-btn"
              onClick={clearSearch}
            >
              Show All Products
            </button>

          </div>

        )}

      </section>

    </div>
  );
}

export default Home;