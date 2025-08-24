#!/usr/bin/env python3
"""
AIS Stream Integration Service
Real-time vessel data from https://aisstream.io using WebSocket API
"""

import asyncio
import aiohttp
import json
import logging
import websockets
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import ssl

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AISStreamVessel:
    """AIS Stream vessel data structure"""
    mmsi: str
    imo: Optional[str]
    name: str
    vessel_type: str
    latitude: float
    longitude: float
    course: float
    speed: float
    heading: float
    status: str
    timestamp: datetime
    destination: Optional[str] = None
    eta: Optional[datetime] = None
    length: Optional[int] = None
    width: Optional[int] = None
    draft: Optional[float] = None
    flag: Optional[str] = None
    source: str = "aisstream.io"

class AISStreamIntegration:
    """Real AIS data integration using AIS Stream WebSocket API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.websocket_url = "wss://stream.aisstream.io/v0/stream"
        self.session: Optional[aiohttp.ClientSession] = None
        self.vessel_cache = {}
        self.cache_ttl = 300  # 5 minutes cache
        self.last_update = None
        
        # Areas of interest for targeted data collection
        self.areas_of_interest = [
            {
                "name": "English_Channel",
                "bounds": {
                    "north": 51.0,
                    "south": 49.5,
                    "east": 2.0,
                    "west": -2.0
                }
            },
            {
                "name": "Singapore_Strait", 
                "bounds": {
                    "north": 1.5,
                    "south": 1.0,
                    "east": 104.5,
                    "west": 103.5
                }
            },
            {
                "name": "Suez_Canal",
                "bounds": {
                    "north": 32.0,
                    "south": 29.0,
                    "east": 33.0,
                    "west": 31.0
                }
            },
            {
                "name": "Panama_Canal",
                "bounds": {
                    "north": 10.0,
                    "south": 8.0,
                    "east": -79.0,
                    "west": -81.0
                }
            },
            {
                "name": "Rotterdam_Approaches",
                "bounds": {
                    "north": 52.5,
                    "south": 51.5,
                    "east": 5.0,
                    "west": 3.0
                }
            },
            {
                "name": "Los_Angeles_Approaches",
                "bounds": {
                    "north": 34.5,
                    "south": 33.0,
                    "east": -117.0,
                    "west": -119.0
                }
            }
        ]

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'TradeWatch-AIS-Integration/1.0',
                'Authorization': f'Bearer {self.api_key}'
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def get_real_vessel_data(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Fetch real vessel data from AIS Stream WebSocket
        
        Args:
            limit: Maximum number of vessels to return
            
        Returns:
            List of vessel dictionaries with real AIS data
        """
        try:
            logger.info(f"Fetching real AIS data for {limit} vessels from AIS Stream...")
            
            # Check cache first
            if self._is_cache_valid():
                logger.info("Returning cached AIS Stream data")
                cached_vessels = list(self.vessel_cache.values())
                return [self._convert_to_dict(vessel) for vessel in cached_vessels[:limit]]
            
            # Fetch real data from AIS Stream WebSocket only
            vessels = await self._fetch_via_websocket(limit)
            
            # Update cache
            for vessel in vessels:
                self.vessel_cache[vessel.mmsi] = vessel
            self.last_update = datetime.now()
            
            # Convert to dict format expected by the API
            result_vessels = [self._convert_to_dict(vessel) for vessel in vessels[:limit]]
            
            logger.info(f"Successfully returned {len(result_vessels)} real AIS vessels from AIS Stream")
            return result_vessels
            
        except Exception as e:
            logger.error(f"Error fetching AIS Stream data: {e}")
            # Return empty list instead of fallback - we want real data only
            return []

    async def _fetch_via_rest_api(self, limit: int) -> List[AISStreamVessel]:
        """Fetch vessel data via AIS Stream REST API"""
        vessels = []
        
        try:
            # Fetch vessels from areas of interest
            for area in self.areas_of_interest[:3]:  # Limit to first 3 areas to avoid rate limits
                area_vessels = await self._fetch_area_vessels_rest(area, limit // 3)
                vessels.extend(area_vessels)
                
                if len(vessels) >= limit:
                    break
                    
                # Small delay to respect rate limits
                await asyncio.sleep(0.1)
            
        except Exception as e:
            logger.warning(f"REST API fetch error: {e}")
        
        return vessels[:limit]

    async def _fetch_area_vessels_rest(self, area: Dict, limit: int) -> List[AISStreamVessel]:
        """Fetch vessels in a specific area via REST API"""
        vessels = []
        
        try:
            # Construct API request for area
            bounds = area["bounds"]
            url = f"{self.rest_api_url}/vessels"
            
            params = {
                "north": bounds["north"],
                "south": bounds["south"],
                "east": bounds["east"], 
                "west": bounds["west"],
                "limit": min(limit, 100)  # AIS Stream limit
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Parse vessel data
                    for vessel_data in data.get("vessels", []):
                        vessel = self._parse_aisstream_vessel(vessel_data)
                        if vessel:
                            vessels.append(vessel)
                            
                elif response.status == 401:
                    logger.error("AIS Stream API authentication failed - check API key")
                elif response.status == 429:
                    logger.warning("AIS Stream API rate limit reached")
                    await asyncio.sleep(1)
                else:
                    logger.warning(f"AIS Stream API returned status {response.status}")
                    
        except Exception as e:
            logger.warning(f"Error fetching area {area['name']}: {e}")
        
        return vessels

    async def _fetch_via_websocket(self, limit: int) -> List[AISStreamVessel]:
        """Fetch real-time vessel data via WebSocket"""
        vessels = []
        
        try:
            # Subscribe to global coverage initially, then filter
            subscription = {
                "APIKey": self.api_key,
                "BoundingBoxes": [
                    # Global coverage with some key shipping areas
                    [[-90, -180], [90, 180]]  # Global
                ],
                "FiltersShipMMSI": [],  # No MMSI filter initially
                "FilterMessageTypes": []  # No message type filter initially
            }
            
            # Connect and collect data quickly for web responsiveness
            timeout_duration = 5  # 5 seconds to collect real-time data
            start_time = datetime.now()
            message_count = 0
            
            async with websockets.connect(self.websocket_url) as websocket:
                # Send subscription
                await websocket.send(json.dumps(subscription))
                logger.info("Connected to AIS Stream WebSocket and sent subscription")
                
                # Collect messages for the timeout duration
                while (datetime.now() - start_time).total_seconds() < timeout_duration:
                    try:
                        # Wait for message with timeout
                        message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                        message_count += 1
                        
                        # Log every 100 messages to track progress
                        if message_count % 100 == 0:
                            logger.info(f"Processed {message_count} messages, collected {len(vessels)} vessels")
                        
                        data = json.loads(message)
                        
                        # Debug first few messages to understand format
                        if message_count <= 3:
                            logger.info(f"Sample message {message_count}: {json.dumps(data, indent=2)[:500]}...")
                        
                        # Parse vessel position
                        vessel = self._parse_websocket_message(data)
                        if vessel and len(vessels) < limit:
                            vessels.append(vessel)
                            if len(vessels) <= 10:  # Log first 10 vessels
                                logger.info(f"Added vessel {len(vessels)}: {vessel.mmsi} - {vessel.name}")
                            
                        if len(vessels) >= limit:
                            logger.info(f"Reached target of {limit} vessels, stopping collection")
                            break
                            
                    except asyncio.TimeoutError:
                        # No message received in timeout period, continue
                        if message_count == 0:
                            logger.warning("No messages received yet, continuing to wait...")
                        continue
                    except json.JSONDecodeError as e:
                        # Invalid JSON, skip
                        logger.debug(f"JSON decode error: {e}")
                        continue
                
                logger.info(f"WebSocket session complete: {message_count} messages processed, {len(vessels)} vessels collected")
                        
        except Exception as e:
            logger.warning(f"WebSocket connection error: {e}")
        
        return vessels

    def _parse_aisstream_vessel(self, vessel_data: Dict) -> Optional[AISStreamVessel]:
        """Parse vessel data from AIS Stream REST API response"""
        try:
            # Extract required fields
            mmsi = str(vessel_data.get("mmsi", ""))
            if not mmsi:
                return None
                
            latitude = vessel_data.get("latitude")
            longitude = vessel_data.get("longitude")
            
            if latitude is None or longitude is None:
                return None
            
            vessel = AISStreamVessel(
                mmsi=mmsi,
                imo=vessel_data.get("imo"),
                name=vessel_data.get("ship_name", f"VESSEL_{mmsi}"),
                vessel_type=self._map_vessel_type(vessel_data.get("ship_type", 0)),
                latitude=float(latitude),
                longitude=float(longitude),
                course=float(vessel_data.get("course", 0)),
                speed=float(vessel_data.get("speed", 0)),
                heading=float(vessel_data.get("heading", 0)),
                status=self._map_nav_status(vessel_data.get("nav_status", 0)),
                timestamp=datetime.now(),
                destination=vessel_data.get("destination"),
                length=vessel_data.get("length"),
                width=vessel_data.get("width"),
                draft=vessel_data.get("draft"),
                flag=vessel_data.get("flag")
            )
            
            return vessel
            
        except Exception as e:
            logger.warning(f"Error parsing vessel data: {e}")
            return None

    def _parse_websocket_message(self, data: Dict) -> Optional[AISStreamVessel]:
        """Parse vessel data from AIS Stream WebSocket message"""
        try:
            # Check if this has the expected structure
            if "Message" not in data:
                return None
                
            message = data.get("Message", {})
            
            # Check if this is a PositionReport message
            if "PositionReport" not in message:
                return None
                
            position_report = message["PositionReport"]
            metadata = data.get("MetaData", {})
            
            # Get MMSI
            mmsi = str(position_report.get("UserID", ""))
            if not mmsi or mmsi == "0":
                return None
                
            # Get position
            latitude = position_report.get("Latitude")
            longitude = position_report.get("Longitude")
            
            if latitude is None or longitude is None:
                return None
                
            # Validate coordinates are reasonable
            if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
                return None
            
            # Parse timestamp
            try:
                timestamp_str = metadata.get("time_utc", datetime.now().isoformat())
                if timestamp_str.endswith('Z'):
                    timestamp_str = timestamp_str[:-1]
                timestamp = datetime.fromisoformat(timestamp_str)
            except:
                timestamp = datetime.now()
            
            # Get ship type - may be in different message types, default to 0
            ship_type = position_report.get("ShipType", 0)
            
            # Create vessel name from MMSI if not available
            vessel_name = f"VESSEL_{mmsi}"
            
            vessel = AISStreamVessel(
                mmsi=mmsi,
                imo=None,  # Not always available in position reports
                name=vessel_name,
                vessel_type=self._map_vessel_type(ship_type),
                latitude=float(latitude),
                longitude=float(longitude),
                course=float(position_report.get("Cog", 0)),
                speed=float(position_report.get("Sog", 0)),
                heading=float(position_report.get("TrueHeading", position_report.get("Cog", 0))),
                status=self._map_nav_status(position_report.get("NavigationalStatus", 0)),
                timestamp=timestamp,
                length=None,  # Dimensions not available in position reports
                width=None
            )
            
            return vessel
            
        except Exception as e:
            logger.debug(f"Error parsing WebSocket message: {e}")
            return None

    def _map_vessel_type(self, ship_type: int) -> str:
        """Map AIS ship type code to human readable string"""
        type_mapping = {
            # Cargo ships
            70: "Cargo Ship",
            71: "Cargo Ship - Hazardous",
            72: "Cargo Ship - Hazardous",
            73: "Cargo Ship - Hazardous",
            74: "Cargo Ship - Hazardous",
            
            # Tankers
            80: "Tanker",
            81: "Tanker - Hazardous",
            82: "Tanker - Hazardous", 
            83: "Tanker - Hazardous",
            84: "Tanker - Hazardous",
            
            # Passenger ships
            60: "Passenger Ship",
            61: "Passenger Ship - Hazardous",
            62: "Passenger Ship - Hazardous",
            63: "Passenger Ship - Hazardous",
            64: "Passenger Ship - Hazardous",
            
            # Special vessels
            30: "Fishing Vessel",
            31: "Towing Vessel",
            32: "Towing Vessel",
            33: "Dredger",
            34: "Diving Vessel",
            35: "Military Vessel",
            36: "Sailing Vessel",
            37: "Pleasure Craft"
        }
        
        if ship_type in type_mapping:
            return type_mapping[ship_type]
        elif 70 <= ship_type <= 79:
            return "Cargo Ship"
        elif 80 <= ship_type <= 89:
            return "Tanker"
        elif 60 <= ship_type <= 69:
            return "Passenger Ship"
        else:
            return "Unknown Vessel Type"

    def _map_nav_status(self, status: int) -> str:
        """Map AIS navigation status code to human readable string"""
        status_mapping = {
            0: "Under way using engine",
            1: "At anchor",
            2: "Not under command",
            3: "Restricted maneuverability",
            4: "Constrained by her draught",
            5: "Moored",
            6: "Aground",
            7: "Engaged in fishing",
            8: "Under way sailing",
            9: "Reserved",
            10: "Reserved",
            11: "Power-driven vessel towing astern",
            12: "Power-driven vessel pushing ahead",
            13: "Reserved",
            14: "AIS-SART",
            15: "Undefined"
        }
        
        return status_mapping.get(status, "Unknown")

    def _determine_flag_from_mmsi(self, mmsi: str) -> str:
        """Determine vessel flag/country from MMSI prefix"""
        if not mmsi or len(mmsi) < 3:
            return "Unknown"
            
        # MMSI country codes (first 3 digits)
        mmsi_prefixes = {
            "201": "Albania", "202": "Andorra", "203": "Austria", "204": "Portugal", "205": "Belgium",
            "206": "Belarus", "207": "Bulgaria", "208": "Vatican", "209": "Cyprus", "210": "Cyprus",
            "211": "Germany", "212": "Cyprus", "213": "Georgia", "214": "Moldova", "215": "Malta",
            "216": "Armenia", "218": "Germany", "219": "Denmark", "220": "Denmark", "224": "Spain",
            "225": "Spain", "226": "France", "227": "France", "228": "France", "229": "Malta",
            "230": "Finland", "231": "Faroe Islands", "232": "United Kingdom", "233": "United Kingdom",
            "234": "United Kingdom", "235": "United Kingdom", "236": "Gibraltar", "237": "Greece",
            "238": "Croatia", "239": "Greece", "240": "Greece", "241": "Greece", "242": "Morocco",
            "243": "Hungary", "244": "Netherlands", "245": "Netherlands", "246": "Netherlands",
            "247": "Italy", "248": "Malta", "249": "Malta", "250": "Ireland", "251": "Iceland",
            "252": "Liechtenstein", "253": "Luxembourg", "254": "Monaco", "255": "Portugal",
            "256": "Malta", "257": "Norway", "258": "Norway", "259": "Norway", "261": "Poland",
            "262": "Montenegro", "263": "Portugal", "264": "Romania", "265": "Sweden", "266": "Sweden",
            "267": "Slovak Republic", "268": "San Marino", "269": "Switzerland", "270": "Czech Republic",
            "271": "Turkey", "272": "Ukraine", "273": "Russian Federation", "274": "Macedonia",
            "275": "Latvia", "276": "Estonia", "277": "Lithuania", "278": "Slovenia", "279": "Serbia",
            "301": "Anguilla", "303": "Alaska", "304": "Antigua and Barbuda", "305": "Antigua and Barbuda",
            "306": "Antilles", "307": "Aruba", "308": "Bahamas", "309": "Bahamas", "310": "Bermuda",
            "311": "Bahamas", "312": "Belize", "314": "Barbados", "316": "Canada", "319": "Cayman Islands",
            "321": "Costa Rica", "323": "Cuba", "325": "Dominica", "327": "Dominican Republic",
            "329": "Guadeloupe", "330": "Grenada", "331": "Greenland", "332": "Guatemala", "334": "Honduras",
            "336": "Haiti", "338": "United States", "339": "Jamaica", "341": "Saint Kitts and Nevis",
            "343": "Saint Lucia", "345": "Mexico", "347": "Martinique", "348": "Montserrat",
            "350": "Nicaragua", "351": "Panama", "352": "Panama", "353": "Panama", "354": "Panama",
            "355": "Panama", "356": "Panama", "357": "Panama", "358": "Puerto Rico", "359": "El Salvador",
            "361": "Saint Pierre and Miquelon", "362": "Trinidad and Tobago", "364": "Turks and Caicos Islands",
            "366": "United States", "367": "United States", "368": "United States", "369": "United States",
            "370": "Panama", "371": "Panama", "372": "Panama", "373": "Panama", "374": "Panama",
            "375": "Saint Vincent and the Grenadines", "376": "Saint Vincent and the Grenadines",
            "377": "Saint Vincent and the Grenadines", "378": "British Virgin Islands",
            "401": "Afghanistan", "403": "Saudi Arabia", "405": "Bangladesh", "408": "Bahrain",
            "410": "Bhutan", "412": "China", "413": "China", "414": "China", "416": "Taiwan",
            "417": "Sri Lanka", "419": "India", "422": "Iran", "423": "Azerbaijan", "425": "Iraq",
            "428": "Israel", "431": "Japan", "432": "Japan", "434": "Turkmenistan", "436": "Kazakhstan",
            "437": "Uzbekistan", "438": "Jordan", "440": "South Korea", "441": "South Korea",
            "443": "Palestine", "445": "North Korea", "447": "Kuwait", "450": "Lebanon",
            "451": "Kyrgyzstan", "453": "Macao", "455": "Maldives", "457": "Mongolia", "459": "Nepal",
            "461": "Oman", "463": "Pakistan", "466": "Qatar", "468": "Syria", "470": "United Arab Emirates",
            "472": "Tajikistan", "473": "Yemen", "475": "Yemen", "477": "Hong Kong", "478": "Bosnia and Herzegovina",
            "501": "Antarctica", "503": "Australia", "506": "Myanmar", "508": "Brunei", "510": "Micronesia",
            "511": "Palau", "512": "New Zealand", "514": "Cambodia", "515": "Cambodia", "516": "Christmas Island",
            "518": "Cook Islands", "520": "Fiji", "523": "Cocos Islands", "525": "Indonesia", "529": "Kiribati",
            "531": "Laos", "533": "Malaysia", "536": "Northern Mariana Islands", "538": "Marshall Islands",
            "540": "New Caledonia", "542": "Niue", "544": "Nauru", "546": "French Polynesia",
            "548": "Philippines", "553": "Papua New Guinea", "555": "Pitcairn Island", "557": "Solomon Islands",
            "559": "American Samoa", "561": "Samoa", "563": "Singapore", "564": "Singapore",
            "565": "Singapore", "566": "Singapore", "567": "Thailand", "570": "Tonga", "572": "Tuvalu",
            "574": "Vietnam", "576": "Vanuatu", "577": "Vanuatu", "578": "Wallis and Futuna Islands",
            "601": "South Africa", "603": "Angola", "605": "Algeria", "607": "Saint Paul and Amsterdam Islands",
            "608": "Ascension Island", "609": "Burundi", "610": "Benin", "611": "Botswana", "612": "Central African Republic",
            "613": "Cameroon", "615": "Congo", "616": "Comoros", "617": "Cape Verde", "618": "Antarctica",
            "619": "Ivory Coast", "620": "Comoros", "621": "Djibouti", "622": "Egypt", "624": "Ethiopia",
            "625": "Eritrea", "626": "Gabonese Republic", "627": "Ghana", "629": "Gambia", "630": "Guinea-Bissau",
            "631": "Equatorial Guinea", "632": "Guinea", "633": "Burkina Faso", "634": "Kenya", "635": "Antarctica",
            "636": "Liberia", "637": "Liberia", "638": "South Sudan", "642": "Libya", "644": "Lesotho",
            "645": "Mauritius", "647": "Madagascar", "649": "Mali", "650": "Mozambique", "654": "Mauritania",
            "655": "Malawi", "656": "Niger", "657": "Nigeria", "659": "Namibia", "660": "Reunion",
            "661": "Rwanda", "662": "Sudan", "663": "Senegal", "664": "Seychelles", "665": "Saint Helena",
            "666": "Somalia", "667": "Sierra Leone", "668": "Sao Tome and Principe", "669": "Swaziland",
            "670": "Chad", "671": "Togo", "672": "Tunisia", "674": "Tanzania", "675": "Uganda",
            "676": "Democratic Republic of the Congo", "677": "Tanzania", "678": "Zambia", "679": "Zimbabwe",
            "701": "Argentina", "710": "Brazil", "720": "Bolivia", "725": "Chile", "730": "Colombia",
            "735": "Ecuador", "740": "Falkland Islands", "745": "Guiana", "750": "Guyana", "755": "Paraguay",
            "760": "Peru", "765": "Suriname", "770": "Uruguay", "775": "Venezuela"
        }
        
        prefix = mmsi[:3]
        return mmsi_prefixes.get(prefix, "Unknown")

    def _convert_to_dict(self, vessel: AISStreamVessel) -> Dict[str, Any]:
        """Convert AISStreamVessel to dictionary format expected by API"""
        return {
            "id": f"ais_stream_{vessel.mmsi}",
            "mmsi": vessel.mmsi,
            "imo": vessel.imo,
            "name": vessel.name,
            "type": vessel.vessel_type,
            "coordinates": [vessel.latitude, vessel.longitude],
            "latitude": vessel.latitude,
            "longitude": vessel.longitude,
            "course": vessel.course,
            "speed": vessel.speed,
            "heading": vessel.heading,
            "length": vessel.length,
            "beam": vessel.width,
            "status": vessel.status,
            "destination": vessel.destination,
            "flag": vessel.flag or self._determine_flag_from_mmsi(vessel.mmsi),
            "timestamp": vessel.timestamp.isoformat(),
            "last_updated": vessel.timestamp.isoformat(),
            "draft": vessel.draft,
            "data_source": "AIS Stream (Real-time)",
            "source": vessel.source,
            # Additional fields for compatibility - can be null
            "origin": None,
            "origin_coords": None,
            "destination_coords": None,
            "built_year": None,
            "operator": None,
            "dwt": None,  # Allow null - frontend should handle this
            "cargo_capacity": None,
            "route": "Real-time AIS",
            "impacted": self._calculate_vessel_impact(vessel.latitude, vessel.longitude),
            "riskLevel": self._calculate_risk_level(vessel.latitude, vessel.longitude, vessel.vessel_type),
            "priority": "High" if self._calculate_vessel_impact(vessel.latitude, vessel.longitude) else "Medium"
        }

    def _calculate_vessel_impact(self, lat: float, lng: float) -> bool:
        """Calculate if vessel is impacted by disruptions"""
        disruptions = [
            {"coordinates": [20.0, 38.0], "severity": "high"},      # Red Sea
            {"coordinates": [30.0, 32.0], "severity": "medium"},    # Suez Canal
            {"coordinates": [9.0, -79.5], "severity": "high"},      # Panama Canal
            {"coordinates": [1.3, 103.8], "severity": "medium"}     # Singapore
        ]
        
        for disruption in disruptions:
            distance = self._calculate_distance(lat, lng, 
                                              disruption["coordinates"][0], 
                                              disruption["coordinates"][1])
            
            radius = 750 if disruption["severity"] == "high" else 500
            if distance <= radius:
                return True
        
        return False

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        import math
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Earth radius in kilometers
        return c * r

    def _calculate_risk_level(self, lat: float, lng: float, vessel_type: str) -> str:
        """Calculate risk level based on location and vessel type"""
        # High-risk areas (piracy, conflict zones, extreme weather)
        high_risk_zones = [
            # Gulf of Aden / Red Sea
            {"bounds": (10, 20, 35, 50), "risk": "High"},
            # Strait of Hormuz
            {"bounds": (24, 28, 54, 58), "risk": "High"},
            # South China Sea disputed areas
            {"bounds": (8, 20, 110, 120), "risk": "Medium"},
            # West Africa (piracy)
            {"bounds": (-5, 15, -5, 10), "risk": "High"}
        ]
        
        for zone in high_risk_zones:
            min_lat, max_lat, min_lng, max_lng = zone["bounds"]
            if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
                return zone["risk"]
        
        # Vessel type based risk
        high_risk_types = ["Tanker", "Tanker - Hazardous", "Chemical Tanker", "LNG Carrier"]
        if vessel_type in high_risk_types:
            return "Medium"
        
        return "Low"

    def _is_cache_valid(self) -> bool:
        """Check if cached data is still valid"""
        if not self.vessel_cache or not self.last_update:
            return False
        
        cache_age = datetime.now() - self.last_update
        return cache_age.total_seconds() < self.cache_ttl

# Global instance with API key
aisstream_integration = None

def initialize_aisstream_integration(api_key: str):
    """Initialize the global AIS Stream integration instance"""
    global aisstream_integration
    aisstream_integration = AISStreamIntegration(api_key)
    logger.info("AIS Stream integration initialized with API key")

async def get_real_aisstream_vessels(limit: int = 1000) -> List[Dict[str, Any]]:
    """
    Public function to get real vessel positions from AIS Stream
    """
    if not aisstream_integration:
        logger.error("AIS Stream integration not initialized - call initialize_aisstream_integration() first")
        return []
    
    async with aisstream_integration:
        return await aisstream_integration.get_real_vessel_data(limit)

if __name__ == "__main__":
    # Test the integration
    async def test_integration():
        test_api_key = "7334566177a1515215529f311fb52613023efb11"
        
        async with AISStreamIntegration(test_api_key) as ais:
            vessels = await ais.get_real_vessel_data(10)
            print(f"Fetched {len(vessels)} real vessels from AIS Stream:")
            
            for vessel in vessels[:3]:
                print(f"- {vessel['name']}: {vessel['coordinates']} ({vessel['type']})")
                print(f"  Speed: {vessel['speed']} knots, Course: {vessel['course']}°")
                print(f"  Status: {vessel['status']}")
                print()
    
    asyncio.run(test_integration())
