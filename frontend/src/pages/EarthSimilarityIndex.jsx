import React, { useState } from 'react';
import { Gauge, Sparkles, ChevronDown, ChevronUp, Calculator, Info, Orbit, HelpCircle } from 'lucide-react';

export default function EarthSimilarityIndex() {
  // 3 Dynamic Parameter Sliders
  const [radius, setRadius] = useState(1.63); // Earth radii
  const [density, setDensity] = useState(1.15); // Earth relative density
  const [flux, setFlux] = useState(1.10); // Solar irradiance relative to Earth

  const [isFormulaExpanded, setIsFormulaExpanded] = useState(false);
  const [isHIFormulaExpanded, setIsHIFormulaExpanded] = useState(false);

  // Compute live ESI scores and complementary habitability metrics
  const calculateESI = (r, d, f) => {
    const wR = 0.57;
    const wD = 1.07;
    const wF = 0.62;
    const esiR = Math.pow(1 - Math.abs(r - 1) / (r + 1), wR);
    const esiD = Math.pow(1 - Math.abs(d - 1) / (d + 1), wD);
    const esiF = Math.pow(1 - Math.abs(f - 1) / (f + 1), wF);
    return Math.max(0, Math.min(1.0, esiR * esiD * esiF));
  };

  const calculateHI = (r, d, f) => {
    const esiR = Math.pow(1 - Math.abs(r - 1) / (r + 1), 0.57);
    const esiD = Math.pow(1 - Math.abs(d - 1) / (d + 1), 1.07);
    const esiF = Math.pow(1 - Math.abs(f - 1) / (f + 1), 0.62);
    const hi = 0.45 * esiR + 0.30 * esiD + 0.25 * esiF;
    return Math.max(0, Math.min(1.0, hi));
  };

  const computedESI = calculateESI(radius, density, flux);
  const computedHI = calculateHI(radius, density, flux);
  const esiPercent = Math.round(computedESI * 100);
  const hiPercent = Math.round(computedHI * 100);

  const getStatusColor = (score) => {
    if (score >= 0.8) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 0.6) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    if (score >= 0.4) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
          <Gauge className="w-7 h-7 text-cyan-400" />
          <span>Earth Similarity Index Calculator (ESI)</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Interactively model the Earth Similarity Index using Schulze-Makuch's planetary similarity formulation.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Parameter Sliders Panel */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800/80 pb-4">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Interactive Planetary Controls</span>
          </div>

          {/* Slider 1: Planetary Radius */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-data">
              <span className="text-slate-300 font-semibold">1. Planetary Radius ($R_\oplus$)</span>
              <span className="text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {radius} R⊕
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="3.0"
              step="0.05"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[12px] text-slate-500 font-mono-data">
              <span>0.3 (Sub-Earth)</span>
              <span>1.0 (Earth)</span>
              <span>3.0 (Super-Earth / Sub-Neptune)</span>
            </div>
          </div>

          {/* Slider 2: Bulk Density */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-data">
              <span className="text-slate-300 font-semibold">2. Bulk Density ($\rho_\oplus$)</span>
              <span className="text-indigo-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {density} ρ⊕
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={density}
              onChange={(e) => setDensity(parseFloat(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <div className="flex justify-between text-[12px] text-slate-500 font-mono-data">
              <span>0.2 (Gaseous envelope)</span>
              <span>1.0 (Earth silicate/iron)</span>
              <span>2.5 (High iron core)</span>
            </div>
          </div>

          {/* Slider 3: Stellar Irradiance Flux */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono-data">
              <span className="text-slate-300 font-semibold">3. Stellar Irradiance ($S_\oplus$)</span>
              <span className="text-purple-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {flux} S⊕
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={flux}
              onChange={(e) => setFlux(parseFloat(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[12px] text-slate-500 font-mono-data">
              <span>0.1 (Outer fringe)</span>
              <span>1.0 (Solar constant)</span>
              <span>3.0 (Runaway greenhouse)</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="pt-2">
            <span className="text-xs font-mono-data text-slate-400 block mb-2">Preset World Profiles:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setRadius(1.0); setDensity(1.0); setFlux(1.0); }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-data text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                Earth Preset
              </button>
              <button
                onClick={() => { setRadius(1.63); setDensity(1.15); setFlux(1.10); }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-data text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                Kepler-452b Preset
              </button>
              <button
                onClick={() => { setRadius(0.92); setDensity(0.98); setFlux(0.66); }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-data text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                TRAPPIST-1e Preset
              </button>
            </div>
          </div>

        </div>

        {/* Right Animated Dual Score Display Panel */}
        <div className="lg:col-span-5 glass-panel p-8 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-6 text-center">
          <span className="text-xs font-mono-data text-slate-400 uppercase tracking-widest">
            Computed Planetary Similarity Metrics
          </span>

          <div className="relative w-56 h-56">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400 transition-all duration-500 ease-out"
                strokeDasharray={`${esiPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-500 ease-out"
                strokeDasharray={`${hiPercent}, 100`}
                strokeWidth="2.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 4.5 a 13.4155 13.4155 0 0 1 0 26.831 a 13.4155 13.4155 0 0 1 0 -26.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-4xl font-extrabold font-display text-white">{computedESI.toFixed(2)}</span>
              <span className="text-[12px] text-slate-400">ESI</span>
              <span className="text-xs text-slate-500">HI {computedHI.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-3 text-xs text-slate-300">
              <div className="font-semibold text-cyan-300">Earth Similarity Index</div>
              <div className="mt-2 text-2xl font-bold text-white">{esiPercent}%</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-3 text-xs text-slate-300">
              <div className="font-semibold text-emerald-300">Habitability Index</div>
              <div className="mt-2 text-2xl font-bold text-white">{hiPercent}%</div>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-full border text-xs font-mono-data font-bold ${getStatusColor(computedESI)}`}>
            {computedESI >= 0.8
              ? 'High Terrestrial Parity'
              : computedESI >= 0.6
              ? 'Moderate Parity'
              : 'Low Terrestrial Parity'}
          </div>
        </div>

      </div>

      {/* Formula Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expandable Mathematical Formula Breakdown (ESI) */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden h-fit">
          <button
            onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
            className="w-full p-5 text-left flex justify-between items-center hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Mathematical Formula Breakdown (Schulze-Makuch ESI)</span>
            </div>
            {isFormulaExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {isFormulaExpanded && (
            <div className="p-6 border-t border-slate-800/80 bg-slate-950/60 space-y-4 text-xs font-mono-data text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 text-center font-bold text-sm">
                ESI = ∏ [ 1 - | (x_i - x_i0) / (x_i + x_i0) | ]^(w_i)
              </div>
              <p className="leading-relaxed">
                Where $x_i$ represents the planetary parameter value (radius, density, flux), $x_i0$ is Earth's baseline reference value (1.0), and $w_i$ is the empirical weighting exponent calibrated for physical property sensitivity.
              </p>
            </div>
          )}
        </div>

        {/* Expandable Mathematical Formula Breakdown (HI) */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden h-fit">
          <button
            onClick={() => setIsHIFormulaExpanded(!isHIFormulaExpanded)}
            className="w-full p-5 text-left flex justify-between items-center hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Mathematical Formula Breakdown (Habitability Index)</span>
            </div>
            {isHIFormulaExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {isHIFormulaExpanded && (
            <div className="p-6 border-t border-slate-800/80 bg-slate-950/60 space-y-4 text-xs font-mono-data text-slate-300">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 text-center font-bold text-sm">
                HI = √(interior_ESI × surface_ESI)
              </div>
              <p className="leading-relaxed">
                Where interior_ESI reflects physical structure similarity (radius, density) and surface_ESI reflects thermal similarity (equilibrium temperature), combined as a geometric mean to estimate overall Earth-likeness.
              </p>
              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">API Field Equivalent:</span>
                <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 font-bold">
                  habitabilityIndex: {computedHI.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Scientific Context Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 text-xs leading-relaxed">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono-data font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Scientific Context & Astrobiological Utility</span>
        </div>
        <p className="text-slate-300">
          The Earth Similarity Index (ESI) is a standardized scale ranging from 0 (no similarity) to 1 (identical to Earth) designed by planetary scientists to quickly screen cataloged exoplanets. While an ESI &gt; 0.8 indicates a promising candidate for terrestrial surface conditions, direct spectroscopic observation of biosignatures (such as oxygen-methane atmospheric disequilibrium) remains essential for confirming biological habitability.
        </p>
      </div>

    </div>
  );
}
