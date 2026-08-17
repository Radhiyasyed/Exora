"""
curate_planets.py

Exora data pipeline, STAGE 1 (stops here -- no calculated fields are
written out, though ESI/HZD are computed internally for ranking).

Curates a target list of ~130 (100-150) planets using an intentional
content mix rather than a plain "most complete data" cutoff:

  1. Famous/iconic          (10-15) -- hand-picked well-known planets
  2. High ESI scorers       (15-20) -- most Earth-like by ESI
  3. Extreme/weird worlds   (15-20) -- hot Jupiters, ultra-hot, high
                                       eccentricity, visually striking
  4. Strong HZ candidates   (15-20) -- best by |HZD| specifically, even
                                       if ESI isn't top-tier
  5. Multi-planet systems   (10-15) -- e.g. TRAPPIST-1, Kepler-90, for
                                       the Compare Worlds tab
  6. Rest                   (~20-30) -- solid, complete-data planets to
                                       round the set out

ESI and HZD are computed here ONLY to rank/select planets into these
categories -- the actual final calculated-field values (same formulas)
are (re)computed and written out in stage 2, build_exora_dataset.py.
Nothing calculated is included in this stage's output.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = PROJECT_ROOT / "data" / "raw" / "pscomppars_full.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
DASHBOARD_DIR = PROJECT_ROOT / "data" / "dashboard"
OUTPUT_CURATED_CSV = PROCESSED_DIR / "exora_curated_raw.csv"
OUTPUT_NAMELIST_PATH = DASHBOARD_DIR / "exora_planet_namelist.txt"
OUTPUT_NAMELIST_BY_CATEGORY_PATH = DASHBOARD_DIR / "exora_planet_namelist_by_category.txt"

TARGET_TOTAL = 130  # aim for the middle of the 100-150 range

REQUIRED_COMPLETE_FIELDS = [
    "pl_name", "pl_rade", "pl_bmasse", "pl_eqt", "pl_orbsmax",
    "pl_orbper", "st_lum", "st_teff", "st_spectype",
    "st_rad", "pl_trandur", "hostname", "sy_pnum",
]

# Category 1: hand-picked iconic planets, including the full TRAPPIST-1
# family (not just e/d/f/g) since it also anchors category 5.
ICONIC_PLANETS = [
    "Kepler-452 b", "Proxima Cen b", "WASP-12 b", "Kepler-186 f",
    "HD 209458 b", "51 Peg b",
    "TRAPPIST-1 b", "TRAPPIST-1 c", "TRAPPIST-1 d", "TRAPPIST-1 e",
    "TRAPPIST-1 f", "TRAPPIST-1 g", "TRAPPIST-1 h",
]

CATEGORY_TARGETS = {
    "iconic": (10, 15),
    "high_esi": (15, 20),
    "extreme": (15, 20),
    "hz_candidate": (15, 20),
    "multi_planet": (10, 15),
}


# ---------------------------------------------------------------------------
# Load & completeness filter
# ---------------------------------------------------------------------------

def load_raw_data(path: Path = RAW_PATH) -> pd.DataFrame:
    if not path.exists():
        print(f"ERROR: raw archive not found at {path}. Run query_exoplanet_archive.py first.", file=sys.stderr)
        sys.exit(1)
    return pd.read_csv(path)


def normalize_name(name: str) -> str:
    return str(name).strip().lower().replace("  ", " ")


def filter_complete(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["pl_name"] = df["pl_name"].astype(str).str.strip()
    total = len(df)
    complete = df.dropna(subset=REQUIRED_COMPLETE_FIELDS).drop_duplicates(subset=["pl_name"])
    print(f"Completeness filter: {total} rows -> {len(complete)} rows with all required fields present")
    return complete


# ---------------------------------------------------------------------------
# Internal ESI / HZD -- used only for ranking/selection in this stage.
# Same formulas as build_exora_dataset.py; kept in sync deliberately.
# ---------------------------------------------------------------------------

EARTH_EQT_REF_K = 288.0
ESI_WEIGHTS = {"radius": 0.57, "density": 1.07, "escape_velocity": 0.70, "temperature": 5.58}


def _esi_term(value, earth_value, weight):
    if pd.isna(value) or value <= 0:
        return np.nan
    base = 1 - abs(value - earth_value) / (value + earth_value)
    return max(base, 0.0) ** weight


def _compute_esi_for_ranking(radius_e, mass_e, eqt_k):
    if pd.isna(radius_e) or pd.isna(mass_e) or pd.isna(eqt_k) or radius_e <= 0:
        return np.nan
    density_e = mass_e / (radius_e ** 3)
    escape_vel_e = np.sqrt(mass_e / radius_e)
    terms = [
        _esi_term(radius_e, 1.0, ESI_WEIGHTS["radius"]),
        _esi_term(density_e, 1.0, ESI_WEIGHTS["density"]),
        _esi_term(escape_vel_e, 1.0, ESI_WEIGHTS["escape_velocity"]),
        _esi_term(eqt_k, EARTH_EQT_REF_K, ESI_WEIGHTS["temperature"]),
    ]
    if any(pd.isna(t) for t in terms):
        return np.nan
    interior = (terms[0] * terms[1]) ** 0.5
    surface = (terms[2] * terms[3]) ** 0.5
    return float((interior * surface) ** 0.5)


def _compute_hzd_for_ranking(orbsmax_au, st_lum):
    if pd.isna(orbsmax_au) or pd.isna(st_lum):
        return np.nan
    l_rel = 10 ** st_lum
    if l_rel <= 0:
        return np.nan
    r_inner = np.sqrt(l_rel / 1.1)
    r_outer = np.sqrt(l_rel / 0.53)
    if r_outer == r_inner:
        return np.nan
    return float((2 * orbsmax_au - r_outer - r_inner) / (r_outer - r_inner))


def add_ranking_fields(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["_esi_rank"] = df.apply(lambda r: _compute_esi_for_ranking(r["pl_rade"], r["pl_bmasse"], r["pl_eqt"]), axis=1)
    df["_hzd_rank"] = df.apply(lambda r: _compute_hzd_for_ranking(r["pl_orbsmax"], r["st_lum"]), axis=1)
    return df


# ---------------------------------------------------------------------------
# Category selection
# ---------------------------------------------------------------------------

def select_iconic(pool: pd.DataFrame) -> pd.DataFrame:
    targets = {normalize_name(n) for n in ICONIC_PLANETS}
    pool = pool.copy()
    pool["_norm"] = pool["pl_name"].apply(normalize_name)
    matched = pool[pool["_norm"].isin(targets)]
    missing = targets - set(matched["_norm"])
    if missing:
        print(f"  Iconic planets NOT found with complete data (excluded): {sorted(missing)}")
    return matched.drop(columns=["_norm"])


def select_high_esi(pool: pd.DataFrame, n: int) -> pd.DataFrame:
    ranked = pool.dropna(subset=["_esi_rank"]).sort_values("_esi_rank", ascending=False)
    return ranked.head(n)


def select_extreme(pool: pd.DataFrame, n: int) -> pd.DataFrame:
    """
    'Extreme/weird' score: combines three independent signals so the
    selection isn't dominated by just one axis (e.g. all hot Jupiters) --
    ultra-high temperature, very large radius (gas giant), and high
    orbital eccentricity each contribute, and we round-robin across the
    three so the final set has a mix of extremity types.
    """
    pool = pool.copy()
    ultra_hot = pool[pool["pl_eqt"] > 1500].sort_values("pl_eqt", ascending=False)
    giants = pool[pool["pl_rade"] > 8].sort_values("pl_rade", ascending=False)
    eccentric = pool[pool["pl_orbeccen"] > 0.4].sort_values("pl_orbeccen", ascending=False) \
        if "pl_orbeccen" in pool.columns else pool.head(0)

    selected_names = set()
    selected_rows = []
    for group in (ultra_hot, giants, eccentric):
        for _, row in group.iterrows():
            if row["pl_name"] not in selected_names and len(selected_rows) < n:
                selected_rows.append(row)
                selected_names.add(row["pl_name"])
        if len(selected_rows) >= n:
            break
    # round-robin backfill if one category was thin
    for group in (ultra_hot, giants, eccentric):
        if len(selected_rows) >= n:
            break
        for _, row in group.iterrows():
            if row["pl_name"] not in selected_names and len(selected_rows) < n:
                selected_rows.append(row)
                selected_names.add(row["pl_name"])

    return pd.DataFrame(selected_rows) if selected_rows else pool.head(0)


def select_hz_candidates(pool: pd.DataFrame, n: int) -> pd.DataFrame:
    in_zone = pool[pool["_hzd_rank"].abs() <= 1].copy()
    in_zone["_hzd_abs"] = in_zone["_hzd_rank"].abs()
    ranked = in_zone.sort_values("_hzd_abs", ascending=True)
    return ranked.head(n).drop(columns=["_hzd_abs"])


def select_multi_planet_systems(pool: pd.DataFrame, n: int) -> pd.DataFrame:
    """
    Prioritizes systems with the most known planets (sy_pnum), taking
    multiple planets per chosen system, spreading across a few different
    systems rather than exhausting the budget on just one.
    """
    system_sizes = pool.groupby("hostname")["pl_name"].nunique().sort_values(ascending=False)
    multi_systems = system_sizes[system_sizes >= 2]

    selected_rows = []
    for hostname in multi_systems.index:
        if len(selected_rows) >= n:
            break
        system_planets = pool[pool["hostname"] == hostname]
        for _, row in system_planets.iterrows():
            if len(selected_rows) >= n:
                break
            selected_rows.append(row)

    return pd.DataFrame(selected_rows) if selected_rows else pool.head(0)


def select_rest(pool: pd.DataFrame, n: int) -> pd.DataFrame:
    """Fill remaining slots with a star-type/size-varied sample."""
    if len(pool) == 0 or n <= 0:
        return pool.head(0)
    pool = pool.copy()
    pool["_star_class"] = pool["st_spectype"].astype(str).str[0].str.upper()
    pool["_size_bucket"] = pd.cut(pool["pl_rade"], bins=[0, 1.5, 2.5, 6, 1000],
                                    labels=["rocky", "super-earth", "neptune-like", "giant"])
    pool["_stratum"] = pool["_star_class"] + "_" + pool["_size_bucket"].astype(str)
    groups = {k: v.sample(frac=1, random_state=42).reset_index(drop=True) for k, v in pool.groupby("_stratum")}
    selected, idx, keys = [], 0, list(groups.keys())
    while len(selected) < n and keys:
        progressed = False
        for key in list(keys):
            g = groups[key]
            if idx < len(g):
                selected.append(g.iloc[idx])
                progressed = True
                if len(selected) >= n:
                    break
            else:
                keys.remove(key)
        if not progressed:
            break
        idx += 1
    return pd.DataFrame(selected).drop(columns=["_star_class", "_size_bucket", "_stratum"], errors="ignore") if selected else pool.head(0)


# ---------------------------------------------------------------------------
# Main curation orchestration
# ---------------------------------------------------------------------------

def curate_planets(df: pd.DataFrame) -> pd.DataFrame:
    complete = filter_complete(df)
    complete = add_ranking_fields(complete)

    selected_frames = {}
    used_names = set()

    def take(frame: pd.DataFrame, label: str):
        frame = frame[~frame["pl_name"].isin(used_names)].copy()
        frame["curationCategory"] = label
        selected_frames[label] = frame
        used_names.update(frame["pl_name"])
        return frame

    remaining = complete
    iconic = take(select_iconic(remaining), "iconic")
    remaining = complete[~complete["pl_name"].isin(used_names)]

    high_esi = take(select_high_esi(remaining, CATEGORY_TARGETS["high_esi"][1]), "high_esi")
    remaining = complete[~complete["pl_name"].isin(used_names)]

    extreme = take(select_extreme(remaining, CATEGORY_TARGETS["extreme"][1]), "extreme")
    remaining = complete[~complete["pl_name"].isin(used_names)]

    hz = take(select_hz_candidates(remaining, CATEGORY_TARGETS["hz_candidate"][1]), "hz_candidate")
    remaining = complete[~complete["pl_name"].isin(used_names)]

    multi = take(select_multi_planet_systems(remaining, CATEGORY_TARGETS["multi_planet"][1]), "multi_planet")
    remaining = complete[~complete["pl_name"].isin(used_names)]

    slots_left = max(TARGET_TOTAL - len(used_names), 0)
    rest = take(select_rest(remaining, slots_left), "rest")

    print("\nCuration breakdown:")
    for label, frame in selected_frames.items():
        print(f"  {label:<14} {len(frame)} planets")

    curated = pd.concat(selected_frames.values(), ignore_index=True).drop_duplicates(subset=["pl_name"])
    curated["_esi_rank_display"] = curated["_esi_rank"]
    curated["_hzd_rank_display"] = curated["_hzd_rank"]
    curated = curated.drop(columns=["_esi_rank", "_hzd_rank"], errors="ignore").reset_index(drop=True)

    print(f"\nTotal curated: {len(curated)} planets")
    if not (100 <= len(curated) <= 150):
        print(f"NOTE: total is outside the 100-150 target range -- review category "
              f"pool sizes above if this needs adjusting.")

    return curated


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading raw archive from {RAW_PATH}...")
    raw_df = load_raw_data()
    print(f"Loaded {len(raw_df)} rows.\n")

    curated_df = curate_planets(raw_df)

    curated_df.to_csv(OUTPUT_CURATED_CSV, index=False)
    print(f"\nSaved curated raw data -> {OUTPUT_CURATED_CSV}")

    names = sorted(curated_df["pl_name"].tolist())
    with open(OUTPUT_NAMELIST_PATH, "w") as f:
        f.write("\n".join(names))
    print(f"Saved finalized planet name list ({len(names)} planets) -> {OUTPUT_NAMELIST_PATH}")

    category_order = ["iconic", "high_esi", "extreme", "hz_candidate", "multi_planet", "rest"]
    category_labels = {
        "iconic": "FAMOUS / ICONIC PLANETS",
        "high_esi": "HIGH ESI SCORERS (most Earth-like)",
        "extreme": "EXTREME / WEIRD WORLDS",
        "hz_candidate": "STRONG HABITABLE ZONE CANDIDATES",
        "multi_planet": "MULTI-PLANET SYSTEMS",
        "rest": "REST (complete-data, rounding out the set)",
    }
    lines = []
    for cat in category_order:
        cat_df = curated_df[curated_df["curationCategory"] == cat].sort_values("pl_name")
        lines.append(f"=== {category_labels[cat]} ({len(cat_df)}) ===")
        for _, row in cat_df.iterrows():
            esi_val = f"{row['_esi_rank_display']:.3f}" if pd.notna(row.get("_esi_rank_display")) else "n/a"
            hzd_val = f"{row['_hzd_rank_display']:.2f}" if pd.notna(row.get("_hzd_rank_display")) else "n/a"
            trandur_val = f"{row['pl_trandur']:.2f}h" if pd.notna(row.get("pl_trandur")) else "n/a"
            lines.append(f"  {row['pl_name']:<22} ESI={esi_val:<7} HZD={hzd_val:<7} transitDuration={trandur_val}")
        lines.append("")
    with open(OUTPUT_NAMELIST_BY_CATEGORY_PATH, "w") as f:
        f.write("\n".join(lines))
    print(f"Saved category-grouped name list (with ESI/HZD/transitDuration for review) -> {OUTPUT_NAMELIST_BY_CATEGORY_PATH}")

    print("\n>>> STOPPING HERE per instructions -- review/send this name list "
          "before running build_exora_dataset.py to compute calculated fields. <<<")


if __name__ == "__main__":
    main()
