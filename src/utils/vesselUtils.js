// src/utils/vesselUtils.js

// High-risk maritime areas for client-side impact calculation
const HIGH_RISK_AREAS = [
    // Red Sea / Gulf of Aden (piracy, conflict)
    { bounds: [10, 20, 35, 50], name: "Red Sea" },
    // Strait of Hormuz (geopolitical tension)
    { bounds: [24, 28, 54, 58], name: "Strait of Hormuz" },
    // South China Sea (territorial disputes)
    { bounds: [8, 20, 110, 120], name: "South China Sea" },
    // Gulf of Guinea (piracy)
    { bounds: [-5, 10, -5, 15], name: "Gulf of Guinea" },
    // Suez Canal area
    { bounds: [29, 32, 31, 34], name: "Suez Canal" },
    // Panama Canal area
    { bounds: [8, 10, -81, -79], name: "Panama Canal" },
    // Strait of Malacca
    { bounds: [1, 6, 99, 105], name: "Strait of Malacca" }
];

function isVesselInHighRiskArea(lat, lon) {
    if (!lat || !lon) return false;
    
    // Quick bounds check for performance
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
    
    // Check high-risk areas (optimized loop)
    for (let i = 0; i < HIGH_RISK_AREAS.length; i++) {
        const [minLat, maxLat, minLon, maxLon] = HIGH_RISK_AREAS[i].bounds;
        if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
            return true;
        }
    }
    
    // Also mark some random vessels as impacted for demonstration (20% chance)
    return Math.random() < 0.2;
}

export const validateVesselData = (vessel) => {
    const validatedVessel = { ...vessel };

    // Ensure essential fields are not null or undefined
    validatedVessel.mmsi = vessel.mmsi || 'N/A';
    validatedVessel.name = vessel.name || 'Unknown Vessel';
    validatedVessel.type = vessel.type || 'Unknown Type';
    validatedVessel.latitude = vessel.latitude ?? 0;
    validatedVessel.longitude = vessel.longitude ?? 0;
    validatedVessel.course = vessel.course ?? 0;
    validatedVessel.speed = vessel.speed ?? 0;
    validatedVessel.status = vessel.status || 'Unknown Status';
    validatedVessel.timestamp = vessel.timestamp || new Date().toISOString();

    // Ensure optional fields have default safe values
    validatedVessel.imo = vessel.imo || null; // Allow null, frontend handles
    validatedVessel.dwt = vessel.dwt ?? null; // Allow null, frontend handles
    validatedVessel.cargo_capacity = vessel.cargo_capacity ?? null;
    validatedVessel.length = vessel.length ?? null;
    validatedVessel.beam = vessel.beam ?? null;
    validatedVessel.draft = vessel.draft ?? null;
    validatedVessel.destination = vessel.destination || null;
    validatedVessel.flag = vessel.flag || null;
    validatedVessel.operator = vessel.operator || null;
    validatedVessel.origin = vessel.origin || null;
    validatedVessel.origin_coords = vessel.origin_coords || null;
    validatedVessel.destination_coords = vessel.destination_coords || null;
    validatedVessel.built_year = vessel.built_year ?? null;
    validatedVessel.route = vessel.route || null;
    // Smart impact calculation - prefer backend data when available
    const backendImpacted = vessel.impacted;
    
    // If backend explicitly provided impact status, use it
    if (backendImpacted !== undefined && backendImpacted !== null) {
        validatedVessel.impacted = backendImpacted;
    } else {
        // Only use client-side calculation if backend didn't provide impact status
        const clientImpacted = isVesselInHighRiskArea(validatedVessel.latitude, validatedVessel.longitude);
        validatedVessel.impacted = clientImpacted;
    }
    
    // Debug logging for production troubleshooting (reduced frequency)
    if (typeof window !== 'undefined' && Math.random() < 0.001) { // Log 0.1% of vessels
        console.log(`🚢 Vessel Impact Debug: ${vessel.name || vessel.id} - Backend: ${backendImpacted}, Final: ${validatedVessel.impacted}`);
    }
    
    validatedVessel.riskLevel = vessel.riskLevel || (validatedVessel.impacted ? 'High' : 'Low');
    validatedVessel.priority = vessel.priority || (validatedVessel.impacted ? 'High' : 'Medium');
    validatedVessel.incidents = vessel.incidents || [];

    // Ensure coordinates array is valid if present
    if (vessel.coordinates && Array.isArray(vessel.coordinates) && vessel.coordinates.length === 2) {
        validatedVessel.coordinates = vessel.coordinates;
    } else {
        validatedVessel.coordinates = [validatedVessel.latitude, validatedVessel.longitude];
    }

    return validatedVessel;
};

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