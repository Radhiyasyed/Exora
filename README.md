# Exora: Planetary Exoplanet Dashboard 🪐

Exora is a comprehensive, interactive web dashboard designed to explore, visualize, and analyze exoplanetary data. By connecting directly to the NASA Exoplanet Archive (via Caltech's TAP service), Exora pipelines complex astrophysical metrics into an intuitive, responsive, and aesthetically stunning React-based frontend.

---

## 🌟 Key Features

### 🔭 Search & Explore
Browse through the vast catalog of confirmed exoplanets. Filter worlds by their host star type (G-type, M-type, etc.), size limits, temperature bounds, and Habitable Zone status.

### ⚖️ Compare Worlds
An advanced "Exoplanetary Comparison Grid" that allows you to pit up to four exoplanets against each other side-by-side. Featuring:
- **Unified Bubble Chart**: Plot exoplanets on a 3-axis scatter grid comparing Radius vs ESI Score, with visual sizing mapped to planetary scale.
- **Telemetry Snapshot**: Quick metric breakdowns mapping orbit, radius, mass, temperature, and habitability.

### 📈 Planetary Metrics Calculator 
A dynamic Habitability Index (PHI) and Earth Similarity Index (ESI) engine.
- **ESI Engine**: Powered by the Schulze-Makuch formulation.
- **PHI Engine**: Computes a 4-component geometric mean comparing planetary radius, bulk density, surface temperature proxy, and orbital characteristics.
- Includes beautiful **LaTeX-rendered** formula breakdowns (via `react-katex`) and side-by-side gauge visualizations.

### 🔬 Light Curve Lab
An interactive transit visualization module simulating planetary transits across a host star. It includes synchronized visual dips and dynamic phase tracking, perfect for learning how we actually discover these distant worlds.

### 📚 Exora Learn & Data Dictionary
Integrated educational guides built for students and enthusiasts. Easily digest topics spanning from Kepler's Laws and Transit Photometry to Habitability criteria.

---

## 🏗️ Architecture & Tech Stack

Exora is structured as a decoupled monorepo. 

### Frontend (`/frontend`)
A modern, dark-themed Single Page Application heavily utilizing glassmorphism and data-driven visualization.
- **Core Engine**: React 19 + Vite
- **Styling**: Tailwind CSS (v4)
- **Data Visualization**: Recharts (for scatter & bar charts), Three.js (for 3D planet rendering)
- **Icons & Typography**: Lucide React, Google Fonts (`Inter`, `Space Mono`, `Outfit`)
- **Math Rendering**: KaTeX (`react-katex`)

### Backend (`/backend`)
A lightweight, fast data pipeline designed to ingest and serve processed astrophysical data.
- **Core Engine**: Python 3 + FastAPI
- **Data Pipeline**: Connects to the NASA/Caltech Exoplanet Archive TAP sync endpoint via ADQL.
- **Processing**: Pandas for data wrangling, cleaning (`pscomppars` table), and dynamic ESI/PHI pre-calculation.

---

## 🚀 Getting Started

### 1. Setup the Backend Data Pipeline
```bash
cd backend
python3 -m venv .venv
# Activate the virtual environment
source .venv/bin/activate      # Mac/Linux
.venv\Scripts\activate         # Windows
# Install dependencies
pip install -r requirements.txt
# Run the data ingestion script to pull sample data
python src/query_exoplanet_archive.py
# Start the FastAPI server
uvicorn src.server:app --reload
```

### 2. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
# Install node dependencies
npm install
# Start the Vite development server
npm run dev
```

Navigate to `http://localhost:5173` to explore the Exora dashboard!

---

## 📂 Project Structure

```
Exora/
├── backend/
│   ├── data/
│   │   ├── raw/             # Raw ADQL pull from NASA Exoplanet Archive
│   │   └── processed/       # Cleaned datasets with computed indices
│   ├── docs/                # Generated data dictionaries
│   └── src/
│       ├── query_exoplanet_archive.py  # TAP integration script
│       └── server.py                   # FastAPI application
└── frontend/
    ├── src/
    │   ├── api/             # API connection to Python backend
    │   ├── components/      # Shared React components (Nav, Modals, Cards)
    │   ├── context/         # React Context providers (PlanetContext)
    │   ├── data/            # Static fallbacks and educational JSON data
    │   └── pages/           # Core Views (CompareWorlds, SearchExplore, LightCurveLab, etc.)
    └── package.json         # Vite configuration and dependencies
```

---

## 🧪 Data Methodology
Exora relies on the `pscomppars` (Planetary Systems Composite Parameters) table to ensure one unified "best-estimate" row per confirmed planet. All missing distance and orbital calculations are dynamically processed to avoid UI rendering crashes, with robust fallback chains applied down to parsing raw description strings.
