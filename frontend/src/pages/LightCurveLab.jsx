import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Play, RotateCcw, Info, Sparkles, Check, ChevronRight, HelpCircle, Layers, Compass, Radio, Cpu, Terminal
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea 
} from 'recharts';
import { EXOPLANETS } from '../data/exoplanetsData';

// Custom High-Tech Recharts Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const fluxVal = payload[0].value;
    const dropPct = ((1.000 - fluxVal) * 100).toFixed(2);
    const brightPct = (fluxVal * 100).toFixed(2);

    let phase = "Baseline (Out-of-Transit)";
    let phaseColor = "text-slate-400 border-slate-700 bg-slate-800/80";

    if (dataPoint.type === 'primary') {
      if (Math.abs(label) <= 0.3) {
        phase = "Mid-Transit Minimum";
        phaseColor = "text-cyan-300 border-cyan-500/50 bg-cyan-500/20";
      } else if (label > -1.5 && label < -0.3) {
        phase = "Ingress Phase";
        phaseColor = "text-indigo-300 border-indigo-500/50 bg-indigo-500/20";
      } else if (label > 0.3 && label < 1.5) {
        phase = "Egress Phase";
        phaseColor = "text-purple-300 border-purple-500/50 bg-purple-500/20";
      }
    } else if (dataPoint.type === 'secondary') {
      phase = "Secondary Eclipse";
      phaseColor = "text-violet-300 border-violet-500/50 bg-violet-500/20";
    }

    return (
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/40 shadow-2xl space-y-2 text-xs font-mono-data bg-slate-950/95 backdrop-blur-md max-w-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-slate-400">Hours from Mid-Transit:</span>
          <span className="text-cyan-300 font-bold">{label > 0 ? `+${label.toFixed(2)}` : label.toFixed(2)} hrs</span>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Relative Brightness:</span>
            <span className="text-white font-bold">{brightPct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Flux Drop (ΔF/F):</span>
            <span className="text-rose-400 font-bold">-{dropPct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Normalized Flux:</span>
            <span className="text-cyan-400 font-bold">{fluxVal.toFixed(4)}</span>
          </div>
        </div>

        <div className={`mt-2 pt-2 border-t border-slate-800 text-[12px] px-2 py-1 rounded text-center border font-semibold ${phaseColor}`}>
          {phase}
        </div>
      </div>
    );
  }
  return null;
};

