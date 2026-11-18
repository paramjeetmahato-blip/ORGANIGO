import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

// =====================================
// GET CURRENT CUSTOMER CART KEY
// =====================================

const getCartKey = () => {
  try {
    const user = JSON.parse(
      localStorage.getItem("organigoUser") || "null"
    );

    if (!user) {
      return "organigoCart_guest";
    }

    const userId = user._id || user.id || user.phone;

    if (!userId) {
      return "organigoCart_guest";
    }

    return `organigoCart_${String(userId)}`;
  } catch {
    return "organigoCart_guest";
  }
};

// =====================================
// LOAD CUSTOMER CART
// =====================================

const loadCart = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [cartKey, setCartKey] = useState(getCartKey);

  const [cartItems, setCartItems] = useState(() =>
    loadCart(getCartKey())
  );

  // =====================================
  // ACCOUNT CHANGE DETECTION
  // =====================================

  useEffect(() => {
    const handleAccountChange = () => {
      const newKey = getCartKey();

      setCartKey(newKey);
      setCartItems(loadCart(newKey));
    };

    window.addEventListener(
      "organigo-auth-changed",
      handleAccountChange
    );

    window.addEventListener("storage", handleAccountChange);

    return () => {
      window.removeEventListener(
        "organigo-auth-changed",
        handleAccountChange
      );

      window.removeEventListener("storage", handleAccountChange);
    };
  }, []);

  // =====================================
  // SAVE CART ACCOUNT-WISE
  // =====================================

  useEffect(() => {
    if (cartKey !== getCartKey()) {
      return;
    }

    localStorage.setItem(
      cartKey,
      JSON.stringify(cartItems)
    );
  }, [cartItems, cartKey]);

  // =====================================
  // ADD PRODUCT
  // =====================================

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

  // =====================================
  // INCREASE QUANTITY
  // =====================================

  const increaseQuantity = (id) => {
    setCartItems((items) =>
      items.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              quantity: Number(item.quantity || 0) + 1,
            }
          : item
      )
    );
  };

  // =====================================
  // DECREASE QUANTITY
  // =====================================

  const decreaseQuantity = (id) => {
    setCartItems((items) =>
      items
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: Number(item.quantity || 0) - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // =====================================
  // REMOVE PRODUCT
  // =====================================

  const removeFromCart = (id) => {
    setCartItems((items) =>
      items.filter(
        (item) => String(item.id) !== String(id)
      )
    );
  };

  // =====================================
  // CLEAR CART
  // =====================================

  const clearCart = () => {
    setCartItems([]);
  };

  // =====================================
  // TOTAL ITEMS
  // =====================================

  const cartCount = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  // =====================================
  // TOTAL PRICE
  // =====================================

  const cartTotal = cartItems.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
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