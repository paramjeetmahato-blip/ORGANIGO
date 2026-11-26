function Sidebar({
  menuItems,
  activeTab,
  onChange,
  currentUser,
  onLogout,
  onBackToWebsite,
  sidebarOpen,
}) {
  return (
    <aside
      className={`admin-sidebar ${
        sidebarOpen ? "sidebar-open" : ""
      }`}
    >
      {/* ORGANIGO BRAND */}
      <div className="admin-brand">
        <div className="admin-brand-icon">🌿</div>

        <div>
          <h2>ORGANIGO</h2>
          <span>ADMIN PANEL</span>
        </div>
      </div>

      <div className="admin-menu-label">MAIN MENU</div>

      {/* NAVIGATION */}
      <nav className="admin-navigation">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`admin-nav-item ${
              activeTab === item.id ? "active" : ""
            }`}
            onClick={() => onChange(item.id)}
          >
            <span className="admin-nav-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* PROFILE AND BUTTONS */}
      <div className="admin-sidebar-bottom">

        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div>
            <strong>
              {currentUser?.name || "Administrator"}
            </strong>

            <span>Administrator</span>
          </div>
        </div>

        <button
          className="admin-logout-btn"
          onClick={onLogout}
        >
          ↪ Logout
        </button>

        <button
          className="admin-website-btn"
          onClick={onBackToWebsite}
        >
          ← Back to Website
        </button>

      </div>
    </aside>
  );
}

export default Sidebar;