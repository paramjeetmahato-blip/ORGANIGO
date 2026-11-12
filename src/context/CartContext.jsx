import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("organigoCart") || "[]");
    } catch {
      return [];
    }
  });

  // Cart automatically save hoga
  useEffect(() => {
    localStorage.setItem("organigoCart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Add Product
  const addToCart = (product) => {
    const productId = String(
      product._id || product.id || product.name
    );

    setCartItems((previousItems) => {
      const existing = previousItems.find(
        (item) => String(item.id) === productId
      );

      if (existing) {
        return previousItems.map((item) =>
          String(item.id) === productId
            ? {
                ...item,
                quantity: Number(item.quantity || 0) + 1,
              }
            : item
        );
      }

      return [
        ...previousItems,
        {
          ...product,
          id: productId,
          quantity: 1,
        },
      ];
    });
  };

  // Increase Quantity
  const increaseQuantity = (id) => {
    setCartItems((items) =>
      items.map((item) =>
        String(item.id) === String(id)
          ? { ...item, quantity: Number(item.quantity || 0) + 1 }
          : item
      )
    );
  };

  // Decrease Quantity
  const decreaseQuantity = (id) => {
    setCartItems((items) =>
      items
        .map((item) =>
          String(item.id) === String(id)
            ? { ...item, quantity: Number(item.quantity || 0) - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove Product
  const removeFromCart = (id) => {
    setCartItems((items) =>
      items.filter((item) => String(item.id) !== String(id))
    );
  };

  // Clear Cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Total Items
  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  // Total Price
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}