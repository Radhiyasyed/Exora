# Exora 🪐
### Open Data Explorer • Digital Observatory

Exora is an interactive observatory in your browser, a dashboard for exploring, visualizing, and analyzing real exoplanet data. It pulls directly from the NASA Exoplanet Archive (via Caltech's TAP service) and turns dense astrophysical parameters into something you can actually see: search real worlds, compare them side by side, simulate the transits that first revealed them, and understand what makes a planet potentially habitable, all backed by real, published data, not placeholder numbers.

---

## 🌟 Key Features

### 🔭 Search & Explore
Browse the full catalog of confirmed exoplanets. Filter by host star type (G-type, M-type, and more), radius, equilibrium temperature, and habitability status, accurately, with every filter reflecting the planet's actual computed classification, not just a static label.

### ⚖️ Compare Worlds
An "Exoplanetary Comparison Grid" that lets you pit up to four exoplanets against each other side by side:
- **Unified Bubble Chart**: plot exoplanets on a scatter grid comparing Radius vs ESI Score, with bubble size mapped to planetary scale.
- **Telemetry Snapshot**: quick metric breakdowns covering orbit, radius, mass, temperature, and habitability.

### 📈 ExoCalc
A dynamic habitability engine built on two core, scientifically grounded indices:
- **ESI (Earth Similarity Index)**: powered by the Schulze-Makuch formulation, scoring how Earth-like a planet is based on radius, density, and temperature.
- **HZD (Habitable Zone Distance)**: measures how a planet's orbit sits relative to its star's habitable zone, flagging candidates that fall within the zone where liquid water could exist.

Includes clean, LaTeX-rendered formula breakdowns (via `react-katex`) alongside gauge visualizations, so the math is transparent, not a black box.

### 🔬 Light Curve Lab
A real transit-photometry simulator. Pick any planet in the catalog and watch its host star's brightness dip as the planet crosses in front of it, and dip again, more faintly, during its secondary eclipse behind the star. The depth of each dip isn't decorative: it's calculated from the planet's actual radius relative to its host star, so a small planet around a tiny star (like a TRAPPIST-1 world) can show a deeper, more dramatic transit than a larger planet around a Sun-like star, exactly how real transit surveys like Kepler and TESS find these worlds. Includes a synchronized orbital miniature and a full-orbit phased view spanning two orbital cycles for a clean, continuous curve.

### 📚 Learn
Built-in educational guides for students and enthusiasts, covering everything from Kepler's Laws and transit photometry to the criteria that define habitability, no external tabs or references needed to follow along.

---

## 🏗️ Architecture & Tech Stack

Exora is a decoupled monorepo, split cleanly between data and interface.

### Frontend (`/frontend`)
A dark-themed, glassmorphic single-page app built for data-dense, still-readable visualization.
- **Core Engine**: React 19 + Vite
- **Styling**: Tailwind CSS (v4)
- **Data Visualization**: Recharts (scatter & bar charts), Three.js (3D planet rendering)
- **Icons & Typography**: Lucide React, Google Fonts (`Inter`, `Space Mono`, `Outfit`)
- **Math Rendering**: KaTeX (`react-katex`)

### Backend (`/backend`)
A lightweight, fast data pipeline that ingests and serves processed astrophysical data.
- **Core Engine**: Python 3 + FastAPI
- **Data Pipeline**: Connects to the NASA/Caltech Exoplanet Archive TAP sync endpoint via ADQL.
- **Processing**: Pandas for data wrangling, cleaning (`pscomppars` table), and dynamic ESI/HZD pre-calculation.

---

## 🚀 Getting Started

### 1. Set up the Backend Data Pipeline
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

### 2. Set up the Frontend
Open a new terminal window:
```bash
cd frontend
# Install node dependencies
npm install
# Start the Vite development server
npm run dev
```

Navigate to `http://localhost:5173` to launch Exora locally.

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
    │   ├── components/      # Shared React components (Nav, Footer, Modals, Cards)
    │   ├── context/         # React Context providers (PlanetContext)
    │   ├── data/            # Static fallbacks and educational JSON data
    │   └── pages/           # Core Views (CompareWorlds, SearchExplore, LightCurveLab, ExoCalc, etc.)
    └── package.json         # Vite configuration and dependencies
```

---

## 🧪 Data Methodology
Exora relies on the `pscomppars` (Planetary Systems Composite Parameters) table to ensure one unified, best-estimate row per confirmed planet. Missing distance and orbital values are handled through robust fallback chains, down to parsing raw description strings when structured fields are absent, so the UI never crashes on incomplete data. It just degrades gracefully.
