import { useCart } from "../context/CartContext";
import "../styles/Cart.css";

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
  } = useCart();

  const handleCheckout = () => {
    window.location.href = "/checkout";
  };

  return (
    <div className="cart-page">

      <div className="cart-heading">
        <h1>My Shopping Cart 🛒</h1>
        <p>Manage your grocery items</p>
      </div>

      {cartItems.length === 0 ? (

        <div className="empty-cart">
          <div>🛒</div>
          <h2>Your Cart is Empty!</h2>
          <p>Add some fresh products to your cart.</p>

          <a href="/" className="continue-shopping">
            Continue Shopping
          </a>
        </div>

      ) : (

        <div className="cart-container">

          <div className="cart-products">

            {cartItems.map((item) => (

              <div className="cart-item" key={item.id}>

                <div className="cart-product-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <span>{item.icon || "🛒"}</span>
                  )}
                </div>

                <div className="cart-product-details">

                  <h3>{item.name}</h3>
                  <p>{item.weight || "Available"}</p>

                  <strong>₹{item.price}</strong>

                  <div className="quantity-controls">

                    <button onClick={() => decreaseQuantity(item.id)}>
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button onClick={() => increaseQuantity(item.id)}>
                      +
                    </button>

                  </div>

                  <p className="item-total">
                    Total: ₹{Number(item.price) * item.quantity}
                  </p>

                  <button
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>

                </div>

              </div>

            ))}

          </div>

          <div className="cart-summary">

            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>₹{cartTotal}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <strong>Free</strong>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total Amount</span>
              <strong>₹{cartTotal}</strong>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
            >
              Proceed to Checkout →
            </button>

            <button
              className="clear-cart-btn"
              onClick={clearCart}
            >
              Clear Cart
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default Cart;