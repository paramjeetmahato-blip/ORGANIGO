function AdminTopbar({
  menuItems,
  activeTab,
  currentUser,
  onOpenSidebar,
}) {
  const currentPage = menuItems.find(
    (item) => item.id === activeTab
  );

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">

        <button
          className="admin-mobile-menu"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          type="button"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div>
          <h2>{currentPage?.label || "Dashboard"}</h2>
          <p>Welcome back, {currentUser?.name || "Admin"}!</p>
        </div>

      </div>

      <div className="admin-topbar-right">
        <span className="admin-system-status">
          <span className="admin-live-dot"></span>
          System Online
        </span>
      </div>
    </header>
  );
}

export default AdminTopbar;