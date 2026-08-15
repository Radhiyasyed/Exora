"""
query_exoplanet_archive.py  (Exora v1 -- full archive pull)

Pulls the FULL NASA Exoplanet Archive confirmed-planet catalog
(pscomppars table), with every raw field needed downstream for the
Exora app's calculated fields (ESI, gravity, HZD, transit depth/duration).

No row limit is applied here -- this intentionally pulls everything
currently in the archive (several thousand rows). Curation down to the
target 100-150 planets happens in the next script, build_exora_dataset.py,
which needs the full set to be able to prioritize/select from.
"""

import io
import sys
import requests
import pandas as pd
from pathlib import Path

TAP_SYNC_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
TABLE_NAME = "pscomppars"

# Raw fields required by the Exora spec, plus st_rad (needed for
# transitDepth) and pl_trandur (archive-provided transit duration, used
# when available before falling back to an approximation).
TARGET_COLUMNS = [
    "pl_name",
    "pl_rade",       # planet radius, Earth radii
    "pl_bmasse",     # planet mass, Earth masses
    "pl_eqt",        # equilibrium temperature, K
    "pl_orbsmax",    # orbital semi-major axis, AU
    "pl_orbper",     # orbital period, days
    "st_lum",        # stellar luminosity, log10(L/Lsun) as archived
    "st_teff",       # stellar effective temperature, K
    "st_spectype",   # star spectral type, e.g. "G2 V"
    "st_rad",        # stellar radius, solar radii -- needed for transitDepth
    "discoverymethod",
    "disc_year",
    "pl_trandur",    # transit duration, hours (archive-provided, may be null)
]

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
OUTPUT_PATH = RAW_DATA_DIR / "pscomppars_full.csv"


def run_tap_query(adql_query: str, fmt: str = "csv") -> str:
    params = {"query": adql_query, "format": fmt}
    response = requests.get(TAP_SYNC_URL, params=params, timeout=120)
    response.raise_for_status()
    return response.text


def fetch_full_archive() -> pd.DataFrame:
    column_list = ", ".join(TARGET_COLUMNS)
    # No TOP clause -- pull every confirmed planet currently in the archive
    query = f"SELECT {column_list} FROM {TABLE_NAME}"
    raw_csv = run_tap_query(query, fmt="csv")
    return pd.read_csv(io.StringIO(raw_csv))


def main():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    print("Querying full NASA Exoplanet Archive (pscomppars, all rows)...")
    try:
        df = fetch_full_archive()
    except requests.RequestException as e:
        print(f"ERROR: archive query failed: {e}", file=sys.stderr)
        sys.exit(1)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved {len(df)} total rows -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
