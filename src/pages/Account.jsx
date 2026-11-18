import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Account.css";

const API_URL = "http://localhost:5000/api/customer";

function getToken() {
  return (
    localStorage.getItem("organigoToken") ||
    sessionStorage.getItem("organigoToken")
  );
}

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  // LOAD CUSTOMER PROFILE
  const loadProfile = async () => {
    try {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load profile.");
      }

      setUser(data.user);

      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
      });

      // Update saved login user information
      const storage = localStorage.getItem("organigoToken")
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "organigoUser",
        JSON.stringify(data.user)
      );

      window.dispatchEvent(new Event("organigoAuthChanged"));

    } catch (error) {
      setMessage(error.message);

      if (
        error.message.includes("expired") ||
        error.message.includes("Invalid")
      ) {
        localStorage.removeItem("organigoToken");
        localStorage.removeItem("organigoUser");

        sessionStorage.removeItem("organigoToken");
        sessionStorage.removeItem("organigoUser");

        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // UPDATE PROFILE
  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const token = getToken();

      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: form.name,
          email: form.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed.");
      }

      setUser(data.user);
      setForm({
        name: data.user.name,
        email: data.user.email || "",
      });

      const storage = localStorage.getItem("organigoToken")
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "organigoUser",
        JSON.stringify(data.user)
      );

      window.dispatchEvent(new Event("organigoAuthChanged"));

      setEditing(false);
      setMessage("Profile updated successfully!");

    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("organigoToken");
    localStorage.removeItem("organigoUser");

    sessionStorage.removeItem("organigoToken");
    sessionStorage.removeItem("organigoUser");

    window.dispatchEvent(new Event("organigoAuthChanged"));

    navigate("/");
  };

  if (loading) {
    return (
      <div className="account-loading">
        Loading your profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-loading">
        {message || "Unable to load account."}
      </div>
    );
  }

  const firstName = user.name
    ? user.name.split(" ")[0]
    : "Customer";

  const menuItems = [
    {
      icon: "📦",
      title: "My Orders",
      description: "View and manage all your orders",
      link: "/my-orders",
    },
    {
      icon: "🚚",
      title: "Active Orders",
      description: "Track your ongoing orders",
      link: "/my-orders",
    },
    {
      icon: "🕒",
      title: "Order History",
      description: "See your previous orders",
      link: "/my-orders",
    },
    {
      icon: "❌",
      title: "Cancelled Orders",
      description: "View cancelled orders",
      link: "/my-orders",
    },
    {
      icon: "🎁",
      title: "Offers & Coupons",
      description: "Discover offers and save money",
      link: "/offers",
    },
    {
      icon: "📍",
      title: "Saved Addresses",
      description: "Manage your delivery addresses",
      link: "/addresses",
    },
    {
      icon: "🎧",
      title: "Help & Support",
      description: "Get help with your orders",
      link: "/support",
    },
  ];

  return (
    <div className="account-page">
      <div className="account-container">

        <div className="account-heading">
          <h1>My Account</h1>
          <p>Manage your ORGANIGO account</p>
        </div>

        {/* PROFILE CARD */}
        <div className="account-profile-card">

          <div className="account-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div className="account-profile-info">
            <h2>Hello, {firstName} 👋</h2>
            <p>{user.name}</p>
            <span>{user.phone}</span>
            <span>{user.email || "Email not added"}</span>
          </div>

          <div className="account-member-badge">
            ORGANIGO CUSTOMER
          </div>

        </div>

        {/* EDIT PROFILE */}
        <div className="account-edit-section">

          <div className="account-edit-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Manage your personal details</p>
            </div>

            {!editing && (
              <button
                className="account-edit-button"
                onClick={() => {
                  setForm({
                    name: user.name || "",
                    email: user.email || "",
                  });
                  setEditing(true);
                  setMessage("");
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <div className="account-message">
              {message}
            </div>
          )}

          {editing && (
            <form
              className="account-profile-form"
              onSubmit={handleSave}
            >

              <label>Full Name</label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
                maxLength={60}
                placeholder="Enter your name"
              />

              <label>Mobile Number</label>

              <input
                type="text"
                value={user.phone || ""}
                disabled
              />

              <label>Email Address</label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="Enter your email"
              />

              <div className="account-form-buttons">

                <button
                  type="submit"
                  disabled={saving}
                  className="account-save-button"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="account-cancel-button"
                  onClick={() => {
                    setEditing(false);
                    setMessage("");
                  }}
                >
                  Cancel
                </button>

              </div>

            </form>
          )}

        </div>

        {/* ACCOUNT OPTIONS */}
        <div className="account-section-heading">
          <h2>Your Account</h2>
          <p>Everything you need in one place</p>
        </div>

        <div className="account-menu-grid">

          {menuItems.map((item, index) => (
            <Link
              to={item.link}
              className="account-menu-card"
              key={index}
            >
              <div className="account-menu-icon">
                {item.icon}
              </div>

              <div className="account-menu-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>

              <div className="account-menu-arrow">
                →
              </div>
            </Link>
          ))}

        </div>

        {/* LOGOUT */}
        <div className="account-logout-section">

          <button
            className="account-logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </div>
    </div>
  );
}

export default Account;