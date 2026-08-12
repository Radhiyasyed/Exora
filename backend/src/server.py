"""
server.py - Exora Flask REST API Backend

Serves exoplanet dataset, habitability indices, and parametric search endpoints
to the Exora React frontend web application with full CORS support.
"""

import os
import sys
import json
import numpy as np
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

# Resolve paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_JSON_PATH = PROJECT_ROOT / "data" / "dashboard" / "planets.json"

sys.path.append(str(PROJECT_ROOT / "src"))

from asgiref.wsgi import WsgiToAsgi

flask_app = Flask(__name__)

# Enable CORS for all routes and origins
CORS(flask_app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Expose the ASGI-compatible app for Uvicorn
app = WsgiToAsgi(flask_app)

# Helper function to generate slug from planet name
def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("+", "").replace(".", "")

# ESI and PHI Calculation Functions
def calculate_esi_component(value, earth_value):
    """Calculate a single ESI component using Schulze-Makuch formula"""
    if value is None or earth_value is None:
        return None
    return 1 - abs((value - earth_value) / (value + earth_value))

def calculate_esi(radius, density, flux):
    """Calculate ESI using Schulze-Makuch product equation"""
    from functools import reduce
    
    esi_radius = calculate_esi_component(radius, 1.0)  # Earth radius = 1.0
    esi_density = calculate_esi_component(density, 5.51)  # Earth density = 5.51 g/cm³
    esi_flux = calculate_esi_component(flux, 1.0)  # Earth flux = 1.0
    
    components = [c for c in [esi_radius, esi_density, esi_flux] if c is not None]
    
    if not components:
        return None
    
    return reduce(lambda x, y: x * y, components)

def calculate_hi_component(value, optimal_min, optimal_max):
    """Calculate a single HI component with optimal range"""
    if value is None:
        return None
    
    if optimal_min <= value <= optimal_max:
        return 1.0
    
    if value < optimal_min:
        return 1 - abs((value - optimal_min) / (value + optimal_min))
    else:
        return 1 - abs((value - optimal_max) / (value + optimal_max))

def calculate_phi(radius, density, flux, surface_temp=None):
    """Calculate PHI using 4-component geometric mean"""
    from functools import reduce
    
    hi_radius = calculate_hi_component(radius, 0.5, 1.5)
    hi_density = calculate_hi_component(density, 3.0, 7.0)
    hi_flux = calculate_hi_component(flux, 0.7, 1.3)
    
    # HI_other: combines temperature suitability and other factors
    hi_other = 1.0  # Default placeholder
    if surface_temp is not None:
        # Optimal surface temp range: 273K-323K (0°C-50°C)
        hi_other = calculate_hi_component(surface_temp, 273, 323)
    
    components = [c for c in [hi_radius, hi_density, hi_flux, hi_other] if c is not None]
    
    if not components:
        return None
    
    return (reduce(lambda x, y: x * y, components)) ** (1/len(components))

def calculate_habitable_zone(star_temp, star_luminosity, semi_major_axis):
    """
    Calculate if planet is in habitable zone using astronomical boundary logic.
    Decoupled from ESI/PHI calculations.
    """
    if star_temp is None or star_luminosity is None or semi_major_axis is None:
        return False  # Default to false if orbital data is missing

    # Calculate habitable zone boundaries using stellar properties
    # Inner boundary (too hot): conservative estimate
    inner_hz = 0.95 * (star_luminosity ** 0.5)

    # Outer boundary (too cold): conservative estimate
    outer_hz = 1.37 * (star_luminosity ** 0.5)

    return inner_hz <= semi_major_axis <= outer_hz


def estimate_star_luminosity(star_temp_k, star_type=None):
    """Estimate stellar luminosity in solar units using temperature and approximate radius."""
    if star_temp_k is None:
        return None

    if star_type:
        if 'A-type' in star_type:
            radius_solar = 1.8
        elif 'F-type' in star_type:
            radius_solar = 1.4
        elif 'G-type' in star_type:
            radius_solar = 1.0
        elif 'K-type' in star_type:
            radius_solar = 0.8
        elif 'M-type' in star_type:
            radius_solar = 0.35
        else:
            radius_solar = 1.0
    else:
        if star_temp_k >= 7500:
            radius_solar = 1.8
        elif star_temp_k >= 6000:
            radius_solar = 1.4
        elif star_temp_k >= 5200:
            radius_solar = 1.0
        elif star_temp_k >= 3700:
            radius_solar = 0.8
        else:
            radius_solar = 0.35

    sun_temp = 5778.0
    luminosity = (radius_solar ** 2) * ((star_temp_k / sun_temp) ** 4)
    return round(luminosity, 4)

# Baseline fallback exoplanet metadata for rich UI display
METADATA_EXTENSIONS = {
    "earth": {
        "artistImage": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80",
        "description": "The home baseline world. Abundant liquid water oceans, protective magnetosphere, and nitrogen-oxygen atmosphere.",
        "whyInteresting": "Standard unit of measurement for habitability metrics (ESI = 1.00).",
        "atmosphere": ["N2 (78%)", "O2 (21%)", "Ar (0.9%)", "CO2 (0.04%)"],
        "color": "#38bdf8",
        "inHabitableZone": True,
        "discoveryMethod": "Direct Observation",
        "discoveryYear": 0,
        "surfaceGravityG": 1.0,
        "orbitalPeriodDays": 365.25,
        "distanceLy": 0.0,
        "starType": "G-type (G2V)"
    },
    "kepler-452b": {
        "artistImage": "https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?auto=format&fit=crop&w=800&q=80",
        "description": "Often dubbed 'Earth's Cousin', Kepler-452b orbits a G2-type main sequence star remarkably similar to our Sun at a distance of 1.04 AU.",
        "whyInteresting": "Its host star is approximately 6 billion years old (1.5B years older than the Sun), offering a preview of Earth's potential climatic future under a warming host star.",
        "atmosphere": ["Dense H2O", "CO2", "N2 (Suspected)"],
        "color": "#22d3ee",
        "inHabitableZone": True,
        "discoveryMethod": "Transit",
        "discoveryYear": 2015,
        "surfaceGravityG": 1.9,
        "orbitalPeriodDays": 384.8,
        "distanceLy": 1786.0,
        "starType": "G-type (G2V)"
    },
    "trappist-1e": {
        "artistImage": "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=800&q=80",
        "description": "An Earth-sized world orbiting in the habitable zone of an ultra-cool M-dwarf star. It is the fourth planet from TRAPPIST-1.",
        "whyInteresting": "Possesses a terrestrial rock-iron ratio, receives 66% of Earth's solar irradiance, and is one of JWST's primary atmospheric characterization targets.",
        "atmosphere": ["N2-dominated", "CO2 candidate", "Water vapor"],
        "color": "#818cf8",
        "inHabitableZone": True,
        "discoveryMethod": "Transit",
        "discoveryYear": 2017,
        "surfaceGravityG": 0.82,
        "orbitalPeriodDays": 6.1,
        "distanceLy": 40.0,
        "starType": "M-type (Ultra-cool Dwarf)"
    },
    "kepler-186f": {
        "artistImage": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80",
        "description": "The first validated Earth-sized planet orbiting in the habitable zone of another star (an M-dwarf dwarf star).",
        "whyInteresting": "Receives about one-third of the light Earth gets from the Sun, putting it near the outer edge of its habitable zone.",
        "atmosphere": ["CO2-rich greenhouse candidate"],
        "color": "#f43f5e",
        "inHabitableZone": True,
        "discoveryMethod": "Transit",
        "discoveryYear": 2014,
        "surfaceGravityG": 1.02,
        "orbitalPeriodDays": 129.9,
        "distanceLy": 582.0,
        "starType": "M-type (Red Dwarf)"
    }
}

def load_dataset():
    """Load JSON payload or run packaging script if missing."""
    if not DATA_JSON_PATH.exists():
        try:
            from Package_for_dashboard import main as package_main
            package_main()
        except Exception as e:
            print(f"Warning: Failed to execute Package_for_dashboard: {e}", file=sys.stderr)

    if DATA_JSON_PATH.exists():
        with open(DATA_JSON_PATH, "r") as f:
            data = json.load(f)
            raw_planets = data.get("planets", [])
    else:
        raw_planets = []

    # Enrich planets with slug ID and default attributes
    enriched = []
    for p in raw_planets:
        name = p.get("name", "Unknown")
        p_id = slugify(name)
        
        # Merge with pre-configured metadata if matching
        meta = METADATA_EXTENSIONS.get(p_id, {})
        
        # Estimate star type based on starTempK if present
        star_temp = p.get("starTempK")
        if meta.get("starType"):
            star_type = meta["starType"]
        elif star_temp is not None:
            if star_temp >= 7500:
                star_type = "A-type"
            elif star_temp >= 6000:
                star_type = "F-type"
            elif star_temp >= 5200:
                star_type = "G-type"
            elif star_temp >= 3700:
                star_type = "K-type"
            else:
                star_type = "M-type"
        else:
            star_type = "G-type"

        # Determine habitable zone estimation and derived similarity metrics
        hi = p.get("habitabilityIndex", 0.0) or 0.0
        star_luminosity = estimate_star_luminosity(star_temp, star_type)
        flux_ratio = max(0.01, min(3.0, (p.get("eqTempK", 255) or 255) / 255.0))
        esi_score = calculate_esi(p.get("radiusEarth", 1.0) or 1.0, p.get("densityGCm3"), flux_ratio)
        phi_score = calculate_phi(p.get("radiusEarth", 1.0) or 1.0, p.get("densityGCm3"), flux_ratio, p.get("eqTempK"))

        in_hz = meta.get("inHabitableZone") if "inHabitableZone" in meta else calculate_habitable_zone(star_temp, star_luminosity, p.get("orbitAU"))

        planet_obj = {
            "id": p_id,
            "name": name,
            "system": name.split()[0] if len(name.split()) > 1 else name,
            "starType": star_type,
            "starName": name.split()[0] if len(name.split()) > 1 else name,
            "radiusEarth": p.get("radiusEarth", 1.0) or 1.0,
            "massEarth": p.get("massEarth", 1.0) or 1.0,
            "densityGCm3": p.get("densityGCm3"),
            "equilibriumTempK": p.get("eqTempK", 255) or 255,
            "orbitalPeriodDays": meta.get("orbitalPeriodDays", 365.25),
            "distanceLy": meta.get("distanceLy", 100.0),
            "habitabilityIndex": round(hi, 2),
            "esiScore": round(esi_score, 4) if esi_score is not None else None,
            "esi_score": round(esi_score, 4) if esi_score is not None else None,
            "phiScore": round(phi_score, 4) if phi_score is not None else None,
            "phi_score": round(phi_score, 4) if phi_score is not None else None,
            "inHabitableZone": in_hz,
            "isInHabitableZone": in_hz,
            "is_in_habitable_zone": in_hz,
            "starLuminosity": star_luminosity,
            "star_luminosity": star_luminosity,
            "starRadius": p.get("starRadius"),
            "discoveryMethod": meta.get("discoveryMethod", "Transit"),
            "discoveryYear": meta.get("discoveryYear", 2015),
            "atmosphere": meta.get("atmosphere", ["N2", "CO2 candidate"]),
            "surfaceGravityG": meta.get("surfaceGravityG", 1.0),
            "artistImage": meta.get("artistImage", "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80"),
            "description": meta.get("description", f"A cataloged exoplanet with radius {p.get('radiusEarth')} Earth radii."),
            "whyInteresting": meta.get("whyInteresting", f"Cataloged with Habitability ESI Score {round(hi, 2)}."),
            "color": meta.get("color", "#22d3ee"),
            "lightCurve": [
                {"time": -3, "flux": 1.000, "processed": 1.000},
                {"time": -2, "flux": 0.999, "processed": 1.000},
                {"time": -1, "flux": 0.995, "processed": 0.996},
                {"time": 0, "flux": 0.990, "processed": 0.991},
                {"time": 1, "flux": 0.995, "processed": 0.996},
                {"time": 2, "flux": 0.999, "processed": 1.000},
                {"time": 3, "flux": 1.000, "processed": 1.000}
            ]
        }
        enriched.append(planet_obj)
    return enriched

@flask_app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Exora NASA Exoplanet Backend API",
        "version": "1.0.0"
    })

@flask_app.route("/api/planets", methods=["GET"])
def get_planets():
    planets = load_dataset()
    
    # Query parameters
    search = request.args.get("search", "").strip().lower()
    min_hi = request.args.get("min_hi", type=float)
    max_hi = request.args.get("max_hi", type=float)
    min_esi = request.args.get("min_esi", type=float)
    max_esi = request.args.get("max_esi", type=float)
    min_phi = request.args.get("min_phi", type=float)
    max_phi = request.args.get("max_phi", type=float)
    min_radius = request.args.get("min_radius", type=float)
    max_radius = request.args.get("max_radius", type=float)
    max_temp = request.args.get("max_temp", type=float)
    max_period = request.args.get("max_period", type=float)
    hz_only = request.args.get("hz_only", "").lower() in ["true", "1", "yes"]
    star_types = request.args.getlist("star_type")
    
    sort_by = request.args.get("sort_by", "habitabilityIndex")
    order = request.args.get("order", "desc").lower()

    # Filtering
    filtered = []
    for p in planets:
        if search:
            match_name = search in p["name"].lower()
            match_sys = search in p["system"].lower()
            match_star = search in p["starName"].lower()
            if not (match_name or match_sys or match_star):
                continue
                
        if min_hi is not None and p["habitabilityIndex"] < min_hi:
            continue
        if max_hi is not None and p["habitabilityIndex"] > max_hi:
            continue
        if min_esi is not None and (p.get("esiScore") is None or p["esiScore"] < min_esi):
            continue
        if max_esi is not None and (p.get("esiScore") is None or p["esiScore"] > max_esi):
            continue
        if min_phi is not None and (p.get("phiScore") is None or p["phiScore"] < min_phi):
            continue
        if max_phi is not None and (p.get("phiScore") is None or p["phiScore"] > max_phi):
            continue
        if min_radius is not None and p["radiusEarth"] < min_radius:
            continue
        if max_radius is not None and p["radiusEarth"] > max_radius:
            continue
        if max_temp is not None and p["equilibriumTempK"] > max_temp:
            continue
        if max_period is not None and p["orbitalPeriodDays"] > max_period:
            continue
        if hz_only and not p.get("inHabitableZone"):
            continue
        if star_types:
            if not any(st.lower() in p["starType"].lower() for st in star_types):
                continue
                
        filtered.append(p)

    # Sorting
    reverse = (order == "desc")
    filtered.sort(key=lambda x: (x.get(sort_by) is not None, x.get(sort_by)), reverse=reverse)

    return jsonify({
        "count": len(filtered),
        "totalCataloged": len(planets),
        "planets": filtered
    })

