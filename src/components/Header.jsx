import React, { useEffect, useRef, useState } from "react";
import { getUser, getToken, clearSession } from "../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/Header.css";

const API_URL = "http://localhost:5000/api/addresses";

const defaultHub = {
  latitude: 22.5504,
  longitude: 85.8025,
  radius: 10,
  active: true,
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getHubSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("organigoDeliverySettings") || "null"
    );

    return saved ? { ...defaultHub, ...saved } : defaultHub;
  } catch {
    return defaultHub;
  }
}

function getSavedLocation() {
  try {
    return JSON.parse(
      localStorage.getItem("organigoSelectedLocation") || "null"
    );
  } catch {
    return null;
  }
}

function getSavedUser() {
  return getUser();
}


function Header() {
  const navigate = useNavigate();
  const accountRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const { cartItems } = useCart();

  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);

  const [selectedLocation, setSelectedLocation] =
    useState(getSavedLocation);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectingAddressId, setSelectingAddressId] = useState(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [hubSettings, setHubSettings] = useState(getHubSettings);

  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(getUser);

  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  // =====================================
  // LOAD SAVED ADDRESSES FROM MONGODB
  // =====================================

  const loadSavedAddresses = async () => {
    const token = getToken();

    if (!token) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }

    try {
      setAddressesLoading(true);

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load addresses.");
      }

      setSavedAddresses(data.addresses || []);
      setSelectedAddressId(data.selectedAddressId || null);

      // Restore selected address from MongoDB
      if (data.selectedAddress) {
        const address = data.selectedAddress;

        const hasCoordinates =
          address.latitude !== null &&
          address.latitude !== undefined &&
          address.longitude !== null &&
          address.longitude !== undefined;

        let finalLocation = {
          name: [
            address.area,
            address.city,
            address.state,
          ]
            .filter(Boolean)
            .join(", "),

          fullAddress: [
            address.houseNo,
            address.area,
            address.landmark,
            address.city,
            address.state,
            address.pincode,
          ]
            .filter(Boolean)
            .join(", "),

          latitude: hasCoordinates
            ? Number(address.latitude)
            : null,

          longitude: hasCoordinates
            ? Number(address.longitude)
            : null,

          source: "saved-address",
          addressId: address._id,
        };

        if (hasCoordinates) {
          const result = checkDelivery(
            address.latitude,
            address.longitude
          );

          finalLocation.distance = result.distance;
          finalLocation.available = result.available;
        } else {
          finalLocation.available = null;
          finalLocation.distance = null;
        }

        localStorage.setItem(
          "organigoSelectedLocation",
          JSON.stringify(finalLocation)
        );

        setSelectedLocation(finalLocation);

        window.dispatchEvent(
          new Event("organigoSelectedAddressUpdated")
        );
      } else {
        setSelectedLocation(null);
        localStorage.removeItem("organigoSelectedLocation");
      }
    } catch (error) {
      console.error("Load Saved Addresses Error:", error);

      setLocationMessage(
        "Saved addresses load nahi ho paaye. Please try again."
      );
    } finally {
      setAddressesLoading(false);
    }
  };

  // =====================================
  // LOGIN STATUS UPDATE
  // =====================================

  useEffect(() => {
    const refreshUser = () => {
      setUser(getSavedUser());
    };

    window.addEventListener("organigoAuthChanged", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("organigoAuthChanged", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  // =====================================
  // LOAD ADDRESS AFTER LOGIN
  // =====================================

  useEffect(() => {
    if (user && getToken()) {
      loadSavedAddresses();
    } else {
      setSavedAddresses([]);
      setSelectedAddressId(null);
    }
  }, [user]);

  // =====================================
  // CLOSE DROPDOWN
  // =====================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setLocationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // =====================================
  // LOGOUT
  // =====================================

 const handleLogout = () => {
  // Sirf current tab ka login clear hoga
  clearSession();

  localStorage.removeItem("organigoSelectedLocation");

  setUser(null);
  setSelectedLocation(null);
  setSavedAddresses([]);
  setSelectedAddressId(null);

  setAccountOpen(false);

  navigate("/");
};

  // =====================================
  // PRODUCT SEARCH
  // =====================================

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    window.dispatchEvent(
      new CustomEvent("organigoSearch", {
        detail: value,
      })
    );
  };

  // =====================================
  // REFRESH DELIVERY SETTINGS
  // =====================================

  useEffect(() => {
    const refreshSettings = () => {
      setHubSettings(getHubSettings());
    };

    window.addEventListener(
      "organigoDeliverySettingsUpdated",
      refreshSettings
    );

    window.addEventListener("storage", refreshSettings);

    return () => {
      window.removeEventListener(
        "organigoDeliverySettingsUpdated",
        refreshSettings
      );

      window.removeEventListener("storage", refreshSettings);
    };
  }, []);

  // =====================================
  // CHECK DELIVERY DISTANCE
  // =====================================

  const checkDelivery = (latitude, longitude) => {
    const hub = getHubSettings();

    const distance = getDistanceKm(
      Number(hub.latitude),
      Number(hub.longitude),
      Number(latitude),
      Number(longitude)
    );

    return {
      distance: Number(distance.toFixed(2)),
      available:
        hub.active !== false &&
        distance <= Number(hub.radius || 10),
    };
  };

  // =====================================
  // SAVE CUSTOMER LOCATION
  // =====================================

  const saveLocation = (location) => {
    const result = checkDelivery(
      location.latitude,
      location.longitude
    );

    const finalLocation = {
      ...location,
      distance: result.distance,
      available: result.available,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "organigoSelectedLocation",
      JSON.stringify(finalLocation)
    );

    setSelectedLocation(finalLocation);

    setLocationOpen(false);
    setLocationQuery("");
    setLocationResults([]);
    setLocationMessage("");
  };

  // =====================================
  // SELECT SAVED ADDRESS FROM MONGODB
  // =====================================

  const selectSavedAddress = async (address) => {
    const token = getToken();

    if (!token) {
      setLocationMessage("Please login to select a saved address.");
      return;
    }

    try {
      setSelectingAddressId(address._id);
      setLocationMessage("");

      const response = await fetch(
        `${API_URL}/${address._id}/select`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to select this address."
        );
      }

      setSelectedAddressId(data.selectedAddressId);

      const selected = data.selectedAddress;

      const hasCoordinates =
        selected.latitude !== null &&
        selected.latitude !== undefined &&
        selected.longitude !== null &&
        selected.longitude !== undefined;

      const finalLocation = {
        name: [
          selected.area,
          selected.city,
          selected.state,
        ]
          .filter(Boolean)
          .join(", "),

        fullAddress: [
          selected.houseNo,
          selected.area,
          selected.landmark,
          selected.city,
          selected.state,
          selected.pincode,
        ]
          .filter(Boolean)
          .join(", "),

        latitude: hasCoordinates
          ? Number(selected.latitude)
          : null,

        longitude: hasCoordinates
          ? Number(selected.longitude)
          : null,

        source: "saved-address",
        addressId: selected._id,
      };

      if (hasCoordinates) {
        const result = checkDelivery(
          selected.latitude,
          selected.longitude
        );

        finalLocation.distance = result.distance;
        finalLocation.available = result.available;
      } else {
        finalLocation.distance = null;
        finalLocation.available = null;
      }

      localStorage.setItem(
        "organigoSelectedLocation",
        JSON.stringify(finalLocation)
      );

      setSelectedLocation(finalLocation);
      setSavedAddresses(data.addresses || savedAddresses);

      setLocationOpen(false);
      setLocationMessage("");

      window.dispatchEvent(
        new Event("organigoSelectedAddressUpdated")
      );
    } catch (error) {
      console.error("Select Address Error:", error);
      setLocationMessage(error.message);
    } finally {
      setSelectingAddressId(null);
    }
  };

  // =====================================
  // SEARCH ADDRESS
  // =====================================

  useEffect(() => {
    if (!locationOpen || locationQuery.trim().length < 3) {
      setLocationResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLocationLoading(true);

        const params = new URLSearchParams({
          format: "jsonv2",
          addressdetails: "1",
          limit: "5",
          countrycodes: "in",
          q: locationQuery,
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`
        );

        if (!response.ok) {
          throw new Error("Address search failed");
        }

        const data = await response.json();
        setLocationResults(data);
      } catch {
        setLocationMessage(
          "Address search is temporarily unavailable. Please try again."
        );
      } finally {
        setLocationLoading(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [locationQuery, locationOpen]);

  // =====================================
  // SELECT MANUAL ADDRESS
  // =====================================

  const selectAddress = (place) => {
    const address = place.address || {};

    const name =
      [
        address.road,
        address.suburb || address.neighbourhood,
        address.city || address.town || address.village,
        address.state,
        address.postcode,
      ]
        .filter(Boolean)
        .join(", ") || place.display_name;

    saveLocation({
      name,
      fullAddress: place.display_name,
      latitude: Number(place.lat),
      longitude: Number(place.lon),
      source: "manual",
    });
  };

  // =====================================
  // CURRENT GPS LOCATION
  // =====================================

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Your browser does not support GPS location."
      );
      return;
    }

    setLocationLoading(true);
    setLocationMessage("Detecting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(latitude),
            lon: String(longitude),
          });

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`
          );

          if (!response.ok) {
            throw new Error("Address not found");
          }

          const data = await response.json();

          saveLocation({
            name: data.display_name || "Current Location",
            fullAddress: data.display_name || "Current Location",
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            source: "gps",
          });
        } catch {
          saveLocation({
            name: "Current GPS Location",
            fullAddress: "Address could not be identified",
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            source: "gps",
          });
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);

        if (error.code === 1) {
          setLocationMessage(
            "Location permission denied. Please allow location access or enter your address manually."
          );
        } else if (error.code === 2) {
          setLocationMessage(
            "Your current location could not be detected. Please try again."
          );
        } else {
          setLocationMessage(
            "Location request timed out. Please try again."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  // =====================================
  // DELIVERY TEXT
  // =====================================

  const deliveryText = selectedLocation
    ? selectedLocation.available === true
      ? "Delivery Available"
      : selectedLocation.available === false
        ? "Not Available"
        : "Verify Location"
    : "Select Location";

  // =====================================
  // HEADER UI
  // =====================================

  return (
    <header className="Organigo-header">
      <div className="organigo-app-banner">
        <div className="app-banner-icon">🥬</div>

        <div className="app-banner-text">
          <strong>ORGANIGO APP</strong>
          <small>Get a fresher shopping experience!</small>
        </div>

        <button className="app-download-button" type="button" disabled>
          Coming Soon
        </button>
      </div>

      <div className="header-container">
        {/* LOGO */}

        <Link to="/" className="Organigo-logo">
          <img src="/organigo-logo.png" alt="ORGANIGO" />
        </Link>

        {/* LOCATION */}

        <button
          type="button"
          className="delivery-location"
          onClick={() => {
            setLocationOpen(true);
            setLocationMessage("");
            setAccountOpen(false);

            if (user) {
              loadSavedAddresses();
            }
          }}
        >
          <span className="location-icon">📍</span>

          <div>
            <small>
              {selectedLocation ? "Delivering to" : "Delivery Location"}
            </small>

            <strong>
              {selectedLocation
                ? selectedLocation.name.split(",").slice(0, 2).join(",")
                : "Select your location"}
            </strong>

            {selectedLocation && (
              <small
                className={
                  selectedLocation.available === true
                    ? "location-available"
                    : "location-unavailable"
                }
              >
                {deliveryText}
              </small>
            )}
          </div>

          <span className="location-edit-icon">⌄</span>
        </button>

        {/* SEARCH */}

        <div className="header-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search fruits, vegetables, juice..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* ACCOUNT */}

        <div className="header-account" ref={accountRef}>
          <button
            type="button"
            className="header-account-button"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((previous) => !previous)}
          >
            <span className="account-icon">👤</span>

            <span className="account-button-text">
              {user ? (
                <>
                  <small>Hello,</small>
                  <strong>
                    {user.name?.split(" ")[0] || "My Account"}
                  </strong>
                </>
              ) : (
                <>
                  <small>Welcome</small>
                  <strong>Login / Sign Up</strong>
                </>
              )}
            </span>

            <span className="account-arrow">⌄</span>
          </button>

          {accountOpen && (
            <div className="account-dropdown">
              {user ? (
                <>
                  <div className="account-dropdown-heading">
                    <strong>{user.name}</strong>
                    <small>{user.phone}</small>
                  </div>

                  <Link
                    to="/account"
                    onClick={() => setAccountOpen(false)}
                  >
                    👤 My Account
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="account-logout-button"
                  >
                    ↪ Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="account-dropdown-heading">
                    <strong>Welcome to ORGANIGO!</strong>
                    <small>Login to manage your account.</small>
                  </div>

                  <Link
                    to="/login"
                    onClick={() => setAccountOpen(false)}
                  >
                    🔐 Login
                  </Link>

                  <Link
                    to="/signup"
                    onClick={() => setAccountOpen(false)}
                  >
                    ✨ Create My Account
                  </Link>

                  <Link
                    to="/forgot-password"
                    onClick={() => setAccountOpen(false)}
                  >
                    🔑 Forgot Password?
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* CART */}

        <Link to="/cart" className="header-cart">
          <span className="cart-icon">🛒</span>
          <span>My Cart</span>

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* LOCATION MODAL */}

      {locationOpen && (
        <div
          className="location-modal-backdrop"
          onClick={() => setLocationOpen(false)}
        >
          <div
            className="location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="location-modal-heading">
              <div>
                <h2 id="location-modal-title">
                  Select Delivery Location
                </h2>

                <p>Choose where you want your order delivered.</p>
              </div>

              <button
                type="button"
                className="location-modal-close"
                onClick={() => setLocationOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* SAVED ADDRESSES */}

            {user && (
              <div className="saved-addresses-section">
                <div className="saved-addresses-heading">
                  <strong>📍 Your Saved Addresses</strong>

                  <Link
                    to="/addresses"
                    onClick={() => setLocationOpen(false)}
                  >
                    + Add New Address
                  </Link>
                </div>

                {addressesLoading ? (
                  <p className="location-loading">
                    Loading your saved addresses...
                  </p>
                ) : savedAddresses.length > 0 ? (
                  <div className="saved-addresses-list">
                    {savedAddresses.map((address) => (
                      <button
                        type="button"
                        key={address._id}
                        className={`saved-address-item ${
                          selectedAddressId === address._id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => selectSavedAddress(address)}
                        disabled={selectingAddressId !== null}
                      >
                        <span className="saved-address-icon">
                          {address.label === "Work"
                            ? "🏢"
                            : address.label === "Other"
                              ? "📍"
                              : "🏠"}
                        </span>

                        <div className="saved-address-details">
                          <strong>
                            {address.label || "Home"}
                            {selectedAddressId === address._id &&
                              " ✓"}
                          </strong>

                          <small>
                            {[
                              address.houseNo,
                              address.area,
                              address.landmark,
                              address.city,
                              address.state,
                              address.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </small>

                          <small>
                            {address.fullName} · {address.phone}
                          </small>
                        </div>

                        {selectingAddressId === address._id && (
                          <span>Saving...</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="location-no-results">
                    You have not saved any address yet.
                    Click Add New Address to save one.
                  </p>
                )}
              </div>
            )}

            {!user && (
              <div className="saved-addresses-section">
                <p>
                  Login to view and select your saved addresses.
                </p>

                <Link
                  to="/login"
                  onClick={() => setLocationOpen(false)}
                >
                  Login to Your Account
                </Link>
              </div>
            )}

            <div className="location-divider">
              <span>OR USE ANOTHER LOCATION</span>
            </div>

            {/* GPS LOCATION */}

            <button
              type="button"
              className="use-current-location-btn"
              onClick={useCurrentLocation}
              disabled={locationLoading}
            >
              📍 Use My Current Location
            </button>

            {/* MANUAL SEARCH */}

            <div className="location-search-box">
              <span>🔍</span>

              <input
                type="text"
                placeholder="Enter area, street, city or PIN code..."
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setLocationMessage("");
                }}
              />
            </div>

            {locationLoading && (
              <p className="location-loading">
                Finding your location...
              </p>
            )}

            {locationMessage && (
              <p className="location-error">
                {locationMessage}
              </p>
            )}

            {locationResults.length > 0 && (
              <div className="location-results">
                {locationResults.map((place) => (
                  <button
                    type="button"
                    key={place.place_id}
                    className="location-result-item"
                    onClick={() => selectAddress(place)}
                  >
                    <span>📍</span>

                    <div>
                      <strong>
                        {place.name ||
                          place.display_name.split(",")[0]}
                      </strong>

                      <small>{place.display_name}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {locationQuery.trim().length >= 3 &&
              !locationLoading &&
              locationResults.length === 0 &&
              !locationMessage && (
                <p className="location-no-results">
                  No matching address found. Try another area or PIN code.
                </p>
              )}

            {selectedLocation && (
              <div className="current-selected-location">
                <strong>Currently selected location</strong>

                <p>{selectedLocation.name}</p>

                <small>
                  {selectedLocation.available === true
                    ? `✓ Delivery available · ${selectedLocation.distance} KM from hub`
                    : selectedLocation.available === false
                      ? `✕ Outside delivery area · ${selectedLocation.distance} KM from hub`
                      : "Location coordinates need verification."}
                </small>
              </div>
            )}

            <p className="location-modal-footer">
              Delivery availability is calculated using your selected
              location and the current ORGANIGO delivery radius.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;