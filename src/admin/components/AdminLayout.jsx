import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

function AdminLayout({
  menuItems,
  activeTab,
  sidebarOpen,
  currentUser,
  onChangeTab,
  onLogout,
  onOpenSidebar,
  onCloseSidebar,
  children,
}) {
  return (
    <div className="admin-layout">
      <AdminSidebar
        menuItems={menuItems}
        activeTab={activeTab}
        sidebarOpen={sidebarOpen}
        currentUser={currentUser}
        onChangeTab={onChangeTab}
        onLogout={onLogout}
        onCloseSidebar={onCloseSidebar}
      />

      <div className="admin-main">
        <AdminTopbar
          menuItems={menuItems}
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenSidebar={onOpenSidebar}
        />

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;