"""
server.py - Exora Flask REST API Backend  (updated for the new pipeline)

Serves the Exora dataset (data/dashboard/exora_planets.json, produced by
curate_planets.py + build_exora_dataset.py) to the frontend.

Key change from the previous version: this file used to RECALCULATE ESI
and PHI itself, using a different (unweighted) formula, and expected an
older filename/shape (planets.json, wrapped in {"planets": [...]}).
That caused two problems:
  1. The real, published-and-validated ESI weights (0.57/1.07/0.70/5.58)
     computed by build_exora_dataset.py were being silently discarded
     and replaced with an unweighted approximation.
  2. PHI was still being served, despite the team's explicit decision
     to skip PHI/HI entirely (fabricated-chemistry concerns).

This version does neither: it reads exora_planets.json directly (a flat
JSON array) and serves the precomputed esi/gravity/hzd/zoneStatus/
transitDepth/transitDuration fields as-is -- no recalculation, no PHI.
"""

import os
import sys
import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_JSON_PATH = PROJECT_ROOT / "data" / "dashboard" / "exora_planets.json"

sys.path.append(str(PROJECT_ROOT / "src"))

try:
    from asgiref.wsgi import WsgiToAsgi
    HAS_ASGI = True
except ImportError:
    HAS_ASGI = False

flask_app = Flask(__name__)
CORS(flask_app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app = WsgiToAsgi(flask_app) if HAS_ASGI else flask_app


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("+", "").replace(".", "")


def load_dataset():
    """
    Load the precomputed Exora dataset. No recalculation happens here --
    esi, gravity, hzd, zoneStatus, transitDepth, and transitDuration are
    all already computed by build_exora_dataset.py and stored as-is.
    """
    if not DATA_JSON_PATH.exists():
        print(f"WARNING: {DATA_JSON_PATH} not found. Run curate_planets.py "
              f"then build_exora_dataset.py to generate it.", file=sys.stderr)
        return []

    with open(DATA_JSON_PATH, "r") as f:
        planets = json.load(f)

    enriched = []
    for p in planets:
        p = dict(p)  # shallow copy so we don't mutate the loaded list
        p["id"] = slugify(p.get("name", "unknown"))
        p["system"] = p["name"].split()[0] if len(p["name"].split()) > 1 else p["name"]
        enriched.append(p)
    return enriched


@flask_app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Exora NASA Exoplanet Backend API",
        "version": "2.0.0",
    })


@flask_app.route("/api/planets", methods=["GET"])
def get_planets():
    planets = load_dataset()

    search = request.args.get("search", "").strip().lower()
    min_esi = request.args.get("min_esi", type=float)
    max_esi = request.args.get("max_esi", type=float)
    min_radius = request.args.get("min_radius", type=float)
    max_radius = request.args.get("max_radius", type=float)
    max_temp = request.args.get("max_temp", type=float)
    max_period = request.args.get("max_period", type=float)
    zone_status = request.args.get("zone_status")  # "Too Hot" / "Habitable Zone" / "Too Cold"
    featured_only = request.args.get("featured_only", "").lower() in ["true", "1", "yes"]
    star_types = request.args.getlist("star_type")

    sort_by = request.args.get("sort_by", "esi")
    order = request.args.get("order", "desc").lower()

    filtered = []
    for p in planets:
        if search:
            match_name = search in p["name"].lower()
            match_sys = search in p["system"].lower()
            if not (match_name or match_sys):
                continue

        if min_esi is not None and (p.get("esi") is None or p["esi"] < min_esi):
            continue
        if max_esi is not None and (p.get("esi") is None or p["esi"] > max_esi):
            continue
        if min_radius is not None and (p.get("radiusEarth") is None or p["radiusEarth"] < min_radius):
            continue
        if max_radius is not None and (p.get("radiusEarth") is None or p["radiusEarth"] > max_radius):
            continue
        if max_temp is not None and (p.get("equilibriumTempK") is None or p["equilibriumTempK"] > max_temp):
            continue
        if max_period is not None and (p.get("orbitalPeriodDays") is None or p["orbitalPeriodDays"] > max_period):
            continue
        if zone_status and p.get("zoneStatus") != zone_status:
            continue
        if featured_only and not p.get("featured"):
            continue
        if star_types:
            star_val = (p.get("starSpectralType") or "")
            if not any(st.lower() in star_val.lower() for st in star_types):
                continue

        filtered.append(p)

    reverse = (order == "desc")
    filtered.sort(key=lambda x: (x.get(sort_by) is not None, x.get(sort_by)), reverse=reverse)

    return jsonify({
        "count": len(filtered),
        "totalCataloged": len(planets),
        "planets": filtered,
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
    esi_values = [p.get("esi") for p in planets if p.get("esi") is not None]
    hz_count = sum(1 for p in planets if p.get("zoneStatus") == "Habitable Zone")
    avg_esi = round(sum(esi_values) / len(esi_values), 3) if esi_values else None

    return jsonify({
        "totalPlanets": len(planets),
        "habitableZoneCandidates": hz_count,
        "averageESI": avg_esi,
        "dataSource": "NASA Exoplanet Archive (pscomppars)",
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Exora Backend API running on http://0.0.0.0:{port}")
    flask_app.run(host="0.0.0.0", port=port, debug=False)
