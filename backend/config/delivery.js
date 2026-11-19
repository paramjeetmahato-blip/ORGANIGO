// =================================
// ORGANIGO DELIVERY CONFIGURATION
// =================================

// Chaibasa Delivery Hub
const DELIVERY_HUB = {
  latitude: 22.5504,
  longitude: 85.8025,
};

// Maximum Delivery Radius (KM)
const MAX_DELIVERY_RADIUS_KM = 10;

// =================================
// CALCULATE DISTANCE USING HAVERSINE
// =================================

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;

  const toRadians = (degree) => {
    return (degree * Math.PI) / 180;
  };

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

module.exports = {
  DELIVERY_HUB,
  MAX_DELIVERY_RADIUS_KM,
  calculateDistance,
};