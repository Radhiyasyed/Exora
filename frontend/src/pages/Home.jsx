import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, Globe, Orbit, Database, Compass, BarChart3, Eye, Rocket, X, Thermometer, ShieldCheck } from 'lucide-react';
import { usePlanets } from '../context/PlanetContext';
import Planet3DViewer from '../components/Planet3DViewer';

export default function Home() {
  const navigate = useNavigate();
  const { planets, getPlanetById } = usePlanets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

  // Default featured planet for hero
  const heroPlanet = getPlanetById('kepler-452b') || getPlanetById('kepler-452-b') || (planets && planets[0]) || {
    id: 'kepler-452b',
    name: 'Kepler-452b',
    radiusEarth: 1.63,
    equilibriumTempK: 265,
    esi: 0.84,
    esiScore: 0.84,
    starType: 'G-type (G2V)',
    distanceLy: 1786,
  };

  // 4 Featured Exoplanetary Worlds with distinct color themes
  const featuredPlanets = useMemo(() => {
    return [
      {
        id: 'kepler-452b',
        name: 'Kepler-452b',
        starType: 'G-type (G2V)',
        distanceLy: 1786,
        radiusEarth: 1.63,
        equilibriumTempK: 265,
        esi: 0.84,
        tagline: "Earth's Larger, Older Cousin",
        colorTheme: 'cyan',
      },
      {
        id: 'trappist-1e',
        name: 'TRAPPIST-1e',
        starType: 'M-type (Ultra-cool Dwarf)',
        distanceLy: 40,
        radiusEarth: 0.92,
        equilibriumTempK: 246,
        esi: 0.87,
        tagline: 'Temperate Rocky Terrestrial World',
        colorTheme: 'green',
      },
      {
        id: 'proxima-cen-b',
        name: 'Proxima Centauri b',
        starType: 'M-type (Red Dwarf)',
        distanceLy: 4.24,
        radiusEarth: 1.02,
        equilibriumTempK: 218,
        esi: 0.81,
        tagline: 'Closest Known Exoplanet Neighbor',
        colorTheme: 'blue',
      },
      {
        id: 'lhs-1140b',
        name: 'LHS 1140 b',
        starType: 'M-type (M4.5V)',
        distanceLy: 48.8,
        radiusEarth: 1.73,
        equilibriumTempK: 230,
        esi: 0.84,
        tagline: 'High-Density Ocean Candidate World',
        colorTheme: 'purple',
      },
    ];
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isWelcomeOpen) {
        setIsWelcomeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWelcomeOpen]);

  // Autocomplete suggestions
  const filteredSuggestions = planets && searchQuery.trim() !== ''
    ? planets.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.system?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-24 pb-20 relative">
      
      {/* ═══════════════════════════════════════════════════
          1. WELCOME POPUP MODAL (Rendered via React Portal)
          ═══════════════════════════════════════════════════ */}
      {isWelcomeOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setIsWelcomeOpen(false)}
        >
          <div 
            className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[88vh] my-auto flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button 
              onClick={() => setIsWelcomeOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400/50 z-30 w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-all"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto min-h-0 flex-1 p-6 sm:p-8 space-y-6">
              
              {/* Header with Title, Subtitle, Tagline and Sourced Data Box */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800/80 pr-8">
                <div className="space-y-1.5 max-w-md">
                  <span className="text-[10px] sm:text-[11px] font-mono-data font-bold text-cyan-400 tracking-widest uppercase block">
                    OPEN DATA EXPLORER • DIGITAL OBSERVATORY
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Welcome to Exora
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                    Your gateway to discovering and understanding worlds beyond our solar system.
                  </p>
                </div>

                {/* Sourced from NASA Exoplanet Archive Data visual box */}
                <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shrink-0 text-center space-y-1.5 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center">
                    <Planet3DViewer planet={heroPlanet} isHero={true} compact={true} className="w-full h-full" />
                  </div>
                  <span className="text-[9px] font-mono-data font-bold text-cyan-300 tracking-wider max-w-[130px] uppercase leading-tight">
                    SOURCED FROM NASA EXOPLANET ARCHIVE DATA
                  </span>
                </div>
              </div>

              {/* Middle Section: Did You Know & Refined Targets Stat Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left Card: Did you know */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-4 sm:p-5 rounded-2xl flex items-start space-x-3.5">
                  <span className="text-2xl pt-0.5" role="img" aria-label="lightbulb">💡</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold tracking-wider text-amber-300 uppercase">Did you know?</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      As you read this, light that left a distant star hundreds of years ago might be reaching us right now. Every data point you explore here is a real signal from a real world.
                    </p>
                  </div>
                </div>

                {/* Right Card: Refined Targets Stat Card */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-4 sm:p-5 rounded-2xl flex items-start space-x-3.5">
                  <span className="text-2xl pt-0.5 text-cyan-400" role="img" aria-label="telescope">🔭</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold tracking-wider text-cyan-300 uppercase">
                      100+ Refined Targets Synced
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Kepler • TESS • NASA Archive
                    </p>
                  </div>
                </div>
              </div>

              {/* "How to use Exora?" Section: 3 items */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  How to use Exora?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 hover:border-cyan-500/30 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center text-xs font-bold font-mono">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white">Search & Explore</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Filter and query cataloged worlds by physical, thermal, and orbital parameters.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 hover:border-indigo-500/30 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-bold font-mono">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white">Analyze & Compare</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Evaluate Earth Similarity Index (ESI), habitability zones, and planetary metrics.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 hover:border-purple-500/30 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold font-mono">
                      <Eye className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs font-bold text-white">Validate & Visualize</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Inspect transit light curves, examine 3D planetary models, and verify signals.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Banner */}
              <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
                <p className="text-xs sm:text-sm font-semibold text-slate-200">
                  Ready to begin your cosmic mission?
                </p>
                <div>
                  <button 
                    onClick={() => setIsWelcomeOpen(false)} 
                    className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs sm:text-sm py-3 px-8 rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.3)] transition transform active:scale-95 duration-150"
                  >
                    <Rocket className="w-4 h-4 text-slate-950" />
                    <span>Initialize Digital Observatory</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Let's explore the universe, one planet at a time.
                </p>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════════════════
          2. HOME PAGE: HERO SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="relative pt-10 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-data tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>NASA Exoplanet Archive Calibrated • 6,128+ Confirmed</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Explore Worlds Beyond <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
                  Our Solar System
                </span>
              </h1>
              
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                Leave orbit. Across the cosmic dark, thousands of alien worlds are waiting to be explored. Dive into real astronomical data, compare extraordinary exoplanets, trace the light curves that reveal them, and uncover which worlds may hold the potential for habitability.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="relative max-w-xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsAutocompleteOpen(true); }}
                  onFocus={() => setIsAutocompleteOpen(true)}
                  placeholder="Search exoplanets (e.g. Kepler-452b, TRAPPIST-1e)..."
                  className="w-full pl-12 pr-32 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-cyan-400 shadow-2xl transition-all font-mono-data"
                />
                <button 
                  onClick={() => navigate('/search')} 
                  className="absolute right-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:brightness-110 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1.5 shadow-md"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Autocomplete Dropdown */}
              {isAutocompleteOpen && searchQuery.trim() !== '' && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden z-40 max-h-64 overflow-y-auto bg-slate-950/95 backdrop-blur-md">
                  {filteredSuggestions.map((planet) => (
                    <button 
                      key={planet.id} 
                      onClick={() => { setSearchQuery(''); setIsAutocompleteOpen(false); navigate(`/planet/${planet.id}`); }} 
                      className="w-full px-4 py-3 text-left hover:bg-cyan-500/10 flex items-center justify-between text-xs border-b border-slate-800/60 last:border-0 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{planet.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono-data">
                          {planet.starType || 'Host Star'} • ESI {Number(planet.esi ?? planet.esiScore ?? 0).toFixed(2)}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Floating 3D Planetary Sphere with ExoVista Orbit Rings */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-6">
            <div className="relative w-full max-w-[440px] h-[400px] sm:h-[440px] flex items-center justify-center">
              
              {/* Freely Floating 3D Planet Viewer */}
              <div className="w-full h-full flex items-center justify-center relative">
                <Planet3DViewer key={heroPlanet.id} planet={heroPlanet} isHero={true} className="w-full h-full" />
              </div>

              {/* Floating Data Badge 1: Radius (Top Left) */}
              <div className="absolute top-3 left-2 sm:left-0 bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-full shadow-xl z-20 flex items-center space-x-2 text-xs font-mono-data text-cyan-300">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <span className="text-slate-400">Radius:</span>
                <span className="font-bold text-cyan-300">
                  {heroPlanet.radiusEarth ? `${Number(heroPlanet.radiusEarth).toFixed(2)} R⊕` : '1.63 R⊕'}
                </span>
              </div>

              {/* Floating Data Badge 2: ESI Score (Bottom Left / Center) */}
              <div className="absolute bottom-4 left-4 sm:left-2 bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 px-3.5 py-1.5 rounded-full shadow-xl z-20 flex items-center space-x-2 text-xs font-mono-data text-cyan-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-slate-400">ESI Score:</span>
                <span className="font-bold text-emerald-300">
                  {Number(heroPlanet.esi ?? heroPlanet.esiScore ?? 0.84).toFixed(2)}
                </span>
              </div>

              {/* Floating Data Badge 3: Temperature (Bottom Right) */}
              <div className="absolute bottom-4 right-4 sm:right-2 bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 px-3.5 py-1.5 rounded-full shadow-xl z-20 flex items-center space-x-2 text-xs font-mono-data text-cyan-300">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                <span className="text-slate-400">Temp:</span>
                <span className="font-bold text-indigo-300">
                  {heroPlanet.equilibriumTempK ? `~${Number(heroPlanet.equilibriumTempK).toFixed(0)} K` : '~265 K'}
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          3. HOME PAGE: SECTION 2: STATS WIDGETS ROW
          (Official Archive Totals & PHL Candidate Counts)
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Confirmed Exoplanets */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Confirmed Exoplanets</span>
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono-data">
              6,128+
            </div>
            <div className="text-[11px] text-cyan-400 font-mono-data font-semibold">
              NASA Archive Official Total
            </div>
          </div>

          {/* Card 2: Habitable Zone Candidates */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Habitable Zone Candidates</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono-data">
              70
            </div>
            <div className="text-[11px] text-emerald-400 font-mono-data font-semibold">
              29 terrestrial
            </div>
          </div>

          {/* Card 3: Planetary Systems */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Planetary Systems</span>
              <Orbit className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono-data">
              4,530+
            </div>
            <div className="text-[11px] text-indigo-400 font-mono-data font-semibold">
              1,061 multi-planet
            </div>
          </div>

          {/* Card 4: Data Archive Size */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Data Archive Size</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono-data">
              14.2 TB
            </div>
            <div className="text-[11px] text-purple-400 font-mono-data font-semibold">
              NASA Kepler/TESS
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          4. HOME PAGE: SECTION 3: FEATURED EXOPLANETARY WORLDS
          (Clean visual-first cards with distinct 3D thumbnails)
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-mono-data font-bold text-cyan-400 uppercase tracking-widest">
              ASTRONOMICAL BENCHMARKS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Featured Exoplanetary Worlds
            </h2>
          </div>
          <Link
            to="/search"
            className="text-xs font-mono-data text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <span>Explore Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPlanets.map((planet) => {
            const esi = Number(planet.esi ?? planet.esiScore ?? 0);
            return (
              <div 
                key={planet.id}
                className="glass-panel glass-panel-hover p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)] flex flex-col justify-between items-center text-center space-y-5 transition-all group"
              >
                {/* 3D Planet Thumbnail */}
                <div className="w-20 h-20 flex items-center justify-center pt-2">
                  <Planet3DViewer 
                    planet={planet} 
                    compact={true} 
                    size={68} 
                    colorTheme={planet.colorTheme} 
                  />
                </div>

                {/* Identity & Short Tagline */}
                <div className="space-y-1.5 w-full">
                  <h3 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors">
                    {planet.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {planet.tagline}
                  </p>
                </div>

                {/* Clean ESI Metric Highlight */}
                <div className="w-full pt-3 pb-1 border-t border-slate-800/80 flex flex-col items-center">
                  <span className="text-[10px] font-mono-data text-slate-400 uppercase tracking-wider">
                    Earth Similarity Index
                  </span>
                  <span className="text-2xl font-black font-mono-data text-cyan-400 pt-0.5">
                    {esi.toFixed(2)}
                  </span>
                </div>

                {/* Explore Action Button */}
                <Link
                  to={`/planet/${planet.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500/20 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <span>Analyze World</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          5. HOME PAGE: SECTION 4: FROM STARLIGHT TO WORLDS
          (Exact restored 4 steps and bottom CTA banner)
          ═══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            From Starlight to Worlds
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Follow the science behind the discovery of distant planets, and explore what their data can tell us.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono-data font-bold text-cyan-400 uppercase tracking-wider block">
                STEP 01 (DISCOVER)
              </span>
              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-base">Find the Worlds</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Search confirmed exoplanets and uncover the systems hidden in the data.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono-data font-semibold text-cyan-400/80 pt-3 border-t border-slate-800/80">
              EXPLORE • SEARCH • DISCOVER
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono-data font-bold text-indigo-400 uppercase tracking-wider block">
                STEP 02 (ANALYZE)
              </span>
              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-base">Read Their Shadows</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Explore transit light curves and see how a tiny dip in starlight can reveal an entire world.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono-data font-semibold text-indigo-400/80 pt-3 border-t border-slate-800/80">
              LIGHT CURVES • TRANSITS • DATA
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono-data font-bold text-purple-400 uppercase tracking-wider block">
                STEP 03 (COMPARE)
              </span>
              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-base">How Earth-Like Is It?</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Compare planetary properties and calculate their Earth Similarity Index against familiar Earth benchmarks.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono-data font-semibold text-purple-400/80 pt-3 border-t border-slate-800/80">
              PROPERTIES • ESI • BENCHMARKS
            </div>
          </div>

          {/* Step 4 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono-data font-bold text-emerald-400 uppercase tracking-wider block">
                STEP 04 (ASSESS)
              </span>
              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-base">Could It Be Habitable?</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Explore temperature, size, orbital conditions, and other indicators to investigate a planet's potential habitability.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono-data font-semibold text-emerald-400/80 pt-3 border-t border-slate-800/80">
              HABITABILITY • CONDITIONS • LIFE
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.08)] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to explore a world beyond our own?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Launch the open target search catalogs immediately.
            </p>
          </div>
          <Link
            to="/search"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:brightness-110 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg transition-all transform active:scale-95 shrink-0"
          >
            <span>Enter the Observatory →</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
