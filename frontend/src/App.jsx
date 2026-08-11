import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StarfieldBackground from './components/StarfieldBackground';
import { PlanetProvider } from './context/PlanetContext';

// Pages
import Home from './pages/Home';
import SearchExplore from './pages/SearchExplore';
import PlanetDetail from './pages/PlanetDetail';
import CompareWorlds from './pages/CompareWorlds';
import HabitabilityIndex from './pages/HabitabilityIndex'; // Now serving Earth Similarity Index (ESI)
import LightCurveLab from './pages/LightCurveLab';
import About from './pages/About';
import Resources from './pages/Resources';
import Learn from './pages/Learn';
import Crew from './pages/Crew'; // Added for Section 9

export default function App() {
  
  // Section 1: Global Rebrand Document Metadata Lifecycle Update
  useEffect(() => {
    document.title = "Exora | Open Data Explorer & Digital Observatory";
    
    // Dynamic Meta Description Sync for Rebranding
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Exora: An open data explorer and digital observatory to analyze transit light curves, calculate Earth Similarity Index, and search exoplanet archives.');
  }, []);

  return (
    <PlanetProvider>
      <Router>
        <div className="min-h-screen flex flex-col relative text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
          {/* Global Interactive Twinkling Canvas Starfield with Mouse Parallax */}
          <StarfieldBackground />

          <Navbar />
          
          <main className="flex-grow z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchExplore />} />
              <Route path="/planet/:planetId" element={<PlanetDetail />} />
              <Route path="/compare" element={<CompareWorlds />} />
              {/* Pointing to your existing view component cleanly via requested routes */}
              <Route path="/esi" element={<HabitabilityIndex />} />
              <Route path="/habitability" element={<HabitabilityIndex />} /> 
              <Route path="/lightcurve" element={<LightCurveLab />} />
              <Route path="/about" element={<About />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/crew" element={<Crew />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </PlanetProvider>
  );
}