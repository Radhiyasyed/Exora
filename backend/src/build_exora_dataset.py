"""
build_exora_dataset.py

Exora data pipeline, stage 2:
  1. Load the full raw archive pull (data/raw/pscomppars_full.csv).
  2. Curate it down to a target list of 100-150 planets:
       - Require complete data on the core raw fields (no major gaps).
       - Always include a hand-picked list of well-known/significant
         planets, if present in the archive with complete data.
       - Fill the remainder with a variety-maximizing selection across
         star spectral type and planet radius, so the final set spans
         different star types and planet sizes rather than clustering.
  3. Compute all calculated fields (ESI, gravity, HZD, zoneStatus,
     transitDepth, transitDuration) using the formulas specified for
     the Exora app.
  4. Output one flat, camelCase JSON object per planet, with a
     `featured` boolean (True for the hand-picked significant planets).
  5. Separately write out just the finalized planet name list, so it
     can be sent to the content lead before any further work.

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
RAW_PATH = PROJECT_ROOT / "data" / "raw" / "pscomppars_full.csv"
DASHBOARD_DIR = PROJECT_ROOT / "data" / "dashboard"
OUTPUT_JSON_PATH = DASHBOARD_DIR / "exora_planets.json"
OUTPUT_NAMELIST_PATH = DASHBOARD_DIR / "exora_planet_namelist.txt"

# ---------------------------------------------------------------------------
# Curation config
# ---------------------------------------------------------------------------

TARGET_COUNT_MIN = 100
TARGET_COUNT_MAX = 150

# Core raw fields that must all be present (non-null) for a planet to be
# eligible at all -- "complete data, no major missing fields."
REQUIRED_COMPLETE_FIELDS = [
    "pl_name", "pl_rade", "pl_bmasse", "pl_eqt", "pl_orbsmax",
    "pl_orbper", "st_lum", "st_teff", "st_spectype",
]

# Hand-picked, well-known/scientifically significant planets to prioritize
# for inclusion (matched case-insensitively, whitespace-normalized).
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
# Step 1: Load
# ---------------------------------------------------------------------------

def load_raw_data(path: Path = RAW_PATH) -> pd.DataFrame:
    if not path.exists():
        print(f"ERROR: raw archive not found at {path}. Run query_exoplanet_archive.py first.", file=sys.stderr)
        sys.exit(1)
    return pd.read_csv(path)


# ---------------------------------------------------------------------------
# Step 2: Curation
# ---------------------------------------------------------------------------

def normalize_name(name: str) -> str:
    return str(name).strip().lower().replace("  ", " ")


def curate_planets(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["pl_name"] = df["pl_name"].astype(str).str.strip()

    total = len(df)
    complete = df.dropna(subset=REQUIRED_COMPLETE_FIELDS).drop_duplicates(subset=["pl_name"])
    print(f"Completeness filter: {total} rows -> {len(complete)} rows with all required fields present")

    normalized_targets = {normalize_name(n) for n in SIGNIFICANT_PLANETS}
    complete["_norm_name"] = complete["pl_name"].apply(normalize_name)

    significant_matches = complete[complete["_norm_name"].isin(normalized_targets)]
    print(f"Significant planets found in complete set: {len(significant_matches)} / {len(SIGNIFICANT_PLANETS)} requested")
    missing_significant = normalized_targets - set(significant_matches["_norm_name"])
    if missing_significant:
        print(f"  NOT found with complete data (excluded): {sorted(missing_significant)}")

    remaining_pool = complete[~complete["_norm_name"].isin(normalized_targets)].copy()

    slots_left = TARGET_COUNT_MAX - len(significant_matches)
    if slots_left <= 0:
        curated = significant_matches.head(TARGET_COUNT_MAX)
    else:
        variety_selection = select_variety_sample(remaining_pool, slots_left)
        curated = pd.concat([significant_matches, variety_selection], ignore_index=True)

    curated = curated.drop(columns=["_norm_name"]).drop_duplicates(subset=["pl_name"]).reset_index(drop=True)

    if len(curated) < TARGET_COUNT_MIN:
        print(f"WARNING: curated set has only {len(curated)} planets, below the "
              f"target minimum of {TARGET_COUNT_MIN}. Not enough complete-data "
              f"planets were available in this pull.")

    print(f"Final curated set: {len(curated)} planets")
    return curated


def select_variety_sample(pool: pd.DataFrame, n: int) -> pd.DataFrame:
    """
    Select up to n planets from `pool`, maximizing variety across star
    spectral type (first letter, e.g. G/K/M/F) and planet size bucket
    (rocky/sub-Neptune/Neptune-like/giant, by radius), rather than just
    taking the first n rows in database order.
    """
    if len(pool) == 0 or n <= 0:
        return pool.head(0)

    pool = pool.copy()
    pool["_star_class"] = pool["st_spectype"].astype(str).str[0].str.upper()
    pool["_size_bucket"] = pd.cut(
        pool["pl_rade"],
        bins=[0, 1.5, 2.5, 6, 1000],
        labels=["rocky", "super-earth", "neptune-like", "giant"],
    )
    pool["_stratum"] = pool["_star_class"] + "_" + pool["_size_bucket"].astype(str)

    # Round-robin across strata so no single star-type/size combo dominates
    strata_groups = {k: v.sample(frac=1, random_state=42).reset_index(drop=True)
                      for k, v in pool.groupby("_stratum")}
    selected_rows = []
    idx = 0
    strata_keys = list(strata_groups.keys())
    while len(selected_rows) < n and strata_keys:
        progressed = False
        for key in list(strata_keys):
            group = strata_groups[key]
            if idx < len(group):
                selected_rows.append(group.iloc[idx])
                progressed = True
                if len(selected_rows) >= n:
                    break
            else:
                strata_keys.remove(key)
        if not progressed:
            break
        idx += 1

    result = pd.DataFrame(selected_rows).drop(columns=["_star_class", "_size_bucket", "_stratum"], errors="ignore")
    return result


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


def compute_transit_duration(pl_trandur_hours, orbper_days, orbsmax_au, st_rad_solar):
    """
    Uses the archive's own pl_trandur when available. Otherwise falls
    back to a simplified central-transit approximation (assumes a
    circular, edge-on orbit; ignores planet radius and impact
    parameter): T_dur (hours) = 24 * (P / pi) * (R_star / a),
    with R_star and a both expressed in solar radii.
    """
    if pd.notna(pl_trandur_hours):
        return float(pl_trandur_hours)
    if pd.isna(orbper_days) or pd.isna(orbsmax_au) or pd.isna(st_rad_solar) or orbsmax_au <= 0:
        return np.nan
    a_solar_radii = orbsmax_au * AU_TO_SOLAR_RADII
    return float(24 * (orbper_days / np.pi) * (st_rad_solar / a_solar_radii))


def apply_calculated_fields(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["esi"] = df.apply(lambda r: compute_esi(r["pl_rade"], r["pl_bmasse"], r["pl_eqt"]), axis=1)
    df["gravity"] = df.apply(lambda r: compute_gravity(r["pl_rade"], r["pl_bmasse"]), axis=1)
    df["hzd"] = df.apply(lambda r: compute_hzd(r["pl_orbsmax"], r["st_lum"]), axis=1)
    df["zoneStatus"] = df["hzd"].apply(zone_status_from_hzd)
    df["transitDepth"] = df.apply(lambda r: compute_transit_depth(r["pl_rade"], r.get("st_rad")), axis=1)
    df["transitDuration"] = df.apply(
        lambda r: compute_transit_duration(r.get("pl_trandur"), r["pl_orbper"], r["pl_orbsmax"], r.get("st_rad")),
        axis=1,
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
    return records


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading raw archive from {RAW_PATH}...")
    raw_df = load_raw_data()
    print(f"Loaded {len(raw_df)} rows.\n")

    curated_df = curate_planets(raw_df)
    print()

    print("Computing ESI, gravity, HZD, zoneStatus, transitDepth, transitDuration...")
    scored_df = apply_calculated_fields(curated_df)

    records = to_camel_case_records(scored_df)

    with open(OUTPUT_JSON_PATH, "w") as f:
        json.dump(records, f, indent=2)
    print(f"Saved {len(records)} planets -> {OUTPUT_JSON_PATH}")

    names = sorted(r["name"] for r in records)
    with open(OUTPUT_NAMELIST_PATH, "w") as f:
        f.write("\n".join(names))
    print(f"Saved finalized planet name list -> {OUTPUT_NAMELIST_PATH}")

    featured_count = sum(1 for r in records if r["featured"])
    esi_scored = sum(1 for r in records if r["esi"] is not None)
    print(f"\nSummary: {len(records)} planets total, {featured_count} featured, "
          f"{esi_scored} with a computed ESI score.")


if __name__ == "__main__":
    main()
