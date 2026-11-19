import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import { CartProvider } from "./context/CartContext";

import Header from "./components/Header";

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

// CUSTOMER LAYOUT
import { useLocation } from "react-router-dom";

// CUSTOMER LAYOUT
function CustomerLayout() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/account" && <Header />}
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* RIDER ROUTE */}
          <Route path="/rider" element={<RiderDashboard />} />

          {/* CUSTOMER ROUTES */}
          <Route element={<CustomerLayout />}>

            <Route path="/" element={<Home />} />

            <Route path="/cart" element={<Cart />} />

            <Route path="/checkout" element={<Checkout />} />

            <Route path="/login" element={<Login />} />

            <Route path="/signup" element={<Signup />} />

            {/* CUSTOMER ACCOUNT */}
            <Route path="/account" element={<Account />} />

            {/* CUSTOMER ABOUT */}
            <Route path="/about" element={<About />} />

            {/* CUSTOMER ORDERS */}
            <Route path="/my-orders" element={<MyOrders />} />

            {/* ORDER TRACKING */}
            <Route
              path="/track-order/:orderId"
              element={<OrderTracking />}
            />

          </Route>

        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;