import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { EXOPLANETS } from '../data/exoplanetsData';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isWelcomeOpen) {
        setIsWelcomeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWelcomeOpen]);

  // Filters catalog recommendations based on query safely
  const filteredSuggestions = EXOPLANETS ? EXOPLANETS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.system && p.system.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5) : [];

  return (
    <div className="space-y-20 pb-16 relative">
      
      {/* 3. Welcome Popup Modal Redesign */}
      {isWelcomeOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsWelcomeOpen(false)}
        >
          <div 
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-Right 'X' Close Button */}
            <button 
              onClick={() => setIsWelcomeOpen(false)} 
              className="absolute top-4 right-4 text-white bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 border border-slate-600 hover:border-cyan-500 text-lg font-black z-20 w-10 h-10 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="overflow-y-auto min-h-0 flex-1">
              {/* Top Section */}
            <div className="relative overflow-hidden p-6 border-b border-slate-800 bg-slate-900/50">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_70%)]"></div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">Welcome to Exora</h2>
                  <p className="text-xs font-bold text-cyan-400 tracking-widest uppercase">OPEN DATA EXPLORER • DIGITAL OBSERVATORY</p>
                </div>
                <div className="flex items-center gap-3 rounded-3xl bg-slate-950/60 border border-slate-800 px-4 py-3 shadow-inner">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-purple-500/20 flex items-center justify-center text-cyan-300 text-lg">
                    ✦
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Planet Graphic Preview</p>
                    <p className="text-[12px] text-slate-500">A polished orbital view of Exora's mission focus.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {/* Left Box with lightbulb icon */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-start space-x-3">
                <span className="text-2xl pt-0.5 text-yellow-400" role="img" aria-label="lightbulb">💡</span>
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-slate-300 uppercase mb-1">Did you know?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Some exoplanets orbit two suns simultaneously, casting dual shadows across strange alien landscapes.</p>
                </div>
              </div>
              {/* Right Box with telescope icon */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-start space-x-3">
                <span className="text-2xl pt-0.5 text-cyan-400" role="img" aria-label="telescope">🔭</span>
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-slate-300 uppercase mb-1">1000+ Refined Targets Synced</h4>
                  <p className="text-xs text-slate-400 font-semibold tracking-wide">Kepler • TESS • NASA Archive</p>
                </div>
              </div>
            </div>

            {/* Feature Grid Section */}
            <div className="px-6 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">How to use Exora?</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">01</div>
                  <h5 className="text-xs font-bold text-white mb-1">Search & Explore</h5>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">02</div>
                  <h5 className="text-xs font-bold text-white mb-1">Analyze & Compare</h5>
                </div>
                <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">03</div>
                  <h5 className="text-xs font-bold text-white mb-1">Validate & Visualize</h5>
                </div>
              </div>
            </div>

            {/* Bottom Banner */}
            <div className="p-6 bg-slate-900 border-t border-slate-800 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-300">Ready to begin your cosmic mission?</p>
              <button 
                onClick={() => setIsWelcomeOpen(false)} 
                className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs py-3 px-8 rounded-xl shadow-lg transition transform active:scale-95 duration-150"
              >
                Initialize Digital Observatory 🚀 →
              </button>
              <p className="text-[12px] text-slate-500">Let's explore the universe—one planet at a time. 🪐</p>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs sm:text-[12px] font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>NASA Exoplanet Archive Calibrated • 5,600+ Cataloged</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Explore Worlds Beyond <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Our Solar System</span>
            </h1>
            
            {/* 2. Home Tab Hero Text Update */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              Discover exoplanets unlike anything in our cosmic neighborhood. Compare their properties, explore their potential habitability, and uncover the light curves that reveal their existence, all through interactive astronomical data.
            </p>

            {/* Target Search Autocomplete Input Wrapper */}
            <div className="relative max-w-xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsAutocompleteOpen(true); }}
                  onFocus={() => setIsAutocompleteOpen(true)}
                  placeholder="Search exoplanets (e.g. Kepler-452b, TRAPPIST-1e)..."
                  className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-cyan-400 shadow-xl transition-all"
                />
                <button 
                  onClick={() => navigate('/search')} 
                  className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-semibold text-xs transition-all flex items-center space-x-1"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
                            {/* Search Dropdown */}
              {isAutocompleteOpen && searchQuery.trim() !== '' && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden z-30 max-h-64 overflow-y-auto bg-slate-950/95 backdrop-blur-md">
                  {filteredSuggestions.map((planet) => (
                    <button 
                      key={planet.id} 
                      onClick={() => { setSearchQuery(''); setIsAutocompleteOpen(false); navigate(`/planet/${planet.id}`); }} 
                      className="w-full px-4 py-3 text-left hover:bg-cyan-500/10 flex items-center justify-between text-xs border-b border-slate-800/60 last:border-0 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{planet.name}</div>
                        <div className="text-[12px] text-slate-400">{planet.starType || 'Unknown Host'} Star • {planet.distanceLy || '?'} LY</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Geometric Accent */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl -z-10" />
            <div className="absolute w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl -z-10" />
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Orbital Rings */}
              <svg className="absolute w-full h-full opacity-40 animate-[spin_40s_linear_infinite]" viewBox="0 0 400 400">
                <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="1.5" strokeDasharray="6 6" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
              </svg>
              
              {/* Refined Planet Sphere */}
              <div className="relative w-36 h-36 rounded-full overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.2)] z-10 border border-slate-700/50">
                {/* Base planet gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600 to-indigo-900" />
                
                {/* Crisp texture bands */}
                <div className="absolute top-[25%] -left-4 w-48 h-4 bg-cyan-400/20 rotate-[-15deg]" />
                <div className="absolute top-[50%] -left-4 w-48 h-6 bg-indigo-400/20 rotate-[-15deg]" />
                <div className="absolute bottom-[25%] -left-4 w-48 h-3 bg-cyan-300/10 rotate-[-15deg]" />

                {/* Subtle inner shadow for 3D depth */}
                <div className="absolute inset-0 rounded-full shadow-[inset_-8px_-8px_16px_rgba(0,0,0,0.5)]" />
              </div>

              {/* Orbiting Moon Dots */}
              <div className="absolute top-[15%] left-[25%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
              <div className="absolute bottom-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />

              {/* Stat Boxes */}
              <div className="absolute -top-4 -right-8 sm:-right-12 bg-slate-900/60 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-xl shadow-xl z-10 flex flex-col items-center">
                <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Radius</span>
                <span className="text-sm font-black text-cyan-400">1.04 R⊕</span>
              </div>
              <div className="absolute bottom-10 -left-6 sm:-left-12 bg-slate-900/60 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-xl shadow-xl z-10 flex flex-col items-center">
                <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Temp</span>
                <span className="text-sm font-black text-indigo-400">288 K</span>
              </div>
              <div className="absolute -bottom-4 right-2 sm:right-0 bg-slate-900/60 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-xl shadow-xl z-10 flex flex-col items-center">
                <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">HI Score</span>
                <span className="text-sm font-black text-green-400">0.92</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Observatory Pipeline Section Overhaul ("From Starlight to Worlds") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            From Starlight to Worlds
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Follow the science behind the discovery of distant planets — and explore what their data can tell us.
          </p>
        </div>

        {/* 4-Step Architecture Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Step 01 */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-56 hover:border-slate-700/60 transition-colors">
            <div>
              <div className="text-xs font-bold text-cyan-400 tracking-wider mb-2">STEP 01 (DISCOVER)</div>
              <h3 className="text-lg font-bold text-white mb-2">Find the Worlds</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Search confirmed exoplanets and uncover the systems hidden in the data.</p>
            </div>
            <div className="text-[12px] text-slate-500 font-bold uppercase tracking-widest pt-4 border-t border-slate-800/60">EXPLORE • SEARCH • DISCOVER</div>
          </div>

          {/* Step 02 */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-56 hover:border-slate-700/60 transition-colors">
            <div>
              <div className="text-xs font-bold text-cyan-400 tracking-wider mb-2">STEP 02 (ANALYZE)</div>
              <h3 className="text-lg font-bold text-white mb-2">Read Their Shadows</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Explore transit light curves and see how a tiny dip in starlight can reveal an entire world.</p>
            </div>
            <div className="text-[12px] text-slate-500 font-bold uppercase tracking-widest pt-4 border-t border-slate-800/60">LIGHT CURVES • TRANSITS • DATA</div>
          </div>

          {/* Step 03 */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-56 hover:border-slate-700/60 transition-colors">
            <div>
              <div className="text-xs font-bold text-cyan-400 tracking-wider mb-2">STEP 03 (COMPARE)</div>
              <h3 className="text-lg font-bold text-white mb-2">How Earth-Like Is It?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Compare planetary properties and calculate their Earth Similarity Index against familiar Earth benchmarks.</p>
            </div>
            <div className="text-[12px] text-slate-500 font-bold uppercase tracking-widest pt-4 border-t border-slate-800/60">PROPERTIES • ESI • BENCHMARKS</div>
          </div>

          {/* Step 04 */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-56 hover:border-slate-700/60 transition-colors">
            <div>
              <div className="text-xs font-bold text-cyan-400 tracking-wider mb-2">STEP 04 (ASSESS)</div>
              <h3 className="text-lg font-bold text-white mb-2">Could It Be Habitable?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Explore temperature, size, orbital conditions, and other indicators to investigate a planet's potential habitability.</p>
            </div>
            <div className="text-[12px] text-slate-500 font-bold uppercase tracking-widest pt-4 border-t border-slate-800/60">HABITABILITY • CONDITIONS • LIFE</div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/60 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-1">Ready to explore a world beyond our own?</h3>
            <p className="text-xs text-slate-400">Launch the open target search catalogs immediately.</p>
          </div>
          <button 
            onClick={() => navigate('/search')} 
            className="w-full md:w-auto bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs py-3.5 px-6 rounded-xl transition shadow-md whitespace-nowrap"
          >
            Enter the Observatory →
          </button>
        </div>
      </section>

    </div>
  );
}
