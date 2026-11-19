import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Addresses.css";

const API_URL = "http://localhost:5000/api/addresses";



function Addresses() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");

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

  // LOAD ADDRESSES FROM MONGODB
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

  // GET CURRENT GPS LOCATION
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

  // FORM INPUT CHANGE
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // EDIT ADDRESS
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
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE ADDRESS
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

  // SET DEFAULT ADDRESS
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

  // ADD OR UPDATE ADDRESS
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

  // CANCEL FORM
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  if (loading) {
    return (
      <div className="addresses-loading">
        Loading addresses...
      </div>
    );
  }

  return (
    <div className="addresses-page">
      <div className="addresses-container">

        {/* PAGE HEADING */}
        <div className="addresses-heading">
          <div>
            <h1>My Saved Addresses</h1>
            <p>Manage your ORGANIGO delivery locations</p>
          </div>

          <button
            type="button"
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
            {showForm ? "Cancel" : "+ Add New Address"}
          </button>
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
              <div className="address-card" key={address._id}>

                <div className="address-card-top">
                  <h3>📍 {address.label}</h3>

                  {address.isDefault && (
                    <span>DEFAULT</span>
                  )}
                </div>

                <h4>{address.fullName}</h4>

                <p>{address.phone}</p>

                <p>
                  {address.houseNo}, {address.area}
                  {address.landmark
                    ? `, ${address.landmark}`
                    : ""}
                </p>

                <p>
                  {address.city}, {address.state} - {address.pincode}
                </p>

                {/* ADDRESS ACTION BUTTONS */}
                <div className="address-card-actions">

                  <button
                    type="button"
                    onClick={() => handleEdit(address)}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(address._id)}
                    disabled={deletingId === address._id}
                  >
                    {deletingId === address._id
                      ? "Deleting..."
                      : "🗑️ Delete"}
                  </button>

                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address._id)}
                    >
                      ⭐ Set as Default
                    </button>
                  )}

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