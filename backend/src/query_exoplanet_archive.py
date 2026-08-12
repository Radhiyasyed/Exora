"""
query_exoplanet_archive.py

Initial script to query the NASA Exoplanet Archive's TAP (Table Access
Protocol) service, pull a first sample dataset, and auto-generate a data
dictionary (field name, description, unit, datatype) from the archive's
own schema metadata.

TAP endpoint docs:
https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html
"""

import io
import sys
import requests
import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

TAP_SYNC_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

# "pscomppars" = Planetary Systems Composite Parameters (one row per planet,
# best-available value for each parameter). Good default for a first sample.
# Use "ps" instead if you want every reported measurement per planet.
TABLE_NAME = "pscomppars"

SAMPLE_ROW_LIMIT = 1000

# Columns of interest: planet name, radius, mass, equilibrium temperature,
# orbital semi-major axis, and host star temperature. This is the minimal
# field set needed to characterize a planet's size, thermal environment,
# and host star -- enough to start reasoning about habitability/composition.
TARGET_COLUMNS = [
    "pl_name",     # planet name
    "pl_rade",     # planet radius (Earth radii)
    "pl_bmasse",   # planet mass, best estimate (Earth masses)
    "pl_eqt",      # planet equilibrium temperature (Kelvin)
    "pl_orbsmax",  # orbital semi-major axis (AU)
    "st_teff",     # host star effective temperature (Kelvin)
    "st_rad",      # host star radius (Solar radii)
]

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
DOCS_DIR = PROJECT_ROOT / "docs"


# ---------------------------------------------------------------------------
# Core query function
# ---------------------------------------------------------------------------

def run_tap_query(adql_query: str, fmt: str = "csv") -> str:
    """
    Send a synchronous ADQL query to the TAP service and return the raw
    response text.
    """
    params = {
        "query": adql_query,
        "format": fmt,
    }
    response = requests.get(TAP_SYNC_URL, params=params, timeout=60)
    response.raise_for_status()
    return response.text


# ---------------------------------------------------------------------------
# Step 1: Pull a first sample dataset
# ---------------------------------------------------------------------------

def fetch_sample_dataset(table_name: str = TABLE_NAME,
                          columns: list = TARGET_COLUMNS,
                          limit: int = SAMPLE_ROW_LIMIT) -> pd.DataFrame:
    """
    Pull a limited sample of confirmed rows -- restricted to `columns` --
    from the given table so we can validate the pipeline end-to-end before
    scaling up to a full pull. Selecting only the columns we need keeps the
    payload focused on the analysis while honoring confirmed status.
    """
    column_list = ", ".join(columns)
    query = (
        f"SELECT TOP {limit} {column_list} "
        f"FROM {table_name} "
    )
    raw_csv = run_tap_query(query, fmt="csv")
    df = pd.read_csv(io.StringIO(raw_csv))
    return df


# ---------------------------------------------------------------------------
# Step 2: Build a data dictionary from the archive's own column metadata
# ---------------------------------------------------------------------------

def fetch_data_dictionary(table_name: str = TABLE_NAME,
                           columns: list = TARGET_COLUMNS) -> pd.DataFrame:
    """
    The TAP service exposes its own schema via the TAP_SCHEMA.columns table.
    Querying it gives us, for each field in `columns`: the column name,
    a human-readable description, the unit, and the datatype -- exactly what
    a data dictionary needs, generated straight from the source of truth.
    Restricted to `columns` so the dictionary matches exactly what's in the
    sample dataset (no unused fields cluttering the docs).
    """
    quoted_columns = ", ".join(f"'{c}'" for c in columns)
    query = (
        "SELECT column_name, description, unit, datatype "
        "FROM TAP_SCHEMA.columns "
        f"WHERE table_name = '{table_name}' "
        f"AND column_name IN ({quoted_columns}) "
        "ORDER BY column_name"
    )
    raw_csv = run_tap_query(query, fmt="csv")
    df = pd.read_csv(io.StringIO(raw_csv))
    return df


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Querying TAP service for a {SAMPLE_ROW_LIMIT}-row sample "
          f"from '{TABLE_NAME}'...")
    try:
        sample_df = fetch_sample_dataset()
    except requests.RequestException as e:
        print(f"ERROR: sample data query failed: {e}", file=sys.stderr)
        sys.exit(1)

    sample_path = RAW_DATA_DIR / f"{TABLE_NAME}_sample.csv"
    sample_df.to_csv(sample_path, index=False)
    print(f"Saved {len(sample_df)} rows x {len(sample_df.columns)} columns "
          f"-> {sample_path}")

    print(f"\nQuerying TAP_SCHEMA.columns for '{TABLE_NAME}' field "
          f"definitions...")
    try:
        dict_df = fetch_data_dictionary()
    except requests.RequestException as e:
        print(f"ERROR: data dictionary query failed: {e}", file=sys.stderr)
        sys.exit(1)

    dict_path = DOCS_DIR / f"{TABLE_NAME}_data_dictionary.csv"
    dict_df.to_csv(dict_path, index=False)
    print(f"Saved {len(dict_df)} field definitions -> {dict_path}")

    print("\nDone. Next steps: review the data dictionary for fields "
          "relevant to your analysis, then scale up the sample query "
          "(remove/raise TOP limit, add WHERE/column filters as needed).")


if __name__ == "__main__":
    main()
