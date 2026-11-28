import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getUser,
  getToken,
  clearSession,
} from "../utils/auth";

import { useCart } from "../context/CartContext";
import API_BASE_URL from "../services/api";

import "../styles/Header.css";

const API_URL = `${API_BASE_URL}/api/addresses`;

const defaultHub = {
  latitude: 22.5504,
  longitude: 85.8025,
  radius: 10,
  active: true,
};

// =====================================
// DISTANCE CALCULATION
// =====================================

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

  return (
    earthRadius *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

// =====================================
// DELIVERY SETTINGS
// =====================================

function getHubSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("organigoDeliverySettings") || "null"
    );

    return saved
      ? { ...defaultHub, ...saved }
      : defaultHub;
  } catch {
    return defaultHub;
  }
}

// =====================================
// SAVED LOCATION
// =====================================

function getSavedLocation() {
  try {
    return JSON.parse(
      localStorage.getItem("organigoSelectedLocation") || "null"
    );
  } catch {
    return null;
  }
}

// =====================================
// LOCATION ICON
// =====================================

function LocationIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

// =====================================
// HEADER COMPONENT
// =====================================

function Header() {
  const navigate = useNavigate();
  const accountRef = useRef(null);

  const { cartItems, cartTotal } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
const [voiceSupported, setVoiceSupported] = useState(true);
const recognitionRef = useRef(null);
  const [user, setUser] = useState(getUser);

  // APP BANNER
  const [appBannerVisible, setAppBannerVisible] = useState(
    () => localStorage.getItem("organigoAppBannerHidden") !== "true"
  );

  const closeAppBanner = () => {
    localStorage.setItem("organigoAppBannerHidden", "true");
    setAppBannerVisible(false);
  };

  const [accountOpen, setAccountOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // LOCATION MODAL OPEN/CLOSE CONTROL
useEffect(() => {
  if (locationOpen) {
    document.body.classList.add("organigo-location-modal-open");
    document.body.style.overflow = "hidden";
  } else {
    document.body.classList.remove("organigo-location-modal-open");
    document.body.style.overflow = "";
  }

  return () => {
    document.body.classList.remove("organigo-location-modal-open");
    document.body.style.overflow = "";
  };
}, [locationOpen]);

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

  const [locationPermission, setLocationPermission] =
    useState("prompt");

  // =====================================
  // CART COUNT
  // =====================================

  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

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
  // REFRESH USER
  // =====================================

  useEffect(() => {
    const refreshUser = () => {
      setUser(getUser());
    };

    window.addEventListener("organigoAuthChanged", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("organigoAuthChanged", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  // =====================================
  // LOCATION PERMISSION
  // =====================================

  useEffect(() => {
    let permissionStatus = null;

    const checkPermission = async () => {
      try {
        if (!navigator.permissions) {
          setLocationPermission("prompt");
          return;
        }

        permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        setLocationPermission(permissionStatus.state);

        permissionStatus.onchange = () => {
          setLocationPermission(permissionStatus.state);
        };
      } catch (error) {
        console.log("Location permission:", error);
        setLocationPermission("prompt");
      }
    };

    checkPermission();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  // =====================================
  // LOAD SAVED ADDRESSES
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

      if (data.selectedAddress) {
        const address = data.selectedAddress;

        const hasCoordinates =
          address.latitude !== null &&
          address.latitude !== undefined &&
          address.longitude !== null &&
          address.longitude !== undefined;

        const finalLocation = {
          name: [
            address.area,
            address.city,
            address.state,
          ].filter(Boolean).join(", "),

          fullAddress: [
            address.houseNo,
            address.area,
            address.landmark,
            address.city,
            address.state,
            address.pincode,
          ].filter(Boolean).join(", "),

          latitude: hasCoordinates ? Number(address.latitude) : null,
          longitude: hasCoordinates ? Number(address.longitude) : null,

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
  // CLOSE DROPDOWNS
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
  // SEARCH
  // =====================================

  const handleSearch = (event) => {
    const value = event.target.value;

    setSearchQuery(value);

    window.dispatchEvent(
      new CustomEvent("organigoSearch", {
        detail: value,
      })
    );
  };

  // =====================================
// ORGANIGO VOICE SEARCH
// =====================================

const startVoiceSearch = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setVoiceSupported(false);
    alert("Voice search is not supported in this browser. Please use Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "hi-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognitionRef.current = recognition;

  recognition.onstart = () => {
    setIsListening(true);
  };

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript.trim();

    setSearchQuery(spokenText);

    window.dispatchEvent(
      new CustomEvent("organigoSearch", {
        detail: spokenText,
      })
    );
  };

  recognition.onerror = (event) => {
    console.error("Voice Search Error:", event.error);

    if (event.error === "not-allowed") {
      alert("Please allow microphone permission to use voice search.");
    } else if (event.error !== "no-speech") {
      alert("Voice search failed. Please try again.");
    }
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognition.start();
};

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Recognition may already have stopped.
        }
      }
    };
  }, []);

  // =====================================
  // REFRESH DELIVERY SETTINGS
  // =====================================

  useEffect(() => {
    const refreshSettings = () => {
      const newSettings = getHubSettings();
      const saved = getSavedLocation();

      if (
        saved?.latitude != null &&
        saved?.longitude != null
      ) {
        const distance = getDistanceKm(
          Number(newSettings.latitude),
          Number(newSettings.longitude),
          Number(saved.latitude),
          Number(saved.longitude)
        );

        const updated = {
          ...saved,
          distance: Number(distance.toFixed(2)),
          available:
            newSettings.active !== false &&
            distance <= Number(newSettings.radius || 10),
        };

        localStorage.setItem(
          "organigoSelectedLocation",
          JSON.stringify(updated)
        );

        setSelectedLocation(updated);
      }
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
  // SAVE LOCATION
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
  // SELECT SAVED ADDRESS
  // =====================================

  const selectSavedAddress = async (address) => {
    const token = getToken();

    if (!token) {
      setLocationMessage(
        "Please login to select a saved address."
      );
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
        ].filter(Boolean).join(", "),

        fullAddress: [
          selected.houseNo,
          selected.area,
          selected.landmark,
          selected.city,
          selected.state,
          selected.pincode,
        ].filter(Boolean).join(", "),

        latitude: hasCoordinates ? Number(selected.latitude) : null,
        longitude: hasCoordinates ? Number(selected.longitude) : null,

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

    const name = [
      address.road,
      address.suburb || address.neighbourhood,
      address.city || address.town || address.village,
      address.state,
      address.postcode,
    ].filter(Boolean).join(", ") || place.display_name;

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
  // REQUEST ADDRESS ON WHATSAPP
  // =====================================

  const requestAddressOnWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi! I want to place an order on ORGANIGO. Please share your delivery address or live location with me so I can use it for delivery."
    );

    window.open(
      `https://wa.me/?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =====================================
  // DELIVERY INFORMATION
  // =====================================

  const deliveryText = selectedLocation
    ? selectedLocation.available === true
      ? "Delivery Available"
      : selectedLocation.available === false
        ? "Delivery Not Available"
        : "Verify Location"
    : "Select Location";

  const displayDistance =
    selectedLocation?.distance != null
      ? Number(selectedLocation.distance) < 1
        ? `${Math.round(
            Number(selectedLocation.distance) * 1000
          )} m away`
        : `${Number(selectedLocation.distance).toFixed(1)} km away`
      : "Set delivery location";

  // =====================================
  // HEADER UI
  // =====================================

  return (
    <header className="Organigo-header">

      {/* APP BANNER */}

      {appBannerVisible && (
        <div className="organigo-app-banner">

          <div className="app-banner-icon">🥬</div>

          <div className="app-banner-text">
            <strong>ORGANIGO APP</strong>
            <small>Get a fresher shopping experience!</small>
          </div>

          <button
            className="app-download-button"
            type="button"
            disabled
          >
            Coming Soon
          </button>

          <button
            type="button"
            className="app-banner-close"
            onClick={closeAppBanner}
            aria-label="Close app announcement"
          >
            ✕
          </button>

        </div>
      )}

      {/* HEADER CONTAINER - IMPORTANT */}

      <div className="header-container">

        {/* ORGANIGO LOGO */}

        <Link to="/" className="organigo-header-logo">
          <img
            src="/organigo_logo.svg"
            alt="ORGANIGO"
            className="organigo-header-logo-image"
          />
        </Link>

        {/* DELIVERY LOCATION BAR */}

        <button
          type="button"
          className="organigo-location-bar"
          onClick={() => {
            setLocationOpen(true);
            setLocationMessage("");
            setAccountOpen(false);

            if (user) {
              loadSavedAddresses();
            }
          }}
        >

          <div className="organigo-location-details">

            <LocationIcon className="organigo-pin-icon" />

            <div className="organigo-location-address">

              <span>
                {selectedLocation
                  ? "DELIVERING TO"
                  : "DELIVERY LOCATION"}
              </span>

              <strong>
                {selectedLocation?.name
                  ? selectedLocation.name
                      .split(",")
                      .slice(0, 2)
                      .join(", ")
                  : "Choose your delivery address"}
              </strong>

            </div>

            <span className="organigo-location-chevron">
              ⌄
            </span>

          </div>

          <div className="organigo-delivery-status">

            <span
              className={
                selectedLocation?.available === true
                  ? "status-available"
                  : selectedLocation?.available === false
                    ? "status-unavailable"
                    : "status-pending"
              }
            >
              {deliveryText}
            </span>

            {selectedLocation?.distance != null && (
              <small>{displayDistance}</small>
            )}

          </div>

        </button>

       {/* ORGANIGO SEARCH BAR */}

<div className="header-search">

  <svg
    className="header-search-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>

  <input
    id="organigo-search"
    name="search"
    type="search"
    placeholder="Search fruits, vegetables, juice..."
    value={searchQuery}
    onChange={handleSearch}
    aria-label="Search ORGANIGO products"
  />

  {searchQuery && (
    <button
      type="button"
      className="header-search-clear"
      onClick={() => {
        setSearchQuery("");
        window.dispatchEvent(
          new CustomEvent("organigoSearch", {
            detail: "",
          })
        );
      }}
      aria-label="Clear search"
    >
      ✕
    </button>
  )}

  <button
    type="button"
    className={`header-search-mic ${isListening ? "listening" : ""}`}
    onClick={startVoiceSearch}
    disabled={isListening}
    aria-label="Search using voice"
    title="Voice Search"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <path d="M12 19v3M8 22h8" />
    </svg>
  </button>

</div>

        {/* CART */}

        <Link
          to="/cart"
          className={`header-cart ${
            cartCount > 0 ? "has-items" : "is-empty"
          }`}
          aria-label={`Cart: ${cartCount} items, total ₹${Number(
            cartTotal || 0
          ).toFixed(0)}`}
        >

          <span className="header-cart-icon-wrapper">

            <svg
              className="header-cart-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>

            {cartCount > 0 && (
              <span className="header-cart-badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}

          </span>

          <span className="header-cart-info">

            <span className="header-cart-label">
              MY CART
            </span>

            <span className="header-cart-bottom">

              <strong className="header-cart-count">
                {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </strong>

              <span className="header-cart-divider">|</span>

              <strong className="header-cart-total">
                ₹{Number(cartTotal || 0).toFixed(0)}
              </strong>

            </span>

          </span>

          <span className="header-cart-arrow">›</span>

        </Link>

        {/* ACCOUNT */}

        <div className="header-account" ref={accountRef}>

          <button
            type="button"
            className="header-account-button"
            aria-label="My Account"
            aria-expanded={accountOpen}
            onClick={() => {
              if (!user) {
                navigate("/login");
                return;
              }

              setAccountOpen((prev) => !prev);
            }}
          >

            <span className="account-icon">

              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>

            </span>

          </button>

          {user && accountOpen && (

            <div className="account-dropdown">

              <div className="account-dropdown-heading">

                <strong>
                  {user.name || "ORGANIGO Customer"}
                </strong>

                <small>{user.phone || ""}</small>

              </div>

              <Link
                to="/my-orders"
                onClick={() => setAccountOpen(false)}
              >
                My Orders
              </Link>

              <Link
                to="/addresses"
                onClick={() => setAccountOpen(false)}
              >
                Address Book
              </Link>

              <Link
                to="/account"
                onClick={() => setAccountOpen(false)}
              >
                Account & Privacy
              </Link>

              <button
                type="button"
                className="account-logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          )}

        </div>

        {/* DESKTOP LOGIN */}

        <Link
          to={user ? "/account" : "/login"}
          className="header-login"
        >
          {user ? "My Account" : "Login"}
        </Link>

        {/* ORGANIGO LOCATION SELECTOR */}
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
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="location-modal-close"
                aria-label="Close location dialog"
                onClick={() => setLocationOpen(false)}
              >
                ×
              </button>

              <div className="location-modal-heading">
                <div>
                  <h2 id="location-modal-title">Select your Location</h2>
                  <p>Choose where you want your order delivered.</p>
                </div>
                <img
                  className="location-modal-logo"
                  src="/organigo_logo.svg"
                  alt="ORGANIGO"
                />
              </div>

              {/* ADDRESS SEARCH - FIRST */}
              <div className="location-search-box">
                <LocationIcon />
                <input
                  type="text"
                  id="organigo-location-search"
                  name="deliveryLocation"
                  placeholder="Search delivery location"
                  value={locationQuery}
                  autoComplete="off"
                  onChange={(event) => {
                    setLocationQuery(event.target.value);
                    setLocationMessage("");
                  }}
                />
                {locationQuery && (
                  <button
                    type="button"
                    className="location-search-clear"
                    aria-label="Clear location search"
                    onClick={() => {
                      setLocationQuery("");
                      setLocationResults([]);
                      setLocationMessage("");
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {locationLoading && (
                <p className="location-loading">
                  Finding your location...
                </p>
              )}

              {locationMessage && (
                <p className="location-error">{locationMessage}</p>
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
                      <LocationIcon className="modern-location-icon" />
                      <div>
                        <strong>
                          {place.name || place.display_name.split(",")[0]}
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

              {/* GPS ACTION */}
              <button
                type="button"
                className="use-current-location-btn"
                onClick={useCurrentLocation}
                disabled={locationLoading}
              >
                <LocationIcon />
                {locationLoading ? "Detecting current location..." : "Use current location"}
              </button>

              {selectedLocation && (
                <div className="current-selected-location">
                  <strong>Currently selected location</strong>
                  <p>{selectedLocation.name}</p>
                  <small>
                    {selectedLocation.available === true
                      ? `✓ Delivery available · ${selectedLocation.distance} km from hub`
                      : selectedLocation.available === false
                        ? `✕ Outside delivery area · ${selectedLocation.distance} km from hub`
                        : "Location coordinates need verification."}
                  </small>
                </div>
              )}

              {/* SAVED ADDRESSES */}
              <section className="saved-addresses-section">
                <div className="saved-addresses-heading">
                  <strong className="address-section-heading">
                    Your saved addresses
                  </strong>
                  {user && (
                    <Link
                      to="/addresses"
                      onClick={() => setLocationOpen(false)}
                    >
                      + Add new address
                    </Link>
                  )}
                </div>

                {!user ? (
                  <div className="location-login-prompt">
                    <p>Login to view and select your saved addresses.</p>
                    <Link to="/login" onClick={() => setLocationOpen(false)}>
                      Login to your account
                    </Link>
                  </div>
                ) : addressesLoading ? (
                  <p className="location-loading">Loading your saved addresses...</p>
                ) : savedAddresses.length > 0 ? (
                  <div className="saved-addresses-list">
                    {savedAddresses.map((address) => (
                      <button
                        type="button"
                        key={address._id}
                        className={`saved-address-item ${
                          selectedAddressId === address._id ? "selected" : ""
                        }`}
                        onClick={() => selectSavedAddress(address)}
                        disabled={selectingAddressId !== null}
                      >
                        <span className="saved-address-icon">
                          {address.label === "Work" ? "▣" : "⌂"}
                        </span>
                        <div className="saved-address-details">
                          <strong>
                            {address.label || "Home"}
                            {selectedAddressId === address._id ? " ✓" : ""}
                          </strong>
                          <small>
                            {[
                              address.houseNo,
                              address.area,
                              address.landmark,
                              address.city,
                              address.state,
                              address.pincode,
                            ].filter(Boolean).join(", ")}
                          </small>
                        </div>
                        {selectingAddressId === address._id && (
                          <span className="address-saving">Saving...</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="location-no-results">
                    You have not saved any address yet. Add an address to use it later.
                  </p>
                )}
              </section>

              <button
                type="button"
                className="request-address-btn"
                onClick={requestAddressOnWhatsApp}
              >
                <span className="request-address-icon">↗</span>
                <span>Request address from someone else</span>
                <span className="request-address-arrow">›</span>
              </button>

              <p className="location-modal-footer">
                Delivery availability is checked using your selected location and ORGANIGO delivery radius.
              </p>
            </div>
          </div>
        )}

      </div>

    </header>
  );
}

export default Header;