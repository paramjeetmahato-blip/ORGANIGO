// =====================================
// ORGANIGO TAB-WISE AUTHENTICATION
// =====================================

// GET CURRENT TAB TOKEN
export const getToken = () => {
  return sessionStorage.getItem("organigoToken");
};

// GET CURRENT TAB USER
export const getUser = () => {
  try {
    return JSON.parse(
      sessionStorage.getItem("organigoUser") || "null"
    );
  } catch {
    return null;
  }
};

// SAVE LOGIN SESSION
export const saveSession = (token, user) => {
  // Remove old shared login data
  localStorage.removeItem("organigoToken");
  localStorage.removeItem("organigoUser");

  // Save only in current browser tab
  sessionStorage.setItem("organigoToken", token);
  sessionStorage.setItem(
    "organigoUser",
    JSON.stringify(user)
  );

  window.dispatchEvent(
    new Event("organigoAuthChanged")
  );
};

// CLEAR CURRENT TAB SESSION
export const clearSession = () => {
  sessionStorage.removeItem("organigoToken");
  sessionStorage.removeItem("organigoUser");

  window.dispatchEvent(
    new Event("organigoAuthChanged")
  );
};