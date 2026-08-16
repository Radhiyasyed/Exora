"""
curate_planets.py

Exora data pipeline, STAGE 1 (stops here -- no calculations yet).

Loads the full raw archive pull and curates it down to a target list of
100-150 planets:
  - Requires complete data on the core raw fields (no major gaps).
  - Always includes a hand-picked list of well-known/significant planets,
    if present with complete data.
  - Fills the remainder with a variety-maximizing selection across star
    spectral type and planet size, so the set spans different star types
    and planet sizes rather than clustering.

Output: just the curated raw data + a plain-text name list -- intended
to be reviewed/sent to the content lead BEFORE any calculated fields
(ESI, gravity, HZD, etc.) are computed in stage 2 (build_exora_dataset.py).
"""

import sys
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = PROJECT_ROOT / "data" / "raw" / "pscomppars_full.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
DASHBOARD_DIR = PROJECT_ROOT / "data" / "dashboard"
OUTPUT_CURATED_CSV = PROCESSED_DIR / "exora_curated_raw.csv"
OUTPUT_NAMELIST_PATH = DASHBOARD_DIR / "exora_planet_namelist.txt"

TARGET_COUNT_MIN = 100
TARGET_COUNT_MAX = 150

REQUIRED_COMPLETE_FIELDS = [
    "pl_name", "pl_rade", "pl_bmasse", "pl_eqt", "pl_orbsmax",
    "pl_orbper", "st_lum", "st_teff", "st_spectype",
]

SIGNIFICANT_PLANETS = [
    "Kepler-452 b", "TRAPPIST-1 e", "Proxima Cen b", "WASP-12 b",
    "TRAPPIST-1 d", "TRAPPIST-1 f", "TRAPPIST-1 g", "Kepler-186 f",
    "Kepler-22 b", "TOI-700 d", "51 Peg b", "HD 209458 b",
    "GJ 1214 b", "K2-18 b", "LHS 1140 b",
]


def load_raw_data(path: Path = RAW_PATH) -> pd.DataFrame:
    if not path.exists():
        print(f"ERROR: raw archive not found at {path}. Run query_exoplanet_archive.py first.", file=sys.stderr)
        sys.exit(1)
    return pd.read_csv(path)


def normalize_name(name: str) -> str:
    return str(name).strip().lower().replace("  ", " ")


def select_variety_sample(pool: pd.DataFrame, n: int) -> pd.DataFrame:
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
              f"target minimum of {TARGET_COUNT_MIN}.")

    print(f"Final curated set: {len(curated)} planets")
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
    print("\n>>> STOPPING HERE per instructions -- review/send this name list "
          "before running build_exora_dataset.py to compute calculated fields. <<<")


if __name__ == "__main__":
    main()
