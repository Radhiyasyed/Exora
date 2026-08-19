import React, { useState } from 'react';
import { Gauge, Calculator, Info, Compass } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export default function HabitabilityIndex() {
  // Inputs for Earth Similarity Index (ESI)
  const [radius, setRadius] = useState(1.0); // Earth radii (0.1 - 20.0)
  const [density, setDensity] = useState(1.0); // Bulk density (0.2 - 2.5)
  const [tempK, setTempK] = useState(288); // Equilibrium Temperature in K (100 - 2000)

  // Inputs for Habitable Zone Distance (HZD)
  const [stellarLuminosity, setStellarLuminosity] = useState(0.0); // log10(L/Lsun), range -4.0 to +2.0
  const [orbitalDistanceAU, setOrbitalDistanceAU] = useState(1.0); // AU, range 0.01 to 10.0

  // ═══════════════════════════════════════════════════
  // CALCULATION LOGIC
  // ═══════════════════════════════════════════════════

  // Schulze-Makuch ESI (2011) formula
  const calculateESI = (r, d, t) => {
    const numR = parseFloat(r);
    const numD = parseFloat(d);
    const numT = parseFloat(t);

    if (isNaN(numR) || isNaN(numD) || isNaN(numT) || numR <= 0 || numD <= 0 || numT <= 0) return 0;

    const wR = 0.57;
    const wD = 1.07;
    const wV = 0.70;
    const wT = 5.58;

    // Escape velocity relative to Earth: v_esc = R * sqrt(density)
    const vEsc = numR * Math.sqrt(numD);

    const termR = Math.pow(Math.max(0, 1 - Math.abs(numR - 1.0) / (numR + 1.0)), wR);
    const termD = Math.pow(Math.max(0, 1 - Math.abs(numD - 1.0) / (numD + 1.0)), wD);
    const termV = Math.pow(Math.max(0, 1 - Math.abs(vEsc - 1.0) / (vEsc + 1.0)), wV);
    const termT = Math.pow(Math.max(0, 1 - Math.abs(numT - 288.0) / (numT + 288.0)), wT);

    const interior = Math.sqrt(termR * termD);
    const surface = Math.sqrt(termV * termT);
    const esi = Math.sqrt(interior * surface);
    return Math.max(0, Math.min(1.0, isNaN(esi) ? 0 : esi));
  };

  // Habitable Zone Distance (HZD) calculation
  const calculateHZD = (logLum, distAU) => {
    const numDist = parseFloat(distAU);
    if (isNaN(numDist) || numDist <= 0) return 0;

    const parsedLum = parseFloat(logLum);
    const numLum = isNaN(parsedLum) ? 0 : parsedLum;
    const l_rel = Math.pow(10, numLum); // archive stores st_lum as log10(L/Lsun)

    const r_inner = Math.sqrt(l_rel / 1.1);
    const r_outer = Math.sqrt(l_rel / 0.53);

    if (r_outer === r_inner) return 0;

    const hzd = (2 * numDist - r_outer - r_inner) / (r_outer - r_inner);
    return isNaN(hzd) ? 0 : hzd;
  };

  const handleReset = () => {
    setRadius('');
    setDensity('');
    setTempK('');
    setStellarLuminosity(0.0);
    setOrbitalDistanceAU('');
  };

  const computedESI = calculateESI(radius, density, tempK);
  const computedHZD = calculateHZD(stellarLuminosity, orbitalDistanceAU);

  // Formatting helper ensuring 100% mathematical parity between decimal and percentage display
  const formatESIDisplay = (val) => {
    if (val <= 0 || isNaN(val)) {
      return { decimal: '0.000', percent: '0.0%' };
    }
    if (val >= 0.9999) {
      return { decimal: '1.000', percent: '100.0%' };
    }
    if (val < 0.001) {
      return { 
        decimal: val.toFixed(5), 
        percent: `${(val * 100).toFixed(3)}%` 
      };
    }
    if (val < 0.01) {
      return { 
        decimal: val.toFixed(4), 
        percent: `${(val * 100).toFixed(2)}%` 
      };
    }
    return { 
      decimal: val.toFixed(3), 
      percent: `${(val * 100).toFixed(1)}%` 
    };
  };

  const { decimal: formattedESI, percent: formattedPercent } = formatESIDisplay(computedESI);
  const esiGaugePercent = Math.min(100, Math.max(0, computedESI * 100));

  const getHZDStatus = (hzdVal, dist) => {
    const d = parseFloat(dist);
    if (isNaN(d) || d <= 0) return { label: 'Awaiting Inputs', inZone: false };
    if (hzdVal < -1.0) return { label: 'Too Hot (Inner Limit)', inZone: false };
    if (hzdVal > 1.0) return { label: 'Too Cold (Outer Limit)', inZone: false };
    return { label: 'Habitable Zone Center', inZone: true };
  };

  const hzdStatus = getHZDStatus(computedHZD, orbitalDistanceAU);
  const hasValidHZD = orbitalDistanceAU !== '' && !isNaN(parseFloat(orbitalDistanceAU)) && parseFloat(orbitalDistanceAU) > 0;

  // HZD progress gauge fill percentage normalized (-2 to +2 scale mapped to 0-100%)
  const hzdClamped = Math.max(-2, Math.min(2, computedHZD));
  const hzdGaugePercent = Math.round(((hzdClamped + 2) / 4) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* ═══════════════════════════════════════════════════
          HEADER: ExoCalc + Reset Button
          ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Gauge className="w-7 h-7 text-cyan-400" />
            <span>ExoCalc</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Interactive calculator for Earth Similarity Index (ESI) and Habitable Zone Distance (HZD) based on astrophysical models.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-mono-data font-semibold transition-all shadow-sm flex items-center space-x-2"
        >
          <span>Reset All Inputs</span>
        </button>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ═══════════════════════════════════════════════════
            INPUTS PANEL: Grouped under 2 clear headers
            ═══════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-8">
          
          {/* Group 1: For Earth Similarity Index (ESI) */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>For Earth Similarity Index (ESI)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRadius(1.0);
                  setDensity(1.0);
                  setTempK(288);
                  setStellarLuminosity(0.0);
                  setOrbitalDistanceAU(1.0);
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono-data underline"
              >
                Set Earth Baseline
              </button>
            </div>

            {/* Input 1: Planetary Radius (0.1 - 20.0 R⊕) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono-data">
                <span className="text-slate-300 font-semibold">Planetary Radius (R⊕)</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.1"
                    max="20.0"
                    step="0.05"
                    value={radius !== '' && !isNaN(radius) ? radius : ''}
                    placeholder="0.0"
                    onChange={(e) => {
                      const v = e.target.value;
                      setRadius(v === '' ? '' : parseFloat(v));
                    }}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-right text-cyan-400 font-bold text-xs focus:outline-none focus:border-cyan-400 font-mono-data"
                  />
                  <span className="text-slate-400 text-xs">R⊕</span>
                </div>
              </div>
              <input
                type="range"
                min="0.1"
                max="20.0"
                step="0.05"
                value={radius !== '' && !isNaN(radius) ? radius : 0.1}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono-data">
                <span>0.1 R⊕ (Sub-Earth)</span>
                <span>1.0 R⊕ (Earth)</span>
                <span>20.0 R⊕ (Gas Giant)</span>
              </div>
            </div>

            {/* Input 2: Bulk Density (0.2 - 2.5 ρ⊕) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono-data">
                <span className="text-slate-300 font-semibold">Bulk Density (ρ⊕)</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={density !== '' && !isNaN(density) ? density : ''}
                    placeholder="0.0"
                    onChange={(e) => {
                      const v = e.target.value;
                      setDensity(v === '' ? '' : parseFloat(v));
                    }}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-right text-cyan-400 font-bold text-xs focus:outline-none focus:border-cyan-400 font-mono-data"
                  />
                  <span className="text-slate-400 text-xs">ρ⊕</span>
                </div>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={density !== '' && !isNaN(density) ? density : 0.2}
                onChange={(e) => setDensity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono-data">
                <span>0.2 ρ⊕ (Gas / Ice)</span>
                <span>1.0 ρ⊕ (Earth 5.51 g/cm³)</span>
                <span>2.5 ρ⊕ (Super-Dense Iron)</span>
              </div>
            </div>

            {/* Input 3: Equilibrium Temperature (100 - 2000 K) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono-data">
                <span className="text-slate-300 font-semibold">Equilibrium Temperature (K)</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    step="5"
                    value={tempK !== '' && !isNaN(tempK) ? tempK : ''}
                    placeholder="0"
                    onChange={(e) => {
                      const v = e.target.value;
                      setTempK(v === '' ? '' : parseFloat(v));
                    }}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-right text-cyan-400 font-bold text-xs focus:outline-none focus:border-cyan-400 font-mono-data"
                  />
                  <span className="text-slate-400 text-xs">K</span>
                </div>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="5"
                value={tempK !== '' && !isNaN(tempK) ? tempK : 100}
                onChange={(e) => setTempK(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono-data">
                <span>100 K (Cryogenic)</span>
                <span>288 K (Earth baseline)</span>
                <span>2000 K (Hot Jupiter)</span>
              </div>
            </div>
          </div>

          {/* Group 2: For Habitable Zone Distance (HZD) */}
          <div className="space-y-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center space-x-2 text-white font-bold text-sm border-b border-slate-800/80 pb-3">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>For Habitable Zone Distance (HZD)</span>
            </div>

            {/* Input 4: Stellar Luminosity log10(L/Lsun) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono-data">
                <span className="text-slate-300 font-semibold">Stellar Luminosity (log₁₀ L/L☉)</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="-4.0"
                    max="2.0"
                    step="0.05"
                    value={stellarLuminosity !== '' && !isNaN(stellarLuminosity) ? stellarLuminosity : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStellarLuminosity(v === '' ? '' : parseFloat(v));
                    }}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-right text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-400 font-mono-data"
                  />
                  <span className="text-slate-400 text-xs">log₁₀</span>
                </div>
              </div>
              <input
                type="range"
                min="-4.0"
                max="2.0"
                step="0.05"
                value={stellarLuminosity !== '' && !isNaN(stellarLuminosity) ? stellarLuminosity : 0}
                onChange={(e) => setStellarLuminosity(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono-data">
                <span>-4.0 (Ultra-cool Dwarf)</span>
                <span>0.0 (Solar Lsun)</span>
                <span>+2.0 (Massive Star)</span>
              </div>
            </div>

            {/* Input 5: Planetary Orbital Distance (AU) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono-data">
                <span className="text-slate-300 font-semibold">Planetary Orbital Distance (AU)</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0.01"
                    max="10.0"
                    step="0.01"
                    value={orbitalDistanceAU !== '' && !isNaN(orbitalDistanceAU) ? orbitalDistanceAU : ''}
                    placeholder="0.00"
                    onChange={(e) => {
                      const v = e.target.value;
                      setOrbitalDistanceAU(v === '' ? '' : parseFloat(v));
                    }}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-right text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-400 font-mono-data"
                  />
                  <span className="text-slate-400 text-xs">AU</span>
                </div>
              </div>
              <input
                type="range"
                min="0.01"
                max="10.0"
                step="0.01"
                value={orbitalDistanceAU !== '' && !isNaN(orbitalDistanceAU) ? orbitalDistanceAU : 0.01}
                onChange={(e) => setOrbitalDistanceAU(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono-data">
                <span>0.01 AU (Tight Orbit)</span>
                <span>1.0 AU (Earth)</span>
                <span>10.0 AU (Outer System)</span>
              </div>
            </div>

          </div>

        </div>

        {/* ═══════════════════════════════════════════════════
            OUTPUT PANEL: Dual Ring Live Readout (ESI / HZD)
            ═══════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col space-y-6">
          <div className="text-center">
            <span className="text-xs font-mono-data text-slate-400 uppercase tracking-widest font-bold">
              Computed Planetary Metrics
            </span>
          </div>

          {/* Primary Focal Point: Dual-Ring Gauges (ESI & HZD) */}
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center w-full">
            
            {/* ESI Gauge */}
            <div className="flex-1 flex flex-col items-center justify-center p-5 rounded-2xl border border-cyan-500/20 bg-slate-950/60 w-full shadow-inner space-y-3">
              <div className="relative w-36 h-36">
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
                    strokeDasharray={`${esiGaugePercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold font-mono-data text-white leading-none">
                    {formattedESI}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-data font-bold mt-1">ESI</span>
                </div>
              </div>
              <div className="text-center space-y-0.5">
                <div className="font-semibold text-cyan-300 text-xs">Earth Similarity Index</div>
                <div className="text-white text-base font-bold font-mono-data">{formattedPercent}</div>
              </div>
            </div>

            {/* HZD Gauge */}
            <div className="flex-1 flex flex-col items-center justify-center p-5 rounded-2xl border border-emerald-500/20 bg-slate-950/60 w-full shadow-inner space-y-3">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-500 ease-out"
                    strokeDasharray={`${hasValidHZD ? hzdGaugePercent : 0}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold font-mono-data text-white leading-none">
                    {hasValidHZD ? (computedHZD >= 0 ? `+${computedHZD.toFixed(2)}` : computedHZD.toFixed(2)) : '0.00'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-data font-bold mt-1">HZD</span>
                </div>
              </div>
              <div className="text-center space-y-0.5">
                <div className="font-semibold text-emerald-300 text-xs">Habitable Zone Distance</div>
                <div className="text-white text-base font-bold font-mono-data">
                  {hasValidHZD ? `${computedHZD >= 0 ? '+' : ''}${computedHZD.toFixed(2)}` : '0.00'}
                </div>
              </div>
            </div>

          </div>

          {/* Tertiary Status Indicators: Side-by-Side Unified Pill Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono-data text-xs">
            <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-center flex items-center justify-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span className="text-cyan-300 font-semibold text-[11px]">
                {computedESI >= 0.8
                  ? 'High Terrestrial Parity'
                  : computedESI >= 0.6
                  ? 'Moderate Parity'
                  : 'Low Terrestrial Parity'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center flex items-center justify-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-300 font-semibold text-[11px]">
                {hzdStatus.label}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════
          SCIENTIFIC CONTEXT SECTIONS
          ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full mb-6">
        
        {/* ESI Formula Block */}
        <div className="glass-panel rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-center space-x-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold text-sm">Schulze-Makuch ESI Formulation</span>
          </div>
          <div className="p-6 bg-slate-950/60 flex-1 flex flex-col justify-between space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 w-full overflow-x-auto text-cyan-300 flex justify-center border border-cyan-500/10 shadow-inner">
              <BlockMath math="ESI = \prod_{i} \left[1 - \left|\frac{x_i - x_{i,0}}{x_i + x_{i,0}}\right|\right]^{w_i}" />
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              The Earth Similarity Index calculates a weighted geometric mean across planetary radius, bulk density, escape velocity, and surface equilibrium temperature relative to Earth standards.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-mono-data pt-2 border-t border-slate-800">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Radius (w)</span>
                <span className="text-cyan-400 font-bold">0.57</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Density (w)</span>
                <span className="text-cyan-400 font-bold">1.07</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">v_esc (w)</span>
                <span className="text-cyan-400 font-bold">0.70</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Temp (w)</span>
                <span className="text-cyan-400 font-bold">5.58</span>
              </div>
            </div>
          </div>
        </div>

        {/* HZD Formula Block */}
        <div className="glass-panel rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold text-sm">Habitable Zone Distance (HZD) Formulation</span>
          </div>
          <div className="p-6 bg-slate-950/60 flex-1 flex flex-col justify-between space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 w-full overflow-x-auto text-emerald-300 flex justify-center border border-emerald-500/10 shadow-inner">
              <BlockMath math="HZD = \frac{2 \cdot d - r_{\text{out}} - r_{\text{in}}}{r_{\text{out}} - r_{\text{in}}}" />
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              HZD determines relative position inside the circumstellar habitable zone. An HZD between <InlineMath math="[-1, +1]" /> represents the habitable zone, with negative values indicating warmer orbits and positive values indicating cooler orbits.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono-data pt-2 border-t border-slate-800">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Inner Boundary</span>
                <span className="text-emerald-400 font-bold">-1.0 (Runaway)</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Center</span>
                <span className="text-emerald-400 font-bold">0.0 (Optimal)</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Outer Boundary</span>
                <span className="text-emerald-400 font-bold">+1.0 (Snowball)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
