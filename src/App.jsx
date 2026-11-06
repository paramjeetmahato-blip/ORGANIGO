import Header from "./components/Header";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

import { CartProvider } from "./context/CartContext";

function App() {
  const currentPath = window.location.pathname;

  return (
    <CartProvider>
      {currentPath === "/admin" ? (
        <Admin />
      ) : (
        <>
          <Header />

          {currentPath === "/cart" ? (
            <Cart />
          ) : currentPath === "/checkout" ? (
            <Checkout />
          ) : (
            <Home />
          )}
        </>
      )}
    </CartProvider>
  );
}

export default App;