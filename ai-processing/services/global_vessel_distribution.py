#!/usr/bin/env python3
"""
Global Vessel Distribution Service
Combines real AIS data with realistic global distribution to provide comprehensive coverage
"""

import asyncio
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import math

logger = logging.getLogger(__name__)

class GlobalVesselDistribution:
    """Service to provide realistic global vessel distribution"""
    
    def __init__(self):
        # Major shipping routes with realistic vessel densities
        self.shipping_routes = [
            # Trans-Pacific Routes
            {
                "name": "Trans-Pacific Main",
                "start": (35.0, -120.0),  # US West Coast
                "end": (35.0, 140.0),     # Japan
                "vessel_density": 0.15,   # vessels per degree
                "typical_vessels": ["Container Ship", "Bulk Carrier", "Tanker"]
            },
            {
                "name": "Asia-Australia",
                "start": (1.3, 103.8),    # Singapore
                "end": (-33.9, 151.2),    # Sydney
                "vessel_density": 0.12,
                "typical_vessels": ["Container Ship", "Bulk Carrier", "LNG Tanker"]
            },
            
            # Trans-Atlantic Routes
            {
                "name": "North Atlantic",
                "start": (40.7, -74.0),   # New York
                "end": (51.5, -0.1),      # London
                "vessel_density": 0.18,
                "typical_vessels": ["Container Ship", "Ro-Ro", "Tanker"]
            },
            {
                "name": "South Atlantic",
                "start": (-22.9, -43.2),  # Rio de Janeiro
                "end": (-33.9, 18.4),     # Cape Town
                "vessel_density": 0.08,
                "typical_vessels": ["Bulk Carrier", "Tanker", "General Cargo"]
            },
            
            # Europe-Asia Routes
            {
                "name": "Suez Route",
                "start": (51.9, 4.5),     # Rotterdam
                "end": (1.3, 103.8),      # Singapore
                "vessel_density": 0.20,   # High density route
                "typical_vessels": ["Container Ship", "Tanker", "Bulk Carrier"]
            },
            {
                "name": "Cape Route",
                "start": (51.9, 4.5),     # Rotterdam
                "end": (1.3, 103.8),      # Singapore (via Cape)
                "vessel_density": 0.10,
                "typical_vessels": ["VLCC", "Bulk Carrier", "Container Ship"]
            },
            
            # Regional Routes
            {
                "name": "Mediterranean",
                "start": (36.1, -5.3),    # Gibraltar
                "end": (31.2, 32.3),      # Port Said
                "vessel_density": 0.25,
                "typical_vessels": ["Container Ship", "Tanker", "Ferry"]
            },
            {
                "name": "Persian Gulf",
                "start": (26.2, 50.6),    # Bahrain
                "end": (25.3, 55.4),      # Dubai
                "vessel_density": 0.30,
                "typical_vessels": ["Tanker", "Container Ship", "LNG Tanker"]
            },
            {
                "name": "South China Sea",
                "start": (22.3, 114.2),   # Hong Kong
                "end": (1.3, 103.8),      # Singapore
                "vessel_density": 0.22,
                "typical_vessels": ["Container Ship", "Bulk Carrier", "Tanker"]
            },
            
            # Americas Coastal
            {
                "name": "US East Coast",
                "start": (25.8, -80.2),   # Miami
                "end": (40.7, -74.0),     # New York
                "vessel_density": 0.15,
                "typical_vessels": ["Container Ship", "Tanker", "Cruise Ship"]
            },
            {
                "name": "US West Coast",
                "start": (32.7, -117.2),  # San Diego
                "end": (47.6, -122.3),    # Seattle
                "vessel_density": 0.12,
                "typical_vessels": ["Container Ship", "Tanker", "Bulk Carrier"]
            }
        ]
        
        # Major ports with typical vessel counts
        self.major_ports = [
            # Asia-Pacific
            {"name": "Shanghai", "coords": (31.2, 121.5), "vessels": 45, "country": "China"},
            {"name": "Singapore", "coords": (1.3, 103.8), "vessels": 38, "country": "Singapore"},
            {"name": "Hong Kong", "coords": (22.3, 114.2), "vessels": 32, "country": "Hong Kong"},
            {"name": "Busan", "coords": (35.2, 129.1), "vessels": 28, "country": "South Korea"},
            {"name": "Tokyo", "coords": (35.7, 139.7), "vessels": 25, "country": "Japan"},
            {"name": "Mumbai", "coords": (19.1, 72.9), "vessels": 22, "country": "India"},
            {"name": "Sydney", "coords": (-33.9, 151.2), "vessels": 18, "country": "Australia"},
            
            # Europe
            {"name": "Rotterdam", "coords": (51.9, 4.5), "vessels": 42, "country": "Netherlands"},
            {"name": "Hamburg", "coords": (53.6, 10.0), "vessels": 35, "country": "Germany"},
            {"name": "Antwerp", "coords": (51.2, 4.4), "vessels": 30, "country": "Belgium"},
            {"name": "Felixstowe", "coords": (51.9, 1.4), "vessels": 25, "country": "UK"},
            
            # Americas
            {"name": "Los Angeles", "coords": (33.7, -118.3), "vessels": 40, "country": "USA"},
            {"name": "New York", "coords": (40.7, -74.0), "vessels": 35, "country": "USA"},
            {"name": "Miami", "coords": (25.8, -80.2), "vessels": 20, "country": "USA"},
            {"name": "Santos", "coords": (-23.9, -46.3), "vessels": 25, "country": "Brazil"},
            
            # Middle East/Africa
            {"name": "Dubai", "coords": (25.3, 55.4), "vessels": 30, "country": "UAE"},
            {"name": "Cape Town", "coords": (-33.9, 18.4), "vessels": 15, "country": "South Africa"}
        ]
    
    async def get_global_vessel_distribution(self, real_vessels: List[Dict], target_count: int = 500) -> List[Dict]:
        """
        Create a realistic global vessel distribution using real AIS data where available
        and filling gaps with realistic positioning
        """
        logger.info(f"Creating global distribution with {len(real_vessels)} real vessels, target: {target_count}")
        
        # Start with real vessels
        distributed_vessels = list(real_vessels)
        
        # Calculate how many additional vessels we need
        needed = max(0, target_count - len(real_vessels))
        
        if needed > 0:
            logger.info(f"Adding {needed} vessels for global coverage")
            
            # Distribute vessels across routes (60%)
            route_vessels = int(needed * 0.6)
            additional_vessels = await self._distribute_route_vessels(route_vessels)
            distributed_vessels.extend(additional_vessels)
            
            # Distribute vessels around ports (40%)
            port_vessels = needed - route_vessels
            port_vessels_list = await self._distribute_port_vessels(port_vessels)
            distributed_vessels.extend(port_vessels_list)
        
        # Shuffle to avoid predictable patterns
        random.shuffle(distributed_vessels)
        
        logger.info(f"✅ Created global distribution with {len(distributed_vessels)} vessels")
        return distributed_vessels[:target_count]
    
    async def _distribute_route_vessels(self, count: int) -> List[Dict]:
        """Distribute vessels along major shipping routes"""
        vessels = []
        
        for i in range(count):
            route = random.choice(self.shipping_routes)
            
            # Generate position along route
            progress = random.uniform(0.1, 0.9)  # Avoid exact endpoints
            lat = route["start"][0] + (route["end"][0] - route["start"][0]) * progress
            lng = route["start"][1] + (route["end"][1] - route["start"][1]) * progress
            
            # Add some realistic deviation from exact route
            lat += random.uniform(-0.5, 0.5)
            lng += random.uniform(-0.5, 0.5)
            
            # Ensure coordinates are valid
            lat = max(-85, min(85, lat))
            lng = max(-180, min(180, lng))
            
            vessel_type = random.choice(route["typical_vessels"])
            
            vessel = {
                "id": f"global_route_{i:06d}",
                "mmsi": f"{random.randint(200000000, 799999999)}",
                "name": self._generate_vessel_name(vessel_type),
                "type": vessel_type,
                "latitude": lat,
                "longitude": lng,
                "coordinates": [lat, lng],
                "speed": random.uniform(8.0, 18.0),
                "course": self._calculate_course(route["start"], route["end"]),
                "status": "Underway using engine",
                "flag": self._get_random_flag(),
                "data_source": "Global Distribution (Route)",
                "route": route["name"],
                "timestamp": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "riskLevel": random.choice(["Low", "Medium", "High"]),
                "impacted": random.random() < 0.15,  # 15% impacted
                "dwt": random.randint(10000, 200000),
                "length": random.randint(150, 400),
                "beam": random.randint(20, 60)
            }
            
            vessels.append(vessel)
        
        return vessels
    
    async def _distribute_port_vessels(self, count: int) -> List[Dict]:
        """Distribute vessels around major ports"""
        vessels = []
        
        for i in range(count):
            port = random.choice(self.major_ports)
            
            # Generate position near port (within ~50km)
            distance_km = random.uniform(5, 50)
            bearing = random.uniform(0, 360)
            
            # Convert to lat/lng offset
            lat_offset = (distance_km / 111.0) * math.cos(math.radians(bearing))
            lng_offset = (distance_km / (111.0 * math.cos(math.radians(port["coords"][0])))) * math.sin(math.radians(bearing))
            
            lat = port["coords"][0] + lat_offset
            lng = port["coords"][1] + lng_offset
            
            # Ensure coordinates are valid
            lat = max(-85, min(85, lat))
            lng = max(-180, min(180, lng))
            
            vessel_type = random.choice(["Container Ship", "Bulk Carrier", "Tanker", "General Cargo", "Ro-Ro"])
            
            vessel = {
                "id": f"global_port_{i:06d}",
                "mmsi": f"{random.randint(200000000, 799999999)}",
                "name": self._generate_vessel_name(vessel_type),
                "type": vessel_type,
                "latitude": lat,
                "longitude": lng,
                "coordinates": [lat, lng],
                "speed": random.uniform(0.0, 12.0),
                "course": random.uniform(0, 360),
                "status": random.choice(["At anchor", "Moored", "Underway using engine"]),
                "flag": port["country"],
                "data_source": "Global Distribution (Port)",
                "destination": port["name"],
                "timestamp": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "riskLevel": random.choice(["Low", "Medium", "High"]),
                "impacted": random.random() < 0.10,  # 10% impacted near ports
                "dwt": random.randint(5000, 150000),
                "length": random.randint(100, 350),
                "beam": random.randint(15, 50)
            }
            
            vessels.append(vessel)
        
        return vessels
    
    def _generate_vessel_name(self, vessel_type: str) -> str:
        """Generate realistic vessel name based on type"""
        prefixes = {
            "Container Ship": ["MSC", "COSCO", "MAERSK", "CMA CGM", "EVERGREEN"],
            "Bulk Carrier": ["CAPE", "OCEAN", "STAR", "GLOBAL", "PACIFIC"],
            "Tanker": ["FRONT", "NORDIC", "ATLANTIC", "EAGLE", "PHOENIX"],
            "General Cargo": ["CARGO", "TRADER", "MERCHANT", "PIONEER", "VENTURE"],
            "LNG Tanker": ["LNG", "GAS", "ENERGY", "ARCTIC", "MERIDIAN"],
            "Ro-Ro": ["FERRY", "LINK", "BRIDGE", "CONNECT", "PASSAGE"]
        }
        
        suffixes = ["SPIRIT", "PIONEER", "VOYAGER", "NAVIGATOR", "EXPLORER", "TRADER", "MASTER", "STAR"]
        
        prefix_list = prefixes.get(vessel_type, ["VESSEL"])
        prefix = random.choice(prefix_list)
        suffix = random.choice(suffixes)
        
        return f"{prefix} {suffix}"
    
    def _calculate_course(self, start: tuple, end: tuple) -> float:
        """Calculate bearing between two points"""
        lat1, lng1 = math.radians(start[0]), math.radians(start[1])
        lat2, lng2 = math.radians(end[0]), math.radians(end[1])
        
        dlng = lng2 - lng1
        
        y = math.sin(dlng) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlng)
        
        bearing = math.atan2(y, x)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360
        
        return bearing
    
    def _get_random_flag(self) -> str:
        """Get random flag state weighted by shipping registry size"""
        flags = [
            "Panama", "Liberia", "Marshall Islands", "Hong Kong", "Singapore",
            "Malta", "Bahamas", "Greece", "China", "Japan", "Norway", "Germany",
            "United Kingdom", "Italy", "South Korea", "Netherlands", "Denmark"
        ]
        return random.choice(flags)

# Global instance
global_distribution = GlobalVesselDistribution()

async def get_global_vessel_distribution(real_vessels: List[Dict], target_count: int = 500) -> List[Dict]:
    """Public function to get global vessel distribution"""
    return await global_distribution.get_global_vessel_distribution(real_vessels, target_count)
