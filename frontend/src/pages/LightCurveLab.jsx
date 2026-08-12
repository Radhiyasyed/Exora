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
    const dropPct = ((1.000 - fluxVal) * 100).toFixed(3);
    const brightPct = (fluxVal * 100).toFixed(3);

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
          <span className="text-cyan-300 font-bold">{label > 0 ? `+${label.toFixed(3)}` : label.toFixed(3)} hrs</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-800 pb-2 mt-2">
          <span className="text-slate-400">Time (BJD):</span>
          <span className="text-cyan-300 font-bold">{(2459000.5 + (label / 24)).toFixed(3)}</span>
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
            <span className="text-cyan-400 font-bold">{fluxVal.toFixed(3)}</span>
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
  const [planets, setPlanets] = useState(() => EXOPLANETS.filter(p => p.discoveryMethod === 'Transit' && p.id !== 'earth'));
  const [selectedPlanetId, setSelectedPlanetId] = useState('kepler-452b');
  const [showProcessed, setShowProcessed] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [transitProgress, setTransitProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    import('../api/exoplanetsApi').then(({ fetchPlanets }) => {
      fetchPlanets().then(res => {
        const transiting = res.planets.filter(p => p.discoveryMethod === 'Transit' && p.id !== 'earth');
        if (transiting.length > 0) setPlanets(transiting);
      });
    });
  }, []);

  const planet = planets.find((p) => p.id === selectedPlanetId) || planets[0] || EXOPLANETS[1];

  const rawLightCurveData = useMemo(() => {
    const rEarth = planet.radiusEarth || 1.0;
    const sRad = planet.starRadius || 1.0; 
    const depth = Math.pow(rEarth / (sRad * 109.2), 2);
    
    const curve = [];
    const sigma = 0.5;
    for (let t = -4; t <= 4; t += 0.25) {
      const drop = depth * Math.exp(-(t * t) / (2 * sigma * sigma));
      const flux = 1.0 - drop;
      const noise = (Math.random() - 0.5) * (depth * 0.05 + 0.00005);
      curve.push({
        time: t,
        flux: flux + noise,
        processed: flux,
      });
    }
    return curve;
  }, [planet]);

  const primaryDipBounds = useMemo(() => {
    const dips = rawLightCurveData.filter(d => d.processed < 1.0 - 0.000001);
    if (!dips.length) return { min: -1.5, max: 1.5 };
    return {
      min: dips[0].time,
      max: dips[dips.length - 1].time
    };
  }, [rawLightCurveData]);

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
      type: (point.time >= primaryDipBounds.min && point.time <= primaryDipBounds.max) ? 'primary' : 'baseline',
    }));

    // Place secondary eclipse roughly half an orbital phase (in hours) after primary transit
    const center = planet.orbitalPeriodDays ? (planet.orbitalPeriodDays * 24) / 2 : rawTimeBounds.max + Math.max(4, rawTimeBounds.max - rawTimeBounds.min);
    
    const sDepth = Math.pow((planet.radiusEarth || 1.0) / ((planet.starRadius || 1.0) * 109.2), 2) * 0.1;
    const secondaryShape = [
      { time: center - 1.0, flux: 1.0, processed: 1.0, type: 'baseline' },
      { time: center - 0.6, flux: 1.0 - sDepth*0.2, processed: 1.0 - sDepth*0.2, type: 'secondary' },
      { time: center - 0.3, flux: 1.0 - sDepth*0.5, processed: 1.0 - sDepth*0.5, type: 'secondary' },
      { time: center,       flux: 1.0 - sDepth,     processed: 1.0 - sDepth,     type: 'secondary' },
      { time: center + 0.3, flux: 1.0 - sDepth*0.5, processed: 1.0 - sDepth*0.5, type: 'secondary' },
      { time: center + 0.6, flux: 1.0 - sDepth*0.2, processed: 1.0 - sDepth*0.2, type: 'secondary' },
      { time: center + 1.0, flux: 1.0, processed: 1.0, type: 'baseline' },
    ];

    return {
      lightCurveData: [...base, ...secondaryShape].sort((a, b) => a.time - b.time),
      secondaryCenter: center,
    };
  }, [rawLightCurveData, rawTimeBounds, primaryDipBounds, planet]);

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

  const planetOrbitCoords2 = useMemo(() => {
    const tRange = timeBounds.max - timeBounds.min || 1;
    const angle = (currentTime / tRange) * Math.PI * 2 + Math.PI / 2;
    return {
      x: 100 + 80 * Math.cos(angle),
      y: 50 + 16 * Math.sin(angle)
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

  const activeStepTime = useMemo(() => {
    switch (activeStep) {
      case 0: return rawTimeBounds.min;
      case 1: return primaryDipBounds.min;
      case 2: return 0;
      case 3: return primaryDipBounds.max;
      case 4: return secondaryCenter;
      default: return 0;
    }
  }, [activeStep, rawTimeBounds, primaryDipBounds, secondaryCenter]);

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
            {planets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.discoveryMethod})
              </option>
            ))}
          </select>
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
              margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
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
              <XAxis dataKey="time" stroke="#94a3b8" label={{ value: 'Time (Hours from mid-transit)', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#94a3b8" label={{ value: 'Normalized Flux', angle: -90, position: 'insideLeft', offset: 15, dx: -25, fill: '#94a3b8', fontSize: 11 }} />
              
              {/* Custom High-Tech Interactive Tooltip */}
              <Tooltip content={<CustomTooltip />} />
              
              {/* Primary Transit Area Highlight */}
              <ReferenceArea x1={primaryDipBounds.min} x2={primaryDipBounds.max} fill="#22d3ee" fillOpacity={0.08} label={{ value: 'Primary Transit Dip Zone', position: 'insideTop', fill: '#22d3ee', fontSize: 11 }} />
              <ReferenceArea x1={secondaryCenter - 1.0} x2={secondaryCenter + 0.6} fill="#a78bfa" fillOpacity={0.08} label={{ value: 'Secondary Eclipse / Occultation Zone', position: 'insideTop', fill: '#a78bfa', fontSize: 11 }} />
              <ReferenceLine y={1.000} stroke="#818cf8" strokeDasharray="4 4" label={{ value: '1.000 Baseline Flux', position: 'top', fill: '#818cf8', fontSize: 10 }} />
              <ReferenceLine x={activeStepTime} stroke="#fbbf24" strokeDasharray="3 3" strokeWidth={2} label={{ value: 'Current Phase', position: 'insideTopLeft', fill: '#fbbf24', fontSize: 11 }} />
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

                {/* Elliptical Orbital Track */}
                <ellipse cx="100" cy="50" rx="80" ry="16" fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Animated Planet Sphere passing across star edge */}
                <circle cx={planetOrbitCoords2.x} cy={planetOrbitCoords2.y} r="8" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" className="shadow-[0_0_10px_#22d3ee]" />
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
