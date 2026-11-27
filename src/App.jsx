import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";

import { CartProvider } from "./context/CartContext";

import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";

import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyOrders from "./pages/MyOrders";
import OrderTracking from "./pages/OrderTracking";
import RiderDashboard from "./pages/RiderDashboard";
import Account from "./pages/Account";
import About from "./pages/About";
import AboutDetails from "./pages/AboutDetails";
import Addresses from "./pages/Addresses";
import ProductDetails from "./pages/ProductDetails";

// CUSTOMER LAYOUT
function CustomerLayout() {
  const location = useLocation();

  const hideHeader =
    location.pathname === "/account" ||
    location.pathname.startsWith("/about");

  const hideBottomNavigation =
    ["/signup", "/checkout"].includes(location.pathname) ||
    location.pathname.startsWith("/about");

  return (
    <>
      {!hideHeader && <Header />}

      <Outlet />

      {!hideBottomNavigation && <BottomNavigation />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>

          {/* ADMIN */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* RIDER */}
          <Route path="/rider" element={<RiderDashboard />} />

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* CUSTOMER */}
          <Route element={<CustomerLayout />}>

            <Route path="/" element={<Home />} />

            <Route path="/cart" element={<Cart />} />

            <Route path="/checkout" element={<Checkout />} />

            <Route path="/signup" element={<Signup />} />

            <Route path="/account" element={<Account />} />

            <Route path="/addresses" element={<Addresses />} />

            {/* ABOUT */}
            <Route path="/about" element={<About />} />

            <Route
              path="/about/:section"
              element={<AboutDetails />}
            />

            <Route path="/my-orders" element={<MyOrders />} />

            <Route
              path="/track-order/:orderId"
              element={<OrderTracking />}
            />
            <Route
  path="/product/:productId"
  element={<ProductDetails />}
/>

          </Route>

        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;