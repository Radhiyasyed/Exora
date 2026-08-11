# Exoplanet Archive Data Pipeline — Setup

## Project structure

```
exoplanet-project/
├── requirements.txt
├── README.md
├── src/
│   └── query_exoplanet_archive.py   # pulls sample data + data dictionary
├── data/
│   └── raw/                         # sample CSV lands here
└── docs/
    └── (table)_data_dictionary.csv  # generated field reference
```

## 1. Set up the environment

```bash
cd exoplanet-project
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Run the initial script

```bash
python src/query_exoplanet_archive.py
```

This will:
1. Query the TAP service for the first 100 rows of the `pscomppars`
   (Planetary Systems Composite Parameters) table, restricted to six
   target columns (see below).
2. Save that sample to `data/raw/pscomppars_sample.csv`.
3. Query `TAP_SCHEMA.columns` to pull the official name, description,
   unit, and datatype for those same six fields.
4. Save that as `docs/pscomppars_data_dictionary.csv` — your starting
   data dictionary.

### Target columns

| Column | Meaning | Unit |
|---|---|---|
| `pl_name` | Planet name | — |
| `pl_rade` | Planet radius | Earth radii (R⊕) |
| `pl_bmasse` | Planet mass (best estimate) | Earth masses (M⊕) |
| `pl_eqt` | Planet equilibrium temperature | Kelvin (K) |
| `pl_orbsmax` | Orbital semi-major axis | Astronomical Units (AU) |
| `st_teff` | Host star effective temperature | Kelvin (K) |

To change the field set, edit `TARGET_COLUMNS` in
`src/query_exoplanet_archive.py`.

## 3. Sanity-check the pull

```python
import pandas as pd
df = pd.read_csv("data/raw/pscomppars_sample.csv")
print(df.shape)
print(df.head())
```

## Notes on the TAP service

- Endpoint: `https://exoplanetarchive.ipac.caltech.edu/TAP/sync`
- Query language: ADQL (an astronomy-flavored SQL dialect).
- Key tables:
  - `pscomppars` — one row per confirmed planet, best-available value
    per parameter. Easiest starting point.
  - `ps` — one row per *reported measurement* (a planet can have many
    rows from different publications). Use this if you need to track
    provenance or compare measurements across papers.
- Full column reference (web): https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html
- General TAP usage docs: https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html

## Next steps after this task

- Scale the sample query up (raise/remove `TOP 100`, add `WHERE` clauses
  to filter by discovery method, year, etc.).
- Review the generated data dictionary and annotate any fields that
  need extra context for downstream analysis.
- Consider switching to the `ps` table if measurement-level detail
  (rather than one best value per planet) turns out to matter for the
  project.
