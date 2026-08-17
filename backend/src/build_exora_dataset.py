"""
build_exora_dataset.py

Exora data pipeline, STAGE 2 (run only after curate_planets.py's name
list has been reviewed/sent to the content lead).

Loads the already-curated planet list (data/processed/exora_curated_raw.csv,
produced by curate_planets.py) and computes all calculated fields (ESI,
gravity, HZD, zoneStatus, transitDepth, transitDuration), then outputs
one flat, camelCase JSON object per planet.

Formula references:
  ESI  -- Schulze-Makuch et al. (2011), Astrobiology 11(10).
          Validated against a published test vector:
          ESI(r=1.36, d=1.22, v=1.51, t=278) == 0.8903703266879102
  HZD  -- simplified conservative habitable-zone boundary approximation
          (r_inner = sqrt(L/1.1), r_outer = sqrt(L/0.53)), commonly used
          for quick HZ distance estimates from stellar luminosity alone.
"""

import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CURATED_PATH = PROJECT_ROOT / "data" / "processed" / "exora_curated_raw.csv"
DASHBOARD_DIR = PROJECT_ROOT / "data" / "dashboard"
OUTPUT_JSON_PATH = DASHBOARD_DIR / "exora_planets.json"

SIGNIFICANT_PLANETS = [
    "Kepler-452 b", "TRAPPIST-1 e", "Proxima Cen b", "WASP-12 b",
    "TRAPPIST-1 d", "TRAPPIST-1 f", "TRAPPIST-1 g", "Kepler-186 f",
    "Kepler-22 b", "TOI-700 d", "51 Peg b", "HD 209458 b",
    "GJ 1214 b", "K2-18 b", "LHS 1140 b",
]

# ---------------------------------------------------------------------------
# Physical constants / reference values
# ---------------------------------------------------------------------------

EARTH_EQT_REF_K = 288.0   # ESI surface-temperature reference (published value)
AU_TO_SOLAR_RADII = 215.032
EARTH_RADII_PER_SOLAR_RADIUS = 109.076

ESI_WEIGHTS = {"radius": 0.57, "density": 1.07, "escape_velocity": 0.70, "temperature": 5.58}


# ---------------------------------------------------------------------------
# Step 1: Load already-curated data (produced by curate_planets.py)
# ---------------------------------------------------------------------------

def load_curated_data(path: Path = CURATED_PATH) -> pd.DataFrame:
    if not path.exists():
        print(f"ERROR: curated data not found at {path}. Run curate_planets.py first.", file=sys.stderr)
        sys.exit(1)
    return pd.read_csv(path)


def normalize_name(name: str) -> str:
    return str(name).strip().lower().replace("  ", " ")


# ---------------------------------------------------------------------------
# Step 3: Calculated fields
# ---------------------------------------------------------------------------

def esi_term(value, earth_value, weight):
    if pd.isna(value) or value <= 0:
        return np.nan
    base = 1 - abs(value - earth_value) / (value + earth_value)
    if base <= 0:
        return 0.0
    return base ** weight


def compute_esi(radius_e, mass_e, eqt_k):
    if pd.isna(radius_e) or pd.isna(mass_e) or pd.isna(eqt_k) or radius_e <= 0:
        return np.nan
    density_e = mass_e / (radius_e ** 3)          # Earth-relative density
    escape_vel_e = np.sqrt(mass_e / radius_e)       # Earth-relative escape velocity

    r_term = esi_term(radius_e, 1.0, ESI_WEIGHTS["radius"])
    d_term = esi_term(density_e, 1.0, ESI_WEIGHTS["density"])
    v_term = esi_term(escape_vel_e, 1.0, ESI_WEIGHTS["escape_velocity"])
    t_term = esi_term(eqt_k, EARTH_EQT_REF_K, ESI_WEIGHTS["temperature"])

    if any(pd.isna(x) for x in (r_term, d_term, v_term, t_term)):
        return np.nan

    interior = (r_term * d_term) ** 0.5
    surface = (v_term * t_term) ** 0.5
    return float((interior * surface) ** 0.5)


def compute_gravity(radius_e, mass_e):
    if pd.isna(radius_e) or pd.isna(mass_e) or radius_e <= 0:
        return np.nan
    return float(mass_e / (radius_e ** 2))


def compute_hz_boundaries(st_lum):
    """
    Conservative habitable-zone inner/outer boundary distances (AU),
    from a simplified flux-scaling approximation commonly used for
    quick HZ estimates given only stellar luminosity.
    st_lum in the archive is stored as log10(L/Lsun); convert first.
    """
    if pd.isna(st_lum):
        return (np.nan, np.nan)
    l_rel = 10 ** st_lum  # archive st_lum is log10(L/Lsun)
    if l_rel <= 0:
        return (np.nan, np.nan)
    r_inner = np.sqrt(l_rel / 1.1)
    r_outer = np.sqrt(l_rel / 0.53)
    return (r_inner, r_outer)


def compute_hzd(orbsmax_au, st_lum):
    r_inner, r_outer = compute_hz_boundaries(st_lum)
    if pd.isna(orbsmax_au) or pd.isna(r_inner) or pd.isna(r_outer) or r_outer == r_inner:
        return np.nan
    return float((2 * orbsmax_au - r_outer - r_inner) / (r_outer - r_inner))


def zone_status_from_hzd(hzd):
    if pd.isna(hzd):
        return None
    if hzd < -1:
        return "Too Hot"
    if hzd > 1:
        return "Too Cold"
    return "Habitable Zone"


