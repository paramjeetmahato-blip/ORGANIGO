import { Outlet, useLocation } from "react-router-dom";

import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import Home from "../pages/Home";
import Cart from "../pages/Cart";

function CustomerLayout() {
  const location = useLocation();
  const isCartPage = location.pathname === "/cart";

  const hideHeader =
    location.pathname === "/account" ||
    location.pathname.startsWith("/about");

  const hideBottomNavigation =
    isCartPage ||
    ["/signup", "/checkout"].includes(location.pathname) ||
    location.pathname.startsWith("/about");

  // Cart route: render Home behind the drawer on desktop.
  // The CSS hides the Home/header behind the full-screen cart on mobile.
  if (isCartPage) {
    return (
      <div className="customer-layout is-cart-open">
        {!hideHeader && (
          <div className="customer-main-header">
            <Header />
          </div>
        )}

        <div className="customer-home-underlay" aria-hidden="true">
          <Home />
        </div>

        <Cart />
      </div>
    );
  }

  return (
    <div className="customer-layout">
      {!hideHeader && (
        <div className="customer-main-header">
          <Header />
        </div>
      )}

      <Outlet />

      {!hideBottomNavigation && <BottomNavigation />}
    </div>
  );
}

export default CustomerLayout;