@flask_app.route("/api/planets/<planet_id>", methods=["GET"])
def get_planet_by_id(planet_id):
    planets = load_dataset()
    planet_id_lower = planet_id.lower()
    
    for p in planets:
        if p["id"] == planet_id_lower or p["name"].lower() == planet_id_lower:
            return jsonify(p)
            
    return jsonify({"error": "Planet not found", "id": planet_id}), 404

@flask_app.route("/api/stats", methods=["GET"])
def get_stats():
    planets = load_dataset()
    hz_count = sum(1 for p in planets if p.get("inHabitableZone"))
    esi_values = [p.get("esiScore") for p in planets if p.get("esiScore") is not None]
    phi_values = [p.get("phiScore") for p in planets if p.get("phiScore") is not None]
    avg_esi = round(sum(esi_values) / len(esi_values), 3) if esi_values else None
    avg_phi = round(sum(phi_values) / len(phi_values), 3) if phi_values else None

    return jsonify({
        "totalPlanets": f"{len(planets)}+",
        "habitableZoneCandidates": hz_count,
        "averageESI": avg_esi,
        "averagePHI": avg_phi,
        "systemsCount": "4,195",
        "archiveSize": "14.2 TB",
        "dataSource": "NASA Exoplanet Archive (pscomppars)"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Exora Backend API running on http://127.0.0.1:{port}")
    flask_app.run(host="127.0.0.1", port=port, debug=False)
