"""
clean_and_habitability.py  (v2 -- documented, citable formula)

Data Engineering Lead task, step 2:
  1. Clean the raw exoplanet sample -- resolve missing values and check
     for unit inconsistencies.
  2. Compute a Habitability Index based on the published Earth Similarity
     Index (ESI) methodology:

        Schulze-Makuch, D. et al. (2011). "A Two-Tiered Approach to
        Assessing the Habitability of Exoplanets." Astrobiology, 11(10).

     ESI formula:
        ESI = PRODUCT_i ( 1 - |x_i - x_i,earth| / (x_i + x_i,earth) )^(w_i/n)

     We compute two published sub-indices and combine them:
        - Interior ESI: uses radius and bulk density (density derived
          from radius + mass -- this is the standard "is it rocky like
          Earth" measure).
        - Surface ESI: uses equilibrium temperature.
     Overall ESI = sqrt(Interior_ESI * Surface_ESI), matching the
     two-tiered structure in the source paper.

Input:  data/raw/pscomppars_sample.csv
Output: data/processed/pscomppars_clean_with_hi.csv
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = PROJECT_ROOT / "data" / "raw" / "pscomppars_sample.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_PATH = PROCESSED_DIR / "pscomppars_clean_with_hi.csv"

EARTH_RADIUS = 1.0
EARTH_DENSITY = 5.51
EARTH_EQT = 255.0

WEIGHTS = {
    "radius": 0.57,
    "density": 1.07,
    "temperature": 5.58,
}

VALID_RANGES = {
    "pl_rade": (0, 30),
    "pl_bmasse": (0, 5000),
    "pl_eqt": (0, 4000),
    "pl_orbsmax": (0, 100),
    "st_teff": (2000, 50000),
}

EARTH_RADIUS_KM = 6371.0
EARTH_MASS_KG = 5.972e24
# Converts kg/km^3 -> g/cm^3: (1000 g/kg) / (1e15 cm^3/km^3) = 1e-12
KG_KM3_TO_G_CM3 = 1e-12


def load_raw_data(path: Path = RAW_PATH) -> pd.DataFrame:
    if not path.exists():
        print(f"ERROR: raw data not found at {path}. Run query_exoplanet_archive.py first.", file=sys.stderr)
        sys.exit(1)
    return pd.read_csv(path)


def report_missing_values(df: pd.DataFrame) -> None:
    missing = df.isna().sum()
    total = len(df)
    print("Missing value report:")
    for col in df.columns:
        pct = (missing[col] / total * 1000) if total else 0
        print(f"  {col:<12} {missing[col]:>4} missing  ({pct:5.1f}%)")


def flag_unit_inconsistencies(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col, (low, high) in VALID_RANGES.items():
        if col in df.columns:
            df[f"{col}_out_of_range"] = ~df[col].between(low, high) & df[col].notna()
    return df


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    before = len(df)
    df = df.dropna(subset=["pl_name"])
    df = flag_unit_inconsistencies(df)
    out_of_range_cols = [c for c in df.columns if c.endswith("_out_of_range")]
    bad_rows = df[out_of_range_cols].any(axis=1)
    df = df[~bad_rows].drop(columns=out_of_range_cols)
    after = len(df)
    print(f"Cleaning: {before} rows -> {after} rows ({before - after} dropped: missing name or out-of-range values)")
    return df.reset_index(drop=True)


def compute_density_g_cm3(radius_earth: float, mass_earth: float) -> float:
    if pd.isna(radius_earth) or pd.isna(mass_earth) or radius_earth <= 0:
        return np.nan
    radius_km = radius_earth * EARTH_RADIUS_KM
    mass_kg = mass_earth * EARTH_MASS_KG
    volume_km3 = (4 / 3) * np.pi * radius_km ** 3
    density_kg_km3 = mass_kg / volume_km3
    density_g_cm3 = density_kg_km3 * KG_KM3_TO_G_CM3
    return density_g_cm3


def esi_term(value: float, earth_value: float, weight: float) -> float:
    if pd.isna(value) or value <= 0:
        return np.nan
    base = 1 - abs(value - earth_value) / (value + earth_value)
    if base <= 0:
        return 0.0
    return base ** weight


def compute_habitability_index(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["pl_density"] = df.apply(lambda row: compute_density_g_cm3(row["pl_rade"], row["pl_bmasse"]), axis=1)

    radius_term = df["pl_rade"].apply(lambda v: esi_term(v, EARTH_RADIUS, WEIGHTS["radius"]))
    density_term = df["pl_density"].apply(lambda v: esi_term(v, EARTH_DENSITY, WEIGHTS["density"]))
    temp_term = df["pl_eqt"].apply(lambda v: esi_term(v, EARTH_EQT, WEIGHTS["temperature"]))

    df["interior_esi"] = (radius_term * density_term) ** (1 / 2)
    df["surface_esi"] = temp_term
    df["habitability_index"] = np.sqrt(df["interior_esi"] * df["surface_esi"])
    return df


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Loading raw data from {RAW_PATH}...")
    raw_df = load_raw_data()
    print(f"Loaded {len(raw_df)} rows.\n")
    report_missing_values(raw_df)
    print()
    clean_df = clean_dataset(raw_df)
    print()
    print("Computing Earth Similarity Index (ESI)-based Habitability Index...")
    result_df = compute_habitability_index(clean_df)
    scored = result_df["habitability_index"].notna().sum()
    print(f"Habitability Index computed for {scored} / {len(result_df)} planets.\n")
    result_df = result_df.sort_values("habitability_index", ascending=False)
    result_df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved cleaned dataset + Habitability Index -> {OUTPUT_PATH}")
    top5 = result_df.dropna(subset=["habitability_index"]).head(5)
    if not top5.empty:
        print("\nTop 5 most Earth-like planets in this sample:")
        print(top5[["pl_name", "pl_rade", "pl_density", "pl_eqt", "habitability_index"]].to_string(index=False))


if __name__ == "__main__":
    main()

