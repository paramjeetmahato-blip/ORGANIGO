// ==========================================
// ORGANIGO - CENTRAL API CONFIGURATION
// ==========================================

const fallbackApiUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || fallbackApiUrl
).replace(/\/+$/, "");

export default API_BASE_URL;