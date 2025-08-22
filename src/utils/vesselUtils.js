// Vessel data utility functions
// Provides safe access to vessel properties with null/undefined handling

/**
 * Safely format DWT (Deadweight Tonnage) with proper null handling
 * @param {Object} vessel - The vessel object
 * @returns {string} Formatted DWT or 'N/A'
 */
export const formatDWT = (vessel) => {
  if (!vessel || vessel.dwt === null || vessel.dwt === undefined || isNaN(vessel.dwt)) {
    return 'N/A';
  }
  return vessel.dwt.toLocaleString();
};

/**
 * Safely get vessel property with fallback
 * @param {Object} vessel - The vessel object
 * @param {string} property - Property name
 * @param {any} fallback - Fallback value
 * @returns {any} Property value or fallback
 */
export const getVesselProperty = (vessel, property, fallback = 'N/A') => {
  if (!vessel || vessel[property] === null || vessel[property] === undefined) {
    return fallback;
  }
  return vessel[property];
};

/**
 * Safely format numeric vessel properties
 * @param {Object} vessel - The vessel object
 * @param {string} property - Property name
 * @param {string} fallback - Fallback value
 * @returns {string} Formatted number or fallback
 */
export const formatVesselNumber = (vessel, property, fallback = 'N/A') => {
  const value = getVesselProperty(vessel, property, null);
  if (value === null || isNaN(value)) {
    return fallback;
  }
  return Number(value).toLocaleString();
};

/**
 * Validate vessel data structure
 * @param {Object} vessel - The vessel object
 * @returns {boolean} True if vessel has minimum required data
 */
export const isValidVessel = (vessel) => {
  if (!vessel) return false;
  
  // Check for required fields
  const hasCoordinates = vessel.coordinates || (vessel.latitude && vessel.longitude);
  const hasIdentifier = vessel.mmsi || vessel.imo || vessel.id;
  const hasName = vessel.name;
  
  return hasCoordinates && hasIdentifier && hasName;
};

/**
 * Get safe vessel coordinates
 * @param {Object} vessel - The vessel object
 * @returns {Object|null} {lat, lng} or null if invalid
 */
export const getVesselCoordinates = (vessel) => {
  if (!vessel) return null;
  
  let lat, lng;
  
  if (vessel.coordinates) {
    if (Array.isArray(vessel.coordinates) && vessel.coordinates.length === 2) {
      [lat, lng] = vessel.coordinates;
    } else if (vessel.coordinates.lat && vessel.coordinates.lng) {
      lat = vessel.coordinates.lat;
      lng = vessel.coordinates.lng;
    }
  } else if (vessel.latitude && vessel.longitude) {
    lat = vessel.latitude;
    lng = vessel.longitude;
  }
  
  // Validate coordinates
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  // Check if coordinates are within valid ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  
  return { lat: Number(lat), lng: Number(lng) };
};
// Provides safe access to vessel properties with null/undefined handling

/**
 * Safely format DWT (Deadweight Tonnage) with proper null handling
 * @param {Object} vessel - The vessel object
 * @returns {string} Formatted DWT or 'N/A'
 */
export const formatDWT = (vessel) => {
  if (!vessel || vessel.dwt === null || vessel.dwt === undefined || isNaN(vessel.dwt)) {
    return 'N/A';
  }
  return vessel.dwt.toLocaleString();
};

/**
 * Safely get vessel property with fallback
 * @param {Object} vessel - The vessel object
 * @param {string} property - Property name
 * @param {any} fallback - Fallback value
 * @returns {any} Property value or fallback
 */
export const getVesselProperty = (vessel, property, fallback = 'N/A') => {
  if (!vessel || vessel[property] === null || vessel[property] === undefined) {
    return fallback;
  }
  return vessel[property];
};

/**
 * Safely format numeric vessel properties
 * @param {Object} vessel - The vessel object
 * @param {string} property - Property name
 * @param {string} fallback - Fallback value
 * @returns {string} Formatted number or fallback
 */
export const formatVesselNumber = (vessel, property, fallback = 'N/A') => {
  const value = getVesselProperty(vessel, property, null);
  if (value === null || isNaN(value)) {
    return fallback;
  }
  return Number(value).toLocaleString();
};

/**
 * Validate vessel data structure
 * @param {Object} vessel - The vessel object
 * @returns {boolean} True if vessel has minimum required data
 */
export const isValidVessel = (vessel) => {
  if (!vessel) return false;
  
  // Check for required fields
  const hasCoordinates = vessel.coordinates || (vessel.latitude && vessel.longitude);
  const hasIdentifier = vessel.mmsi || vessel.imo || vessel.id;
  const hasName = vessel.name;
  
  return hasCoordinates && hasIdentifier && hasName;
};

/**
 * Get safe vessel coordinates
 * @param {Object} vessel - The vessel object
 * @returns {Object|null} {lat, lng} or null if invalid
 */
export const getVesselCoordinates = (vessel) => {
  if (!vessel) return null;
  
  let lat, lng;
  
  if (vessel.coordinates) {
    if (Array.isArray(vessel.coordinates) && vessel.coordinates.length === 2) {
      [lat, lng] = vessel.coordinates;
    } else if (vessel.coordinates.lat && vessel.coordinates.lng) {
      lat = vessel.coordinates.lat;
      lng = vessel.coordinates.lng;
    }
  } else if (vessel.latitude && vessel.longitude) {
    lat = vessel.latitude;
    lng = vessel.longitude;
  }
  
  // Validate coordinates
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  // Check if coordinates are within valid ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  
  return { lat: Number(lat), lng: Number(lng) };
};