export default function LightCurveLab() {
  const [selectedPlanetId, setSelectedPlanetId] = useState('kepler-452b');
  const [showProcessed, setShowProcessed] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [transitProgress, setTransitProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const planet = EXOPLANETS.find((p) => p.id === selectedPlanetId) || EXOPLANETS[1];
  const rawLightCurveData = planet.lightCurve || EXOPLANETS[1].lightCurve;

  const rawTimeBounds = useMemo(() => {
    const times = rawLightCurveData.map((d) => d.time);
    return {
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }, [rawLightCurveData]);

  const { lightCurveData, secondaryCenter } = useMemo(() => {
    const base = rawLightCurveData.map((point) => ({
      ...point,
      processed: point.processed ?? point.flux,
      type: Math.abs(point.time) <= 1.5 ? 'primary' : 'baseline',
    }));

    const center = rawTimeBounds.max + Math.max(4, rawTimeBounds.max - rawTimeBounds.min);
    const secondaryShape = [
      { time: center - 1.0, flux: 0.9994, processed: 0.9995, type: 'baseline' },
      { time: center - 0.6, flux: 0.9988, processed: 0.9990, type: 'secondary' },
      { time: center - 0.3, flux: 0.9983, processed: 0.9985, type: 'secondary' },
      { time: center, flux: 0.9978, processed: 0.9980, type: 'secondary' },
      { time: center + 0.3, flux: 0.9986, processed: 0.9986, type: 'secondary' },
      { time: center + 0.6, flux: 0.9993, processed: 0.9994, type: 'secondary' },
      { time: center + 1.0, flux: 0.9998, processed: 0.9999, type: 'baseline' },
    ];

    return {
      lightCurveData: [...base, ...secondaryShape].sort((a, b) => a.time - b.time),
      secondaryCenter: center,
    };
  }, [rawLightCurveData, rawTimeBounds]);

  // Real-time animated orbital transit loop (0% to 100%)
  useEffect(() => {
    const interval = setInterval(() => {
      setTransitProgress((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const timeBounds = useMemo(() => {
    const times = lightCurveData.map((d) => d.time);
    return {
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }, [lightCurveData]);

  const currentTime = useMemo(() => {
    return timeBounds.min + (transitProgress / 100) * (timeBounds.max - timeBounds.min);
  }, [timeBounds, transitProgress]);

  // Find nearest data point to the current animation time
  const nearestPoint = useMemo(() => {
    if (!lightCurveData || !lightCurveData.length) return null;
    let best = lightCurveData[0];
    let bestDist = Math.abs(best.time - currentTime);
    for (const p of lightCurveData) {
      const d = Math.abs(p.time - currentTime);
      if (d < bestDist) {
        best = p;
        bestDist = d;
      }
    }
    return best;
  }, [lightCurveData, currentTime]);

  const secondaryDipDepth = useMemo(() => {
    const secondaryPoints = lightCurveData.filter((point) => point.type === 'secondary');
    if (!secondaryPoints.length) return '0.000';
    return ((1 - Math.min(...secondaryPoints.map((point) => point.flux))) * 100).toFixed(3);
  }, [lightCurveData]);

  const currentFlux = useMemo(() => {
    if (!nearestPoint) return 1.0;
    const key = showProcessed && nearestPoint.processed !== undefined ? 'processed' : 'flux';
    return Number(nearestPoint[key]);
  }, [nearestPoint, showProcessed]);

  // Compute miniature planet orbit position in an elliptical path that better reflects orbital geometry
  const planetOrbitCoords = useMemo(() => {
    const tRange = timeBounds.max - timeBounds.min || 1;
    const normalized = (currentTime - timeBounds.min) / tRange;
    const angle = normalized * Math.PI * 2;
    const rx = 70;
    const ry = 28;
    const tilt = Math.PI / 16;
    return {
      x: 100 + rx * Math.cos(angle) * Math.cos(tilt) - ry * Math.sin(angle) * Math.sin(tilt),
      y: 50 + rx * Math.cos(angle) * Math.sin(tilt) + ry * Math.sin(angle) * Math.cos(tilt),
      angle,
    };
  }, [currentTime, timeBounds]);

  const distFromCenter = Math.sqrt(
    Math.pow(planetOrbitCoords.x - 100, 2) + Math.pow(planetOrbitCoords.y - 50, 2)
  );
  const isTransiting = Math.abs(planetOrbitCoords.x - 100) < 20 && Math.abs(planetOrbitCoords.y - 50) < 20;
  const phaseLabel = isTransiting
    ? Math.abs(planetOrbitCoords.x - 100) < 8 && Math.abs(planetOrbitCoords.y - 50) < 8
      ? 'Mid-Transit Minimum'
      : planetOrbitCoords.y < 50
      ? 'Ingress Phase'
      : 'Egress Phase'
    : 'Out-of-Transit Baseline';

  // Transit Walkthrough Steps
  const walkthroughSteps = [
    { title: "1. Out-of-Transit Baseline", desc: "Before ingress, the telescope receives 100% (1.000 flux) of the host star's unoccluded light." },
    { title: "2. Ingress Phase", desc: "The exoplanet begins crossing the star's limb, causing stellar flux to drop steeply." },
    { title: "3. Mid-Transit Minimum", desc: "The planet is fully centered in front of the stellar disk. Depth indicates planet-to-star area ratio (Rp/R*)²." },
    { title: "4. Egress Phase", desc: "The planet moves off the stellar disk, allowing light flux to recover to baseline levels." },
    { title: "5. Secondary Eclipse", desc: "A secondary dip appears when the planet passes behind the star, revealing reflected light and thermal emission contrast." }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
              <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Activity className="w-7 h-7 text-cyan-400" />
            <span>Transit Light Curve Laboratory</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Photometric brightness analysis, transit light curve modeling, and real-time stellar flux telemetry.
          </p>
        </div>

        {/* Planet Selector & Calibrated Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 glass-panel p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowProcessed(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-data transition-all ${
                !showProcessed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'
              }`}
            >
              Raw Flux
            </button>
            <button
              onClick={() => setShowProcessed(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-data transition-all ${
                showProcessed ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-400'
              }`}
            >
              Calibrated
            </button>
          </div>

          <select
            value={selectedPlanetId}
            onChange={(e) => setSelectedPlanetId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-mono-data text-cyan-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
          >
            {EXOPLANETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.discoveryMethod})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observatory Control Room Diagnostics Panel */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-slate-950/90 shadow-[0_0_20px_rgba(34,211,238,0.1)] flex flex-wrap justify-between items-center gap-4 text-xs font-mono-data">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-3 w-3" aria-hidden>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-bold tracking-wider">TELESCOPE STATE: TRACKING</span>
        </div>

        <div className="flex items-center space-x-3 text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">SNR:</span>
            <span className="text-cyan-300 font-bold">{(24.5 + Math.sin(transitProgress / 10) * 0.3).toFixed(1)} dB</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">PRECISION:</span>
            <span className="text-indigo-300 font-bold">±0.0002 F</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-cyan-400/90 bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-800">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <div className="text-[12px] font-mono-data">
            <div>Current Flux: <span className="font-bold text-white">{hoveredPoint ? Number(hoveredPoint.flux).toFixed(4) : currentFlux.toFixed(4)}</span></div>
            <div className="text-slate-400 text-[12px]">ΔF/F: <span className="text-rose-400 font-semibold">-{((1 - currentFlux) * 100).toFixed(3)}%</span></div>
          </div>
        </div>
      </div>

      {/* Main Interactive Light Curve Recharts Plot */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center text-xs font-mono-data">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Normalized Stellar Brightness Flux vs. Time (Hours relative to mid-transit)</span>
          </div>
          <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            Hover Point for Diagnostics
          </span>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lightCurveData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              onMouseMove={(state) => {
                if (state && state.activePayload && state.activePayload.length) {
                  setHoveredPoint(state.activePayload[0].payload);
                } else {
                  setHoveredPoint(null);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#94a3b8" label={{ value: 'Time (Hours from mid-transit)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#94a3b8" label={{ value: 'Normalized Flux', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
              
              {/* Custom High-Tech Interactive Tooltip */}
              <Tooltip content={<CustomTooltip />} />
              
              {/* Primary Transit Area Highlight */}
              <ReferenceArea x1={-1.5} x2={1.5} fill="#22d3ee" fillOpacity={0.08} label={{ value: 'Primary Transit Dip Zone', fill: '#22d3ee', fontSize: 11 }} />
          <ReferenceArea x1={secondaryCenter - 0.9} x2={secondaryCenter + 0.9} fill="#a78bfa" fillOpacity={0.08} label={{ value: 'Secondary Eclipse Zone', fill: '#a78bfa', fontSize: 11 }} />
          <ReferenceLine y={1.000} stroke="#818cf8" strokeDasharray="4 4" label={{ value: '1.000 Baseline Flux', fill: '#818cf8', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey={showProcessed ? (lightCurveData[0].processed ? 'processed' : 'flux') : 'flux'}
                stroke={showProcessed ? '#22d3ee' : '#f43f5e'}
                strokeWidth={3}
                dot={{ r: 4, fill: '#22d3ee' }}
                activeDot={{ r: 8, fill: '#818cf8', stroke: '#22d3ee', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Synchronized Miniature: 2D Solar System Perspective (right below chart) */}
      <div className="glass-panel mt-4 p-3 rounded-2xl border border-slate-800 bg-slate-950/80">
        <div className="flex items-center justify-between mb-2 text-xs text-slate-300 font-mono-data">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-cyan-300">Orbital Miniature</span>
            <span className="text-[12px] text-slate-400">Synchronized with chart transit dip</span>
          </div>
          <div className="text-[12px] text-slate-400">Time: <span className="text-white font-bold">{currentTime.toFixed(2)} hrs</span></div>
        </div>

        <div className="w-full h-24 flex items-center justify-center">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <defs>
              <radialGradient id="miniStar" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff59e" stopOpacity={Math.max(0.2, 1 - (1 - currentFlux))} />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity={Math.max(0.2, 0.9 - (1 - currentFlux))} />
                <stop offset="100%" stopColor="#b45309" stopOpacity={Math.max(0.1, 0.6 - (1 - currentFlux) / 2)} />
              </radialGradient>
            </defs>

            {/* Elliptical Orbital Track */}
            <ellipse cx="100" cy="50" rx="70" ry="28" fill="none" stroke="rgba(34,211,238,0.12)" strokeDasharray="4 4" />

            {/* Host Star */}
            <circle cx="100" cy="50" r="20" fill="url(#miniStar)" />

            {/* Planet - position on an elliptical orbit */}
            <circle cx={planetOrbitCoords.x} cy={planetOrbitCoords.y} r="6" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Measured Values Panel & Interactive Step Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Measured Values Panel */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono-data border-b border-slate-800/80 pb-3">
            Derived Photometric Measurements
          </h3>

          <div className="space-y-3 font-mono-data text-xs">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Transit Depth (ΔF/F):</span>
              <span className="text-cyan-400 font-bold">~0.50%</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Transit Duration (t_dur):</span>
              <span className="text-indigo-400 font-bold">3.2 Hours</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Secondary Eclipse Depth:</span>
              <span className="text-violet-300 font-bold">{secondaryDipDepth}%</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Planet-Star Radius Ratio (Rp/R*):</span>
              <span className="text-purple-400 font-bold">0.071</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">Calculated Radius:</span>
              <span className="text-emerald-400 font-bold">{planet.radiusEarth} R⊕</span>
            </div>
          </div>
        </div>

        {/* Right Step-by-Step Interactive Walkthrough Guide */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white font-mono-data">
              Interactive Transit Walkthrough Guide
            </h3>
            <span className="text-xs text-cyan-400 font-mono-data">Step {activeStep + 1} of 4</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 text-sm">{walkthroughSteps[activeStep].title}</h4>
            <p className="text-slate-300 text-xs leading-relaxed">{walkthroughSteps[activeStep].desc}</p>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-data text-slate-300 disabled:opacity-40"
            >
              ← Previous Step
            </button>

            <button
              onClick={() => setActiveStep((prev) => (prev + 1) % walkthroughSteps.length)}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono-data font-semibold hover:bg-cyan-500/30 transition-all flex items-center space-x-1"
            >
              <span>Next Phase</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Educational Physics & Animated Orbital Transit Miniature */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        
        <div className="flex items-center space-x-2 text-cyan-400 font-mono-data font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Physics of Transit Photometry & Orbital Simulation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Physics Text Explanation */}
          <div className="lg:col-span-7 space-y-3 text-xs leading-relaxed">
            <h3 className="text-lg font-bold text-white">How Stellar Light Dips Reveal Planetary Size</h3>
            <p className="text-slate-300">
              When an exoplanet's orbit is aligned edge-on relative to Earth's line of sight, it periodically transits across the face of its parent star. By calculating the fractional drop in total light intensity $\Delta F / F$, astronomers directly measure the geometric surface area ratio of the planet relative to its host star.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono-data">
              Formula: ΔF / F = (R_planet / R_star)²
            </div>
          </div>

          {/* Animated Orbital Transit Miniature Component */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
            <span className="text-[12px] font-mono-data text-slate-400">
              Real-Time Orbital Transit Miniature
            </span>

            {/* Loop Canvas SVG */}
            <div className="relative w-64 h-36 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Host Star Orb */}
                <circle cx="100" cy="50" r="32" fill="url(#starGradient)" />
                <defs>
                  <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="60%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </radialGradient>
                </defs>

                {/* Dotted Orbital Line */}
                <line x1="10" y1="50" x2="190" y2="50" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Looping Planet Sphere passing across star */}
                <circle cx={planetOrbitCoords.x} cy={planetOrbitCoords.y} r="8" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" className="shadow-[0_0_10px_#22d3ee]" />
              </svg>

              {/* Dynamic Dip Status Overlay */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[12px] font-mono-data text-cyan-300">
                Flux: {currentFlux.toFixed(4)}
              </div>
            </div>

            <div className="text-[12px] font-mono-data text-slate-400 text-center">
              {isTransiting ? (
                <span className="text-cyan-400 font-bold">● Active In-Transit Occlusion Dip</span>
              ) : (
                <span className="text-slate-500">○ Out-of-Transit Stellar Baseline</span>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
