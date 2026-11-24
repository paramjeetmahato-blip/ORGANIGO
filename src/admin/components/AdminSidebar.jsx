import { useNavigate } from "react-router-dom";

function AdminSidebar({
  menuItems,
  activeTab,
  sidebarOpen,
  currentUser,
  onChangeTab,
  onLogout,
  onCloseSidebar,
}) {
  const navigate = useNavigate();

  return (
    <>
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="admin-brand">
          <div className="admin-brand-icon">🥬</div>

          <div>
            <h2>ORGANIGO</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <p className="admin-menu-label">MAIN MENU</p>

        <nav className="admin-navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${
                activeTab === item.id ? "active" : ""
              }`}
              onClick={() => {
                onChangeTab(item.id);
                onCloseSidebar();
              }}
            >
              <span className="admin-nav-icon">
                {item.icon}
              </span>

              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div>
              <strong>{currentUser?.name || "Admin"}</strong>
              <span>{currentUser?.role || "Administrator"}</span>
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
            onClick={() => navigate("/")}
          >
            ← Back to Website
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;