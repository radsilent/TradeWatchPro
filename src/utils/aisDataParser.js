// AIS Data Parser for Spire Maritime Data
import Papa from 'papaparse';

// Ship type codes mapping
const SHIP_TYPE_CODES = {
  70: 'Cargo',
  71: 'Cargo',
  72: 'Cargo',
  73: 'Cargo',
  74: 'Cargo',
  75: 'Cargo',
  76: 'Cargo',
  77: 'Cargo',
  78: 'Cargo',
  79: 'Cargo',
  80: 'Tanker',
  81: 'Tanker',
  82: 'Tanker',
  83: 'Tanker',
  84: 'Tanker',
  85: 'Tanker',
  86: 'Tanker',
  87: 'Tanker',
  88: 'Tanker',
  89: 'Tanker',
  90: 'Fishing',
  91: 'Fishing',
  92: 'Fishing',
  93: 'Fishing',
  94: 'Fishing',
  95: 'Fishing',
  96: 'Fishing',
  97: 'Fishing',
  98: 'Fishing',
  99: 'Fishing',
  100: 'Passenger',
  101: 'Passenger',
  102: 'Passenger',
  103: 'Passenger',
  104: 'Passenger',
  105: 'Passenger',
  106: 'Passenger',
  107: 'Passenger',
  108: 'Passenger',
  109: 'Passenger',
  110: 'High Speed Craft',
  111: 'High Speed Craft',
  112: 'High Speed Craft',
  113: 'High Speed Craft',
  114: 'High Speed Craft',
  115: 'High Speed Craft',
  116: 'High Speed Craft',
  117: 'High Speed Craft',
  118: 'High Speed Craft',
  119: 'High Speed Craft'
};

// Parse CSV data
export const parseAISData = (csvText) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const vessels = results.data.map((row, index) => ({
            id: `${row.mmsi}-${index}`,
            mmsi: row.mmsi,
            name: row.name || 'Unknown Vessel',
            callSign: row.call_sign || 'N/A',
            flag: row.flag || 'Unknown',
            imo: row.imo || 'N/A',
            coordinates: {
              lat: parseFloat(row.latitude),
              lng: parseFloat(row.longitude)
            },
            speed: parseFloat(row.speed) || 0,
            course: parseFloat(row.course) || 0,
            heading: parseFloat(row.heading) || 0,
            draught: parseFloat(row.draught) || 0,
            length: parseFloat(row.length) || 0,
            width: parseFloat(row.width) || 0,
            shipType: SHIP_TYPE_CODES[row.ship_type_code] || 'Unknown',
            shipTypeCode: parseInt(row.ship_type_code) || 0,
            destination: row.destination || 'Unknown',
            eta: row.eta ? new Date(row.eta) : null,
            status: parseInt(row.status) || 0,
            maneuver: parseInt(row.maneuver) || 0,
            accuracy: parseInt(row.accuracy) || 0,
            rot: parseFloat(row.rot) || 0,
            collectionType: row.collection_type || 'unknown',
            timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
            positionUpdatedAt: row.position_updated_at ? new Date(row.position_updated_at) : new Date(),
            staticUpdatedAt: row.static_updated_at ? new Date(row.static_updated_at) : new Date()
          })).filter(vessel => 
            vessel.coordinates.lat && 
            vessel.coordinates.lng && 
            !isNaN(vessel.coordinates.lat) && 
            !isNaN(vessel.coordinates.lng)
          );

          resolve(vessels);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Get vessel status description
export const getVesselStatus = (statusCode) => {
  const statuses = {
    0: 'Underway using engine',
    1: 'At anchor',
    2: 'Not under command',
    3: 'Restricted maneuverability',
    4: 'Constrained by her draught',
    5: 'Moored',
    6: 'Aground',
    7: 'Engaged in fishing',
    8: 'Underway sailing',
    9: 'Reserved for future amendment of Navigational Status for ships carrying DG, HS, or MP, or IMO hazard or pollutant category C, high speed craft (HSC)',
    10: 'Reserved for future amendment of Navigational Status for ships carrying dangerous goods (DG), harmful substances (HS) or marine pollutants (MP), or IMO hazard or pollutant category A, wing in ground (WIG)',
    11: 'Reserved for future amendment of Navigational Status for ships carrying DG, HS, or MP, or IMO hazard or pollutant category A, WIG',
    12: 'Reserved for future amendment of Navigational Status for ships carrying DG, HS, or MP, or IMO hazard or pollutant category A, WIG',
    13: 'Reserved for future amendment of Navigational Status for ships carrying DG, HS, or MP, or IMO hazard or pollutant category A, WIG',
    14: 'AIS-SART (active)',
    15: 'Not defined (default)'
  };
  return statuses[statusCode] || 'Unknown';
};

// Get vessel maneuver description
export const getVesselManeuver = (maneuverCode) => {
  const maneuvers = {
    0: 'Not available (default)',
    1: 'No special maneuver',
    2: 'Special maneuver (such as regional passing arrangement)'
  };
  return maneuvers[maneuverCode] || 'Unknown';
};

// Get vessel color based on type
export const getVesselColor = (shipType) => {
  const colors = {
    'Cargo': '#3b82f6', // Blue
    'Tanker': '#ef4444', // Red
    'Fishing': '#10b981', // Green
    'Passenger': '#f59e0b', // Orange
    'High Speed Craft': '#8b5cf6', // Purple
    'Unknown': '#6b7280' // Gray
  };
  return colors[shipType] || colors['Unknown'];
};

// Get vessel size based on length
export const getVesselSize = (length) => {
  if (length > 300) return 12; // Large vessels
  if (length > 150) return 10; // Medium vessels
  if (length > 50) return 8; // Small vessels
  return 6; // Very small vessels
};

// Calculate vessel heading arrow
export const getVesselHeading = (heading, speed) => {
  if (speed < 1) return null; // No heading for stationary vessels
  
  const rad = (heading * Math.PI) / 180;
  const arrowLength = Math.min(speed * 2, 20); // Scale arrow length with speed
  
  return {
    x: Math.sin(rad) * arrowLength,
    y: -Math.cos(rad) * arrowLength
  };
};
