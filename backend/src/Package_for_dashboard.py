"""
package_for_dashboard.py

Data Engineering Lead task, step 3:
  1. Package the cleaned dataset + Habitability Index scores into a
     format the dashboard can consume directly (JSON, not CSV).
  2. Provide backend filter/sort functions the frontend developer can
     call directly, so filtering logic lives in one shared place
     instead of being reimplemented in JavaScript.

Input:  data/processed/pscomppars_clean_with_hi.csv
Output: data/dashboard/planets.json
"""

import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_PATH = PROJECT_ROOT / "data" / "processed" / "pscomppars_clean_with_hi.csv"
DASHBOARD_DIR = PROJECT_ROOT / "data" / "dashboard"
OUTPUT_PATH = DASHBOARD_DIR / "planets.json"

# Fields exposed to the dashboard -- renamed to friendlier keys so the
# frontend doesn't need to know NASA's internal column naming scheme.
FIELD_MAP = {
    "pl_name": "name",
    "pl_rade": "radiusEarth",
    "pl_bmasse": "massEarth",
    "pl_density": "densityGCm3",
    "pl_eqt": "eqTempK",
    "pl_orbsmax": "orbitAU",
    "st_teff": "starTempK",
    "habitability_index": "habitabilityIndex",
}


def load_processed_data(path: Path = INPUT_PATH) -> pd.DataFrame:
    if not path.exists():
        print(f"ERROR: processed data not found at {path}. "
              f"Run clean_and_habitability.py first.", file=sys.stderr)
        sys.exit(1)
    return pd.read_csv(path)


def to_dashboard_records(df: pd.DataFrame) -> list:
    """
    Convert the DataFrame into a list of clean JSON-ready dictionaries:
      - only the fields the dashboard actually needs (FIELD_MAP)
      - NaN replaced with None (NaN is not valid JSON; None -> null)
      - habitabilityIndex rounded for display
    """
    subset = df[list(FIELD_MAP.keys())].rename(columns=FIELD_MAP)
    records = subset.to_dict(orient="records")
    # Explicitly replace NaN with None (raw NaN is not valid JSON, so this
    # must happen before json.dump -- pandas' .replace(np.nan, None) is
    # unreliable across versions, so we do it value-by-value instead).
    for r in records:
        for k, v in r.items():
            if isinstance(v, float) and np.isnan(v):
                r[k] = None
        if r.get("habitabilityIndex") is not None:
            r["habitabilityIndex"] = round(r["habitabilityIndex"], 4)
    return records


# ---------------------------------------------------------------------------
# Backend filtering/sorting logic -- shared functions the frontend can call
# (either directly if this becomes a small local API, or reused as the
# reference implementation for equivalent frontend filtering).
# ---------------------------------------------------------------------------

def filter_planets(records: list, min_hi: float = None, max_hi: float = None,
                    min_radius: float = None, max_radius: float = None,
                    has_complete_data: bool = None) -> list:
    """
    Filter a list of planet records by Habitability Index range,
    radius range, and/or data completeness.
    """
    result = records
    if min_hi is not None:
        result = [r for r in result if r["habitabilityIndex"] is not None and r["habitabilityIndex"] >= min_hi]
    if max_hi is not None:
        result = [r for r in result if r["habitabilityIndex"] is not None and r["habitabilityIndex"] <= max_hi]
    if min_radius is not None:
        result = [r for r in result if r["radiusEarth"] is not None and r["radiusEarth"] >= min_radius]
    if max_radius is not None:
        result = [r for r in result if r["radiusEarth"] is not None and r["radiusEarth"] <= max_radius]
    if has_complete_data is True:
        result = [r for r in result if all(v is not None for v in r.values())]
    return result


def sort_planets(records: list, by: str = "habitabilityIndex", descending: bool = True) -> list:
    """
    Sort planet records by any field. Records with a null value for the
    sort field are pushed to the end regardless of direction.
    """
    with_value = [r for r in records if r.get(by) is not None]
    without_value = [r for r in records if r.get(by) is None]
    with_value.sort(key=lambda r: r[by], reverse=descending)
    return with_value + without_value


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading processed data from {INPUT_PATH}...")
    df = load_processed_data()
    print(f"Loaded {len(df)} rows.\n")

    records = to_dashboard_records(df)

    payload = {
        "generatedFrom": "pscomppars_clean_with_hi.csv",
        "planetCount": len(records),
        "fields": list(FIELD_MAP.values()),
        "planets": records,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"Saved dashboard-ready JSON -> {OUTPUT_PATH}")

    # Demonstrate the filter/sort functions the frontend dev can reuse
    top_habitable = sort_planets(records, by="habitabilityIndex", descending=True)[:5]
    print("\nDemo -- top 5 by Habitability Index (via sort_planets()):")
    for p in top_habitable:
        print(f"  {p['name']:<20} HI={p['habitabilityIndex']}")

    earthlike = filter_planets(records, min_hi=0.8, max_radius=1.5)
    print(f"\nDemo -- filter_planets(min_hi=0.8, max_radius=1.5): {len(earthlike)} planets match")


if __name__ == "__main__":
    main()