def compute_transit_depth(radius_e, st_rad_solar):
    if pd.isna(radius_e) or pd.isna(st_rad_solar) or st_rad_solar <= 0:
        return np.nan
    r_planet_solar = radius_e / EARTH_RADII_PER_SOLAR_RADIUS
    return float((r_planet_solar / st_rad_solar) ** 2)


def compute_transit_duration(pl_trandur_hours):
    """
    Per team decision: curate_planets.py now requires pl_trandur to be
    present as part of the completeness filter (planets missing it are
    swapped out during curation), so no estimation fallback is used here
    -- this just passes the archive value through directly.
    """
    if pd.isna(pl_trandur_hours):
        return np.nan  # should not occur post-curation; kept defensively
    return float(pl_trandur_hours)


def compute_secondary_eclipse_depth(transit_depth, pl_eqt_k, st_teff_k):
    """
    Secondary eclipse depth (raw, unscaled) -- a blackbody thermal-emission
    approximation: the eclipse depth scales as the transit depth times the
    ratio of planet-to-star emitted flux, approximated via Stefan-Boltzmann
    scaling (flux ~ T^4):
        secondaryEclipseDepth = transitDepth * (T_planet / T_star)^4
    Real secondary eclipses are physically much shallower than the primary
    transit, which this formula reflects naturally since T_planet << T_star
    for nearly all planets. Sent unscaled, per the frontend's request to
    handle visual scaling itself.
    """
    if pd.isna(transit_depth) or pd.isna(pl_eqt_k) or pd.isna(st_teff_k) or st_teff_k <= 0:
        return np.nan
    return float(transit_depth * (pl_eqt_k / st_teff_k) ** 4)


def apply_calculated_fields(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["esi"] = df.apply(lambda r: compute_esi(r["pl_rade"], r["pl_bmasse"], r["pl_eqt"]), axis=1)
    df["gravity"] = df.apply(lambda r: compute_gravity(r["pl_rade"], r["pl_bmasse"]), axis=1)
    df["hzd"] = df.apply(lambda r: compute_hzd(r["pl_orbsmax"], r["st_lum"]), axis=1)
    df["zoneStatus"] = df["hzd"].apply(zone_status_from_hzd)
    df["transitDepth"] = df.apply(lambda r: compute_transit_depth(r["pl_rade"], r.get("st_rad")), axis=1)
    df["transitDuration"] = df["pl_trandur"].apply(compute_transit_duration)
    df["secondaryEclipseDepth"] = df.apply(
        lambda r: compute_secondary_eclipse_depth(r["transitDepth"], r["pl_eqt"], r["st_teff"]), axis=1
    )
    return df


# ---------------------------------------------------------------------------
# Step 4: camelCase JSON output
# ---------------------------------------------------------------------------

FIELD_MAP = {
    "pl_name": "name",
    "pl_rade": "radiusEarth",
    "pl_bmasse": "massEarth",
    "pl_eqt": "equilibriumTempK",
    "pl_orbsmax": "orbitalSemiMajorAxisAU",
    "pl_orbper": "orbitalPeriodDays",
    "st_lum": "stellarLuminosityLog",
    "st_teff": "stellarTempK",
    "st_spectype": "starSpectralType",
    "st_rad": "stellarRadiusSolar",
    "discoverymethod": "discoveryMethod",
    "disc_year": "discoveryYear",
    "esi": "esi",
    "gravity": "gravity",
    "hzd": "hzd",
    "zoneStatus": "zoneStatus",
    "transitDepth": "transitDepth",
    "transitDuration": "transitDuration",
    "secondaryEclipseDepth": "secondaryEclipseDepth",
    "pl_orbeccen": "orbitalEccentricity",  # passthrough only; not used in HZD (circular-orbit assumption)
}


def to_camel_case_records(df: pd.DataFrame) -> list:
    subset = df[list(FIELD_MAP.keys())].rename(columns=FIELD_MAP)
    subset["featured"] = df["pl_name"].apply(
        lambda n: normalize_name(n) in {normalize_name(x) for x in SIGNIFICANT_PLANETS}
    )
    records = subset.to_dict(orient="records")
    for r in records:
        for k, v in r.items():
            if isinstance(v, float) and np.isnan(v):
                r[k] = None
        for k in ("esi", "gravity", "hzd", "transitDepth", "transitDuration"):
            if r.get(k) is not None:
                r[k] = round(r[k], 4)
        if r.get("secondaryEclipseDepth") is not None:
            # Not aggressively rounded: values can be extremely small
            # (e.g. ~1e-9 for a cool planet around a hot star), and the
            # frontend explicitly wants the true raw value to scale itself.
            r["secondaryEclipseDepth"] = float(f"{r['secondaryEclipseDepth']:.6e}")
        if r.get("orbitalEccentricity") is not None:
            r["orbitalEccentricity"] = round(r["orbitalEccentricity"], 4)
    return records


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading curated planet list from {CURATED_PATH}...")
    curated_df = load_curated_data()
    print(f"Loaded {len(curated_df)} curated planets.\n")

    print("Computing ESI, gravity, HZD, zoneStatus, transitDepth, transitDuration...")
    scored_df = apply_calculated_fields(curated_df)

    records = to_camel_case_records(scored_df)

    with open(OUTPUT_JSON_PATH, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Saved {len(records)} planets -> {OUTPUT_JSON_PATH}")

    featured_count = sum(1 for r in records if r["featured"])
    esi_scored = sum(1 for r in records if r["esi"] is not None)
    print(f"\nSummary: {len(records)} planets total, {featured_count} featured, "
          f"{esi_scored} with a computed ESI score.")


if __name__ == "__main__":
    main()
