
import { useState } from "react";
import "../styles/Admin.css";

function Admin() {
  const [product, setProduct] = useState({
    name: "",
    category: "Fruits",
    weight: "",
    price: "",
    oldPrice: "",
    stock: "",
    description: "",
    image: null,
  });

  const [preview, setPreview] = useState("");

  // CUSTOMER ORDERS
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("organigoOrders") || "[]"
      );
    } catch {
      return [];
    }
  });

  // INPUT HANDLE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProduct({
      ...product,
      [name]: value,
    });
  };

  // IMAGE UPLOAD
  const handleImage = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setProduct((prev) => ({
          ...prev,
          image: reader.result,
        }));

        setPreview(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  // SAVE PRODUCT
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!product.image) {
      alert("Please upload product image!");
      return;
    }

    const savedProducts = JSON.parse(
      localStorage.getItem("organigoProducts") || "[]"
    );

    const newProduct = {
      id: Date.now(),
      name: product.name,
      category: product.category,
      weight: product.weight,
      price: Number(product.price),
      oldPrice: Number(product.oldPrice),
      stock: Number(product.stock),
      description: product.description,
      image: product.image,
    };

    localStorage.setItem(
      "organigoProducts",
      JSON.stringify([...savedProducts, newProduct])
    );

    window.dispatchEvent(new Event("organigoProductsUpdated"));

    alert("Product Added Successfully!");

    setProduct({
      name: "",
      category: "Fruits",
      weight: "",
      price: "",
      oldPrice: "",
      stock: "",
      description: "",
      image: null,
    });

    setPreview("");
  };

  // REFRESH ORDERS
  const refreshOrders = () => {
    try {
      const savedOrders = JSON.parse(
        localStorage.getItem("organigoOrders") || "[]"
      );

      setOrders(savedOrders);
    } catch {
      setOrders([]);
    }
  };

  // UPDATE ORDER STATUS
  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.orderId === orderId
        ? { ...order, status: newStatus }
        : order
    );

    localStorage.setItem(
      "organigoOrders",
      JSON.stringify(updatedOrders)
    );

    setOrders(updatedOrders);
  };

  return (
    <div className="admin-page">

      <div className="admin-heading">
        <h1>ORGANIGO Admin Panel</h1>
        <p>Manage your grocery products and customer orders</p>
      </div>

      {/* ADD PRODUCT SECTION */}

      <div className="admin-container">

        <h2>Add New Product</h2>

        <form onSubmit={handleSubmit}>

          <div className="image-upload">
            <label>Product Image</label>

            <div className="image-preview">
              {preview ? (
                <img src={preview} alt="Product Preview" />
              ) : (
                <span>📷 Upload Product Photo</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              required
            />
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                name="name"
                placeholder="Example: Fresh Apple"
                value={product.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
              >
                <option>Fruits</option>
                <option>Vegetables</option>
                <option>Dairy</option>
                <option>Bakery</option>
                <option>Snacks</option>
                <option>Beverages</option>
                <option>Grocery</option>
              </select>
            </div>

            <div className="form-group">
              <label>Product Weight</label>
              <input
                type="text"
                name="weight"
                placeholder="Example: 1 kg"
                value={product.weight}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Selling Price (₹)</label>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                min="0"
                value={product.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Original Price (₹)</label>
              <input
                type="number"
                name="oldPrice"
                placeholder="Enter original price"
                min="0"
                value={product.oldPrice}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stock"
                placeholder="Available quantity"
                min="0"
                value={product.stock}
                onChange={handleChange}
                required
              />
            </div>

          </div>

          <div className="form-group">
            <label>Product Description</label>
            <textarea
              name="description"
              placeholder="Write product details..."
              value={product.description}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="save-product-btn">
            + Add Product
          </button>

        </form>
      </div>

      {/* CUSTOMER ORDERS SECTION */}

      <div className="admin-orders-container">

        <div className="admin-orders-heading">
          <div>
            <h2>Customer Orders 📦</h2>
            <p>Total Orders: {orders.length}</p>
          </div>

          <button
            className="refresh-orders-btn"
            onClick={refreshOrders}
          >
            ↻ Refresh Orders
          </button>
        </div>

        {orders.length === 0 ? (

          <div className="no-orders">
            <span>📦</span>
            <h3>No Orders Yet</h3>
            <p>Customer orders will appear here.</p>
          </div>

        ) : (

          <div className="admin-orders-list">

            {[...orders].reverse().map((order) => (

              <div className="admin-order-card" key={order.orderId}>

                <div className="admin-order-top">

                  <div>
                    <h3>Order #{order.orderId}</h3>
                    <p>{order.orderDate}</p>
                  </div>

                  <span className="order-status-badge">
                    {order.status || "Order Placed"}
                  </span>

                </div>

                <hr />

                <div className="admin-customer-details">

                  <h3>Customer Information</h3>

                  <p>
                    <strong>Name:</strong>{" "}
                    {order.customer?.name || "Not available"}
                  </p>

                  <p>
                    <strong>Mobile:</strong>{" "}
                    {order.customer?.phone || "Not available"}
                  </p>

                  <p>
                    <strong>Address:</strong>{" "}
                    {order.customer?.address || "Not available"}
                  </p>

                  <p>
                    <strong>City:</strong>{" "}
                    {order.customer?.city || "Not available"}
                  </p>

                  <p>
                    <strong>State:</strong>{" "}
                    {order.customer?.state || "Not available"}
                  </p>

                  <p>
                    <strong>PIN Code:</strong>{" "}
                    {order.customer?.pincode || "Not available"}
                  </p>

                </div>

                {/* CUSTOMER GPS LOCATION */}

                <div className="admin-customer-location">

                  <h3>📍 Customer GPS Location</h3>

                  {order.location?.latitude &&
                   order.location?.longitude ? (

                    <>
                      <p>
                        Latitude: {order.location.latitude}
                      </p>

                      <p>
                        Longitude: {order.location.longitude}
                      </p>

                      <a
                        href={
                          order.mapLink ||
                          `https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="view-map-btn"
                      >
                        📍 View Customer on Google Maps
                      </a>
                    </>

                  ) : (

                    <p className="location-not-available">
                      Customer has not shared GPS location.
                    </p>

                  )}

                </div>

                {/* ORDER PRODUCTS */}

                <div className="admin-order-products">

                  <h3>Ordered Products</h3>

                  {order.items?.map((item, index) => (

                    <div
                      className="admin-order-product"
                      key={`${order.orderId}-${item.id}-${index}`}
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <strong>
                        ₹{Number(item.price) * item.quantity}
                      </strong>
                    </div>

                  ))}

                </div>

                <div className="admin-order-bottom">

                  <div>
                    <p>Payment Method</p>
                    <strong>
                      {order.paymentMethod || "Cash on Delivery"}
                    </strong>
                  </div>

                  <div>
                    <p>Total Amount</p>
                    <strong className="admin-order-total">
                      ₹{order.total}
                    </strong>
                  </div>

                </div>

                {/* UPDATE STATUS */}

                <div className="admin-status-control">

                  <label>Update Order Status</label>

                  <select
                    value={order.status || "Order Placed"}
                    onChange={(e) =>
                      updateOrderStatus(
                        order.orderId,
                        e.target.value
                      )
                    }
                  >
                    <option>Order Placed</option>
                    <option>Confirmed</option>
                    <option>Packed</option>
                    <option>Out for Delivery</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Admin;