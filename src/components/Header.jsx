import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import "../styles/Header.css";

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

    return saved
      ? { ...defaultHub, ...saved }
      : defaultHub;
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

function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { cartItems } = useCart();

  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(getSavedLocation);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [hubSettings, setHubSettings] = useState(getHubSettings);

  const cartCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  // PRODUCT SEARCH
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    window.dispatchEvent(
      new CustomEvent("organigoSearch", {
        detail: value,
      })
    );
  };

  // REFRESH ADMIN DELIVERY SETTINGS
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

  // CHECK DELIVERY DISTANCE
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

  // SAVE CUSTOMER LOCATION
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

  // SEARCH ADDRESS USING OPENSTREETMAP
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

  // SELECT MANUAL ADDRESS
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

  // GET CURRENT GPS LOCATION
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

  const deliveryText = selectedLocation
    ? selectedLocation.available
      ? "Delivery Available"
      : "Not Available"
    : "Select Location";

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

        <a href="/" className="Organigo-logo">
          <img src="/organigo-logo.png" alt="ORGANIGO" />
        </a>

        {/* LOCATION BUTTON */}

        <button
          type="button"
          className="delivery-location"
          onClick={() => {
            setLocationOpen(true);
            setLocationMessage("");
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
                  selectedLocation.available
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

        {/* PRODUCT SEARCH */}

        <div className="header-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search fruits, vegetables, juice..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="hygiene-badge">
          <span className="hygiene-icon">🛡️</span>

          <div>
            <strong>100% SANITIZED</strong>
            <small>SAFE & HYGIENIC HUB</small>
          </div>
        </div>

        {/* CART */}

        <a href="/cart" className="header-cart">
          <span className="cart-icon">🛒</span>
          <span>My Cart</span>

          {cartCount > 0 && (
            <span className="cart-count">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </a>

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

            {/* GPS BUTTON */}

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

            {/* SEARCH RESULTS */}

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

            {selectedLocation && (
              <div className="current-selected-location">
                <strong>Previously selected location</strong>

                <p>{selectedLocation.name}</p>

                <small>
                  {selectedLocation.available
                    ? `✓ Delivery available · ${selectedLocation.distance} KM from hub`
                    : `✕ Outside delivery area · ${selectedLocation.distance} KM from hub`}
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