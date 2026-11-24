function DeliverySettings({
  deliverySettings,
  handleDeliveryChange,
  saveDeliverySettings,
  settingsMessage,
  openHubMap,
}) {
  return (
    <section className="delivery-settings-container">

      {/* HEADING */}
      <div className="delivery-settings-heading">
        <div>
          <h2>🚚 Delivery Settings</h2>
          <p>Manage your business address and delivery area.</p>
        </div>

        <span
          className={
            deliverySettings.active
              ? "delivery-active-badge"
              : "delivery-inactive-badge"
          }
        >
          {deliverySettings.active ? "● Active" : "● Inactive"}
        </span>
      </div>

      <form onSubmit={saveDeliverySettings}>

        {/* HUB INFORMATION */}
        <div className="delivery-settings-note">
          <strong>📍 Current Hub Location</strong>
          <p>
            This address is used as the ORGANIGO delivery centre.
            You can update it whenever your business location changes.
          </p>
        </div>

        {/* ADDRESS FORM */}
        <div className="form-grid">

          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              name="businessName"
              value={deliverySettings.businessName}
              onChange={handleDeliveryChange}
              required
            />
          </div>

          <div className="form-group">
            <label>PIN Code</label>
            <input
              type="text"
              name="pincode"
              value={deliverySettings.pincode}
              onChange={handleDeliveryChange}
              maxLength="6"
            />
          </div>

          <div className="form-group full-width">
            <label>Complete Hub Address</label>
            <textarea
              name="address"
              value={deliverySettings.address}
              onChange={handleDeliveryChange}
              placeholder="Enter shop, building, street or area address..."
              required
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={deliverySettings.city}
              onChange={handleDeliveryChange}
              required
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              name="state"
              value={deliverySettings.state}
              onChange={handleDeliveryChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Latitude</label>
            <input
              type="number"
              name="latitude"
              step="any"
              value={deliverySettings.latitude}
              onChange={handleDeliveryChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Longitude</label>
            <input
              type="number"
              name="longitude"
              step="any"
              value={deliverySettings.longitude}
              onChange={handleDeliveryChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Delivery Radius (KM)</label>
            <input
              type="number"
              name="radius"
              min="1"
              step="0.5"
              value={deliverySettings.radius}
              onChange={handleDeliveryChange}
              required
            />

            <small className="field-help">
              Example: 10 KM delivery radius around your hub.
            </small>
          </div>

        </div>

        {/* DELIVERY TOGGLE */}
        <div className="delivery-service-toggle">
          <div>
            <strong>Delivery Service</strong>
            <p>Turn delivery service on or off.</p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              name="active"
              checked={deliverySettings.active}
              onChange={handleDeliveryChange}
            />
            <span className="slider" />
          </label>
        </div>

        {/* MAP PREVIEW */}
        <div className="delivery-map-preview">
          <div>
            <strong>📍 Hub Map Location</strong>
            <p>
              {deliverySettings.city}, {deliverySettings.state}
            </p>
          </div>

          <button
            type="button"
            onClick={openHubMap}
            className="view-hub-map-btn"
          >
            View on Google Maps ↗
          </button>
        </div>

        {/* SUCCESS MESSAGE */}
        {settingsMessage && (
          <div className="settings-success-message">
            ✓ {settingsMessage}
          </div>
        )}

        {/* SAVE BUTTON */}
        <button
          type="submit"
          className="save-delivery-settings-btn"
        >
          💾 Save Delivery Settings
        </button>

      </form>
    </section>
  );
}

export default DeliverySettings;