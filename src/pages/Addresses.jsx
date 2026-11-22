import API_BASE_URL from "../services/api";

import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Addresses.css";

const API_URL = `${API_BASE_URL}/api/addresses`;

function Addresses() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("Myself");

  const emptyForm = {
    label: "Home",
    fullName: "",
    phone: "",
    houseNo: "",
    area: "",
    landmark: "",
    city: "Chaibasa",
    state: "Jharkhand",
    pincode: "",
    latitude: null,
    longitude: null,
    isDefault: false,
  };

  const [form, setForm] = useState(emptyForm);

  // =====================================
  // LOAD ADDRESSES FROM MONGODB
  // =====================================

  const loadAddresses = async () => {
    try {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load addresses.");
      }

      setAddresses(data.addresses || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // =====================================
  // GET CURRENT GPS LOCATION
  // =====================================

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support GPS location.");
      return;
    }

    setGpsLoading(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          const data = await response.json();
          const address = data.address || {};

          setForm((prev) => ({
            ...prev,
            houseNo: address.house_number || prev.houseNo,
            area:
              address.road ||
              address.suburb ||
              address.neighbourhood ||
              address.village ||
              prev.area,
            landmark: address.amenity || prev.landmark,
            city:
              address.city ||
              address.town ||
              address.village ||
              prev.city,
            state: address.state || prev.state,
            pincode: address.postcode || prev.pincode,
            latitude,
            longitude,
          }));

          setMessage("Location detected! Please check your address.");
        } catch (error) {
          setMessage("Unable to get address details. Please enter manually.");
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        setMessage(
          "GPS permission nahi mili. Browser location permission allow karein."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  };

  // =====================================
  // FORM INPUT CHANGE
  // =====================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =====================================
  // EDIT ADDRESS
  // =====================================

  const handleEdit = (address) => {
    setForm({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      houseNo: address.houseNo || "",
      area: address.area || "",
      landmark: address.landmark || "",
      city: address.city || "Chaibasa",
      state: address.state || "Jharkhand",
      pincode: address.pincode || "",
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
      isDefault: address.isDefault || false,
    });

    setEditingId(address._id);
    setShowForm(true);
    setOpenMenuId(null);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // DELETE ADDRESS
  // =====================================

  const handleDelete = async (addressId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(addressId);

      const response = await fetch(`${API_URL}/${addressId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Address delete failed.");
      }

      setAddresses(data.addresses || []);
      setMessage("Address deleted successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================
  // SET DEFAULT ADDRESS
  // =====================================

  const handleSetDefault = async (addressId) => {
    try {
      const response = await fetch(`${API_URL}/${addressId}/default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Default address update failed.");
      }

      setAddresses(data.addresses || []);
      setMessage("Default address updated successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  // =====================================
  // SHARE ADDRESS
  // =====================================

  const handleShareAddress = async (address) => {
    const fullAddress = [
      address.fullName,
      address.houseNo,
      address.area,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
      `Phone: ${address.phone}`,
    ]
      .filter(Boolean)
      .join(", ");

    const shareData = {
      title: "ORGANIGO Delivery Address",
      text: `My delivery address:\n${fullAddress}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.text);
        setMessage("Address copied! You can share it now.");
      } else {
        throw new Error("Sharing is not supported by this browser.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setMessage(error.message || "Unable to share address.");
      }
    }

    setOpenMenuId(null);
  };

  // =====================================
  // REQUEST ADDRESS ON WHATSAPP
  // =====================================

  const requestAddressOnWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi! I want to place an order on ORGANIGO. Please share your delivery address or live location with me."
    );

    window.open(
      `https://wa.me/?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================
  // ADD OR UPDATE ADDRESS
  // =====================================

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save address.");
      }

      setAddresses(data.addresses || []);

      const successMessage = editingId
        ? "Address updated successfully!"
        : "Address saved successfully!";

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setMessage(successMessage);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // CANCEL FORM
  // =====================================

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="addresses-loading">
        Loading addresses...
      </div>
    );
  }

  // =====================================
  // MAIN PAGE
  // =====================================
// =====================================
// ORGANIGO FULL SCREEN ADD ADDRESS
// =====================================

if (showForm) {
  return (
    <div className="organigo-add-address-page">

      {/* HEADER */}
      <div className="organigo-add-address-header">
        <button
          type="button"
          className="organigo-add-address-back"
          onClick={handleCancel}
        >
          ←
        </button>

        <h2>
          {editingId ? "Edit Address" : "Add Address Details"}
        </h2>
      </div>

      <form
        onSubmit={handleSave}
        className="organigo-add-address-content"
      >

        {/* GPS LOCATION */}
        <div className="organigo-current-location">

          <span className="organigo-current-location-icon">
            📍
          </span>

          <div className="organigo-current-location-info">
            <strong>Adding address at your current location?</strong>
            <p>Use GPS to automatically detect your address.</p>
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gpsLoading}
          >
            {gpsLoading ? "Wait..." : "Enable"}
          </button>

        </div>

        {/* LOCATION DETAILS */}
        <div className="organigo-address-section">

          <h3>Address Details</h3>

          <div className="organigo-address-field">
            <label>House / Flat / Building Number *</label>
            <input
              name="houseNo"
              value={form.houseNo}
              onChange={handleChange}
              placeholder="Enter house or flat number"
              required
            />
          </div>

          <div className="organigo-address-field">
            <label>Area / Street *</label>
            <input
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="Enter area or street"
              required
            />
          </div>

          <div className="organigo-address-field">
            <label>Landmark</label>
            <input
              name="landmark"
              value={form.landmark}
              onChange={handleChange}
              placeholder="Nearby famous place"
            />
          </div>

          <div className="organigo-address-field">
            <label>City *</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="organigo-address-field">
            <label>State *</label>
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              required
            />
          </div>

          <div className="organigo-address-field">
            <label>PIN Code *</label>
            <input
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              maxLength="6"
              required
            />
          </div>

        </div>

        {/* CONTACT DETAILS */}
        <div className="organigo-address-section">

          <h3>Contact Details</h3>

          <div className="organigo-address-choice">

            <button
              type="button"
              className={recipientType === "Myself" ? "active" : ""}
              onClick={() => setRecipientType("Myself")}
            >
              Myself
            </button>

            <button
              type="button"
              className={recipientType === "Someone else" ? "active" : ""}
              onClick={() => setRecipientType("Someone else")}
            >
              Someone else
            </button>

          </div>

          <div className="organigo-address-field">
            <label>
              {recipientType === "Myself"
                ? "Your Name *"
                : "Receiver's Name *"}
            </label>

            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="organigo-address-field">
            <label>
              {recipientType === "Myself"
                ? "Your Mobile Number *"
                : "Receiver's Mobile Number *"}
            </label>

            <input
              name="phone"
              type="tel"
              maxLength="10"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter 10 digit mobile number"
              required
            />
          </div>

        </div>

        {/* SAVE ADDRESS AS */}
        <div className="organigo-address-section">

          <h3>Save Address As</h3>

          <div className="organigo-address-choice">

            {["Home", "Work", "Hotel", "Other"].map((type) => (
              <button
                key={type}
                type="button"
                className={form.label === type ? "active" : ""}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    label: type,
                  }))
                }
              >
                {type === "Home" && "🏠 "}
                {type === "Work" && "🏢 "}
                {type === "Hotel" && "🏨 "}
                {type === "Other" && "📍 "}
                {type}
              </button>
            ))}

          </div>

        </div>

        {/* DEFAULT ADDRESS */}
        <label className="default-address-option">
          <input
            type="checkbox"
            name="isDefault"
            checked={form.isDefault}
            onChange={handleChange}
          />
          Make this my default address
        </label>

        {message && (
          <p className="addresses-message">{message}</p>
        )}

        {/* FIXED NEXT BUTTON */}
        <div className="organigo-address-next">
          <button type="submit" disabled={saving}>
            {saving
              ? "Saving Address..."
              : editingId
              ? "Update Address"
              : "Next"}
          </button>
        </div>

      </form>
    </div>
  );
}
  return (
    <div className="addresses-page">
      <div className="addresses-container">

        {/* PAGE HEADER */}

        <div className="my-addresses-header">
          <button
            type="button"
            className="my-addresses-back"
            onClick={() => navigate("/account")}
          >
            ←
          </button>

          <h1>My Addresses</h1>
        </div>

        {/* ADDRESS ACTIONS */}

        <div className="my-addresses-actions">

          <button
            type="button"
            className="my-address-action"
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
                setEditingId(null);
                setForm(emptyForm);
                setMessage("");
              }
            }}
          >
            <span className="my-address-action-icon">＋</span>
            <span>Add new address</span>
            <span className="my-address-arrow">›</span>
          </button>

          <button
            type="button"
            className="my-address-action"
            onClick={requestAddressOnWhatsApp}
          >
            <span className="my-address-whatsapp">☏</span>
            <span>Request address from someone else</span>
            <span className="my-address-arrow">›</span>
          </button>

        </div>

        {/* SAVED ADDRESSES HEADING */}

        <div className="my-addresses-section-heading">
          Your saved addresses
        </div>

        {/* MESSAGE */}

        {message && (
          <p className="addresses-message">
            {message}
          </p>
        )}

        {/* ADD / EDIT FORM */}

        {showForm && (
          <form className="address-form" onSubmit={handleSave}>

            <h2>
              {editingId
                ? "Edit Delivery Address"
                : "Add Delivery Address"}
            </h2>

            {/* RECIPIENT TYPE */}

<div className="organigo-address-section">
  <h3>Who are you receiving this order for?</h3>

  <div className="organigo-address-choice">
    <button
      type="button"
      className={recipientType === "Myself" ? "active" : ""}
      onClick={() => setRecipientType("Myself")}
    >
      Myself
    </button>

    <button
      type="button"
      className={recipientType === "Someone else" ? "active" : ""}
      onClick={() => setRecipientType("Someone else")}
    >
      Someone else
    </button>
  </div>
</div>

            <button
              type="button"
              className="gps-location-button"
              onClick={getCurrentLocation}
              disabled={gpsLoading}
            >
              📍{" "}
              {gpsLoading
                ? "Detecting Location..."
                : "Use Current Location"}
            </button>

            <label>Address Type</label>

            <select
              name="label"
              value={form.label}
              onChange={handleChange}
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>

            <div className="address-form-grid">

              <div>
                <label>Full Name *</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Mobile Number *</label>
                <input
                  name="phone"
                  type="tel"
                  maxLength="10"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>House / Flat Number *</label>
                <input
                  name="houseNo"
                  value={form.houseNo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Area / Street *</label>
                <input
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Landmark</label>
                <input
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>City *</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>State *</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>PIN Code *</label>
                <input
                  name="pincode"
                  type="text"
                  maxLength="6"
                  value={form.pincode}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <label className="default-address-option">
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={handleChange}
              />

              Make this my default address
            </label>

            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                ? "Update Address"
                : "Save Address"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

          </form>
        )}

        {/* SAVED ADDRESS LIST */}

        <div className="addresses-list">

          {addresses.length === 0 ? (
            <div className="addresses-empty">
              <span>📍</span>
              <h2>No saved addresses</h2>
              <p>Add your delivery address to get started.</p>
            </div>
          ) : (
            addresses.map((address) => (

              <div
                className="organigo-address-card"
                key={address._id}
              >

                {/* ADDRESS ICON */}

                <div className="organigo-address-icon">
                  {address.label === "Work" ? "🏢" : "⌂"}
                </div>

                <div className="organigo-address-info">

                  {/* ADDRESS TITLE */}

                  <div className="organigo-address-title">

                    <h3>{address.label}</h3>

                    {address.isDefault && (
                      <span className="organigo-default-badge">
                        DEFAULT
                      </span>
                    )}

                  </div>

                  <p className="organigo-address-fullname">
                    {address.fullName}
                  </p>

                  <p className="organigo-address-details">
                    {address.houseNo}, {address.area}
                    {address.landmark ? `, ${address.landmark}` : ""}
                    , {address.city}, {address.state} - {address.pincode}
                  </p>

                  <p className="organigo-address-phone">
                    Phone number: <strong>{address.phone}</strong>
                  </p>

                  {/* THREE DOT MENU */}

                  <div className="organigo-address-menu-wrapper">

                    <button
                      type="button"
                      className="organigo-address-menu-trigger"
                      aria-label="Address options"
                      aria-expanded={openMenuId === address._id}
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === address._id
                            ? null
                            : address._id
                        )
                      }
                    >
                      ⋮
                    </button>

                    {openMenuId === address._id && (

                      <div className="organigo-address-dropdown">

                        <button
                          type="button"
                          onClick={() => handleShareAddress(address)}
                        >
                          ↗ Share Address
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(address)}
                        >
                          ✏️ Edit Address
                        </button>

                        {!address.isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleSetDefault(address._id);
                            }}
                          >
                            ★ Set as Default
                          </button>
                        )}

                        <button
                          type="button"
                          className="organigo-delete-option"
                          disabled={deletingId === address._id}
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDelete(address._id);
                          }}
                        >
                          {deletingId === address._id
                            ? "Deleting..."
                            : "🗑 Delete Address"}
                        </button>

                      </div>
                    )}

                  </div>

                </div>

              </div>

            ))
          )}

        </div>

        {/* BACK BUTTON */}

        <button
          className="addresses-back-button"
          onClick={() => navigate("/account")}
        >
          ← Back to My Account
        </button>

      </div>
    </div>
  );
}

export default Addresses;
