import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Play, Pause, RotateCcw, Sparkles, ChevronRight, Compass, ShieldCheck
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea 
} from 'recharts';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { usePlanets } from '../context/PlanetContext';

// Master Physics Telemetry Block
export const computeStellarFlux = (phaseValue) => {
  // Center primary transits at integer phases (0.0, 1.0, 2.0...)
  const distToPrimary = Math.abs(phaseValue - Math.round(phaseValue));
  // Center secondary eclipses at half-integer phases (-0.5, 0.5, 1.5...)
  const distToSecondary = Math.abs((phaseValue - 0.5) - Math.round(phaseValue - 0.5));

  const primaryHalfWindow = 0.045;   // Deep, narrow transit dip
  const secondaryHalfWindow = 0.065; // Visibly shallower and slightly wider eclipse dip

  // A. Primary Transit Dip (Baseline ~1.00 -> 0.40)
  if (distToPrimary <= primaryHalfWindow) {
    const factor = distToPrimary / primaryHalfWindow;
    const uFactor = Math.pow(Math.cos((factor * Math.PI) / 2), 1.5);
    return 1.00000 - (0.60000 * uFactor);
  }

  // B. Secondary Eclipse Dip (Baseline ~1.00 -> 0.93)
  if (distToSecondary <= secondaryHalfWindow) {
    const sFactor = distToSecondary / secondaryHalfWindow;
    const secU = Math.pow(Math.cos((sFactor * Math.PI) / 2), 1.2);
    return 1.00000 - (0.07000 * secU);
  }

  // C. Unoccluded Out-of-Transit Baseline Flux
  return 1.00000;
};

// Unified Data Generation Engine (Phased Orbit [2 cycles: -0.5 to +1.5] and Raw Photometric Stream)
export function generateTransitData(planet, viewMode = 'phased') {
  const points = [];

  if (viewMode === 'phased') {
    // Full Orbit (Phased): phase in [-0.5, 1.5] covering 2 full orbital cycles
    const step = 0.005; // 401 evenly spaced numeric samples
    for (let p = -0.5; p <= 1.50001; p += step) {
      const currentP = parseFloat(p.toFixed(3));
      const flux = computeStellarFlux(currentP);
      points.push({
        phase: currentP,
        flux: parseFloat(flux.toFixed(5)),
      });
    }
  } else {
    // Raw Flux: 0 to 100 continuous observation timeline with periodic primary and secondary dips
    const totalHours = 100;
    const step = 0.5; // 201 observation points
    const transitPeriod = 40; // Simulated orbital period in hours
    const t0 = 20; // First primary transit centered at t = 20h

    for (let t = 0; t <= totalHours + 0.001; t += step) {
      // Primary transits at 20h, 60h, 100h; secondary eclipses at 0h, 40h, 80h (half-period offset)
      const phase = (t - t0) / transitPeriod;
      const baseFlux = computeStellarFlux(phase);
      
      const i = Math.round(t / step);
      // Realistic high-cadence photometric jitter
      const pseudoNoise = (Math.sin(i * 14.3) * 0.4 + Math.cos(i * 9.1) * 0.4 + (((i * 73) % 100) - 50) / 100 * 0.4) * 0.015;
      const noisyFlux = baseFlux + pseudoNoise;

      points.push({
        time: parseFloat(t.toFixed(1)),
        flux: parseFloat(noisyFlux.toFixed(4)),
        baseFlux: parseFloat(baseFlux.toFixed(4)),
      });
    }
  }
  return points;
}

// High-Tech Tooltip
const CustomTooltip = ({ active, payload, label, viewMode }) => {
  if (active && payload && payload.length) {
    const fluxVal = Number(payload[0].value);
    const dropPct = ((1.000 - fluxVal) * 100).toFixed(2);
    const brightPct = (fluxVal * 100).toFixed(2);
    const val = typeof label === 'number' ? label : parseFloat(label);

    let phase = "Out-of-Transit Baseline";
    let phaseColor = "text-slate-400 border-slate-700 bg-slate-800/80";

    const isPhasedView = viewMode === 'phased';
    const phaseVal = isPhasedView ? val : ((val - 20) / 40);
    const distToPrimary = Math.abs(phaseVal - Math.round(phaseVal));
    const distToSecondary = Math.abs((phaseVal - 0.5) - Math.round(phaseVal - 0.5));

    if (distToPrimary <= 0.045) {
      if (distToPrimary <= 0.015) {
        phase = "Primary Mid-Transit Minimum";
        phaseColor = "text-cyan-300 border-cyan-500/50 bg-cyan-500/20";
      } else {
        phase = "Primary Transit Ingress / Egress";
        phaseColor = "text-indigo-300 border-indigo-500/50 bg-indigo-500/20";
      }
    } else if (distToSecondary <= 0.065) {
      phase = "Secondary Eclipse (Occultation)";
      phaseColor = "text-purple-300 border-purple-500/50 bg-purple-500/20";
    }

    return (
      <div className="glass-panel p-4 rounded-xl border border-cyan-500/40 shadow-2xl space-y-2 text-xs font-mono-data bg-slate-950/95 backdrop-blur-md max-w-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-slate-400">
            {isPhasedView ? 'Orbital Phase:' : 'Observation Time:'}
          </span>
          <span className="text-cyan-300 font-bold">
            {isPhasedView 
              ? (val === 0 ? "0φ" : (val > 0 ? `+${val.toFixed(2)}φ` : `${val.toFixed(2)}φ`)) 
              : `${val.toFixed(1)}h`}
          </span>
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
            <span className="text-slate-400">Flux:</span>
            <span className="text-cyan-400 font-bold">{fluxVal.toFixed(3)}</span>
          </div>
        </div>

        <div className={`mt-2 pt-1.5 pb-1 text-[11px] px-2 rounded text-center border font-semibold ${phaseColor}`}>
          {phase}
        </div>
      </div>
    );
  }
  return null;
};

export default function LightCurveLab() {
  const { planets } = usePlanets();

  // 1. Planet Selector: Filter ONLY planets with real transit data
  const transitingPlanets = useMemo(() => {
    return (planets || []).filter((p) => {
      const hasTransit = p.hasTransitData === true || 
                         p.discoveryMethod === 'Transit' || 
                         (p.transitDepth != null && Number(p.transitDepth) > 0) ||
                         (p.transitDuration != null && Number(p.transitDuration) > 0);
      const isNotEarth = p.id !== 'earth' && p.id !== 'earth-reference-standard';
      return hasTransit && isNotEarth;
    });
  }, [planets]);

  const [selectedPlanetId, setSelectedPlanetId] = useState('kepler-452b');
  const [viewMode, setViewMode] = useState('phased'); // 'phased' | 'raw'
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  // Active Selected Planet
  const planet = useMemo(() => {
    return transitingPlanets.find(p => p.id === selectedPlanetId) || transitingPlanets[0] || {
      id: 'kepler-452b',
      name: 'Kepler-452 b',
      radiusEarth: 1.63,
      starRadius: 1.11,
      orbitalPeriodDays: 384.84,
      transitDuration: 5.2,
      transitDepth: 0.000181,
      starType: 'G-Type (G2V)',
      discoveryMethod: 'Transit'
    };
  }, [transitingPlanets, selectedPlanetId]);

  // Derived Physical Parameters
  const planetMetrics = useMemo(() => {
    const rEarth = Number(planet.radiusEarth || planet.radius || 1.0);
    const sRadSolar = Number(planet.starRadius || planet.st_rad || planet.stellarRadiusSolar || 1.0);
    const periodDays = Number(planet.orbitalPeriodDays || planet.orbitalPeriod || 384.84);
    const periodHours = periodDays * 24;
    const durationHours = Number(planet.transitDuration || planet.pl_trandur || 10.0);
    const rPlanetSolar = rEarth * 0.009168;
    const Rp_Rs_ratio = rPlanetSolar / sRadSolar;

    return {
      rEarth,
      sRadSolar,
      Rp_Rs_ratio,
      rRatio: rEarth / (sRadSolar * 109.076),
      transitDepth: 0.60,
      secondaryDepth: 0.07,
      durationHours,
      periodDays,
      periodHours,
    };
  }, [planet]);

  // Generate dataset from unified physics generator
  const lightCurveData = useMemo(() => {
    return generateTransitData(planet, viewMode);
  }, [planet, viewMode]);

  // Master Synchronized Clock (In phased mode: phase φ in [-0.5, 1.5]; in raw mode: time t in [0, 100])
  const [currentTimeHours, setCurrentTimeHours] = useState(-0.5);

  // Initialize clock on view switch
  useEffect(() => {
    if (viewMode === 'phased') {
      setCurrentTimeHours(-0.5);
    } else {
      setCurrentTimeHours(0);
    }
  }, [viewMode]);

  // Live simulation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimeHours((prev) => {
        const minVal = viewMode === 'phased' ? -0.5 : 0;
        const maxVal = viewMode === 'phased' ? 1.5 : 100;
        const step = viewMode === 'phased' ? 0.005 : 0.25;
        const next = prev + step;
        if (next > maxVal) {
          return minVal;
        }
        return parseFloat(next.toFixed(4));
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying, viewMode]);

  // Master Phase (-0.5 to +1.5 for phased; periodic [0, 1) for raw)
  const currentPhase = useMemo(() => {
    if (viewMode === 'raw') {
      return (((currentTimeHours - 20) % 40) + 40) % 40 / 40;
    }
    return parseFloat(currentTimeHours.toFixed(3));
  }, [currentTimeHours, viewMode]);

  // Live calculated flux reading directly from computeStellarFlux
  const currentDerivedFlux = useMemo(() => {
    if (viewMode === 'phased') {
      return computeStellarFlux(currentPhase);
    } else {
      const phase = (currentTimeHours - 20) / 40;
      return computeStellarFlux(phase);
    }
  }, [currentPhase, currentTimeHours, viewMode]);

  // Synchronized Orbital Miniature Coordinates (Spans 2 orbits: -0.5 to +0.5 and +0.5 to +1.5)
  const miniatureCoords = useMemo(() => {
    const angle = 2 * Math.PI * (viewMode === 'raw' ? (currentTimeHours - 20) / 40 : currentPhase);

    const cx = 100;
    const cy = 50;
    const rx = 75;
    const ry = 22;

    const x = cx + rx * Math.sin(angle);
    const y = cy + ry * Math.cos(angle);

    const isForeground = Math.cos(angle) >= 0;

    const phaseVal = viewMode === 'raw' ? (currentTimeHours - 20) / 40 : currentPhase;
    const distToPrimary = Math.abs(phaseVal - Math.round(phaseVal));
    const distToSecondary = Math.abs((phaseVal - 0.5) - Math.round(phaseVal - 0.5));

    const isPrimaryTransit = distToPrimary <= 0.045;
    const isSecondaryOccultation = distToSecondary <= 0.065;

    return {
      x,
      y,
      isForeground,
      isPrimaryTransit,
      isSecondaryOccultation,
      angle,
    };
  }, [currentTimeHours, currentPhase, viewMode]);

  // Telemetry status badge
  const telemetryStatus = useMemo(() => {
    if (miniatureCoords.isPrimaryTransit) {
      return {
        label: 'Primary Transit Occlusion (In Front of Host Star)',
        color: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
        dot: 'bg-cyan-400 animate-ping',
      };
    }
    if (miniatureCoords.isSecondaryOccultation) {
      return {
        label: 'Secondary Eclipse (Occultation Behind Star)',
        color: 'text-purple-300 bg-purple-500/15 border-purple-500/30',
        dot: 'bg-purple-400',
      };
    }
    return {
      label: 'Out-of-Transit Baseline (Unoccluded Starlight)',
      color: 'text-slate-300 bg-slate-900 border-slate-800',
      dot: 'bg-emerald-400',
    };
  }, [miniatureCoords]);

  // Walkthrough Guide Steps
  const walkthroughSteps = [
    { 
      title: "1. Out-of-Transit Baseline", 
      time: -0.25,
      desc: "Between transit events, the telescope receives 100% (1.00 Flux) of the host star's unoccluded light." 
    },
    { 
      title: "2. Primary Ingress Phase", 
      time: -0.035,
      desc: "The exoplanet begins crossing the stellar limb, smoothly reducing observed light flux." 
    },
    { 
      title: "3. Mid-Transit Minimum (Orbit 1)", 
      time: 0.0,
      desc: "The planet is centered directly in front of the star at φ = 0.0. The flux drop reaches maximum depth at 0.40 Flux." 
    },
    { 
      title: "4. Primary Egress Phase", 
      time: 0.035,
      desc: "The planet exits the stellar disk, and measured brightness curves smoothly back to 1.00 baseline." 
    },
    { 
      title: "5. Secondary Eclipse Occultation (Orbit 1)", 
      time: 0.5,
      desc: "At φ = 0.5, the planet passes behind the host star, producing a shallow secondary occultation dip at ~0.93 Flux." 
    },
    { 
      title: "6. Primary Transit (Orbit 2)", 
      time: 1.0,
      desc: "One full orbital period later at φ = 1.0, the second primary transit occurs with identical depth." 
    }
  ];

  const handleStepJump = (idx) => {
    setActiveStep(idx);
    setIsPlaying(false);
    setViewMode('phased');
    setCurrentTimeHours(walkthroughSteps[idx].time);
  };

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
            Photometric brightness analysis, dynamic transit modeling, and real-time synchronized flux telemetry.
          </p>
        </div>

        {/* Controls: View Mode + Planet Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 glass-panel p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('phased')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-data transition-all ${
                viewMode === 'phased' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(129,140,248,0.2)]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Orbit (Phased)
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-data transition-all ${
                viewMode === 'raw' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Flux
            </button>
          </div>

          <select
            value={selectedPlanetId}
            onChange={(e) => setSelectedPlanetId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-mono-data text-cyan-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
          >
            {transitingPlanets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.radiusEarth ? `${Number(p.radiusEarth).toFixed(2)} R⊕` : 'Transiting'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Recharts Plot */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-data">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold pl-2">
            <span className={`w-2 h-2 rounded-full animate-ping ${viewMode === 'raw' ? 'bg-rose-400' : 'bg-cyan-400'}`}></span>
            <span>
              {viewMode === 'phased'
                ? 'Full Orbit Phased Light Curve (Primary Transits at φ = 0.0 & 1.0, Secondary Eclipses at φ = 0.5 & 1.5)'
                : 'Raw Telescopic Photometry Data Stream (Continuous Un-binned Flux with Alternating Dips)'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-mono-data"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Simulation' : 'Play Simulation'}</span>
            </button>
            <button
              onClick={() => {
                setCurrentTimeHours(viewMode === 'phased' ? -0.5 : 0);
                setIsPlaying(true);
              }}
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title="Restart Orbit Track"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HTML Badges for Transit Zones */}
        <div className="flex items-center space-x-3 pl-5 text-[11px] font-mono-data">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Primary Transit Dip Zone</span>
          </div>
          {viewMode === 'phased' && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span>Secondary Eclipse / Occultation Zone</span>
            </div>
          )}
          {viewMode === 'raw' && (
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>Simulated Telescopic Photometric Noise</span>
            </div>
          )}
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={lightCurveData}
              margin={{ top: 25, right: 35, left: 85, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              
              {/* Y Axis with clean 0.30 to 1.05 range and 'Flux' label */}
              <YAxis 
                domain={[0.3, 1.05]} 
                ticks={[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]}
                tickFormatter={(v) => Number(v).toFixed(2)}
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                label={{ value: 'Flux', angle: -90, position: 'insideLeft', offset: -60, fill: '#94a3b8', fontSize: 11 }}
              />

              {/* X Axis with explicit numeric arrays and formatters */}
              {viewMode === 'phased' ? (
                <XAxis 
                  type="number"
                  dataKey="phase" 
                  domain={[-0.5, 1.5]}
                  stroke="#64748b" 
                  ticks={[-0.5, 0, 0.5, 1.0, 1.5]} 
                  tickFormatter={(v) => v === 0 ? "0φ" : (v > 0 ? `+${v.toFixed(1)}φ` : `${v.toFixed(1)}φ`)}
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  label={{ value: 'Orbital Phase (φ)', position: 'bottom', offset: 15, fill: '#94a3b8', fontSize: 11 }}
                />
              ) : (
                <XAxis 
                  type="number"
                  dataKey="time" 
                  domain={[0, 100]}
                  stroke="#64748b" 
                  ticks={[0, 20, 40, 60, 80, 100]} 
                  tickFormatter={(v) => `${v}h`}
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  label={{ value: 'Observation Time (Hours)', position: 'bottom', offset: 15, fill: '#94a3b8', fontSize: 11 }}
                />
              )}
              
              <Tooltip content={<CustomTooltip viewMode={viewMode} />} />

              {/* Shaded Reference Areas for Primary Transits & Secondary Eclipses */}
              {viewMode === 'phased' && (
                <>
                  <ReferenceArea x1={-0.5} x2={-0.435} fill="#818cf8" fillOpacity={0.12} />
                  <ReferenceArea x1={-0.045} x2={0.045} fill="#22d3ee" fillOpacity={0.12} />
                  <ReferenceArea x1={0.435} x2={0.565} fill="#818cf8" fillOpacity={0.12} />
                  <ReferenceArea x1={0.955} x2={1.045} fill="#22d3ee" fillOpacity={0.12} />
                  <ReferenceArea x1={1.435} x2={1.5} fill="#818cf8" fillOpacity={0.12} />
                </>
              )}

              <ReferenceLine y={1.00000} stroke="#475569" strokeDasharray="3 3" />

              {/* The Visible Light Curve (Cyan for model, Rose with points for Raw Photometry) */}
              <Line 
                type="monotone" 
                dataKey="flux" 
                stroke={viewMode === 'raw' ? '#f43f5e' : '#22d3ee'} 
                strokeWidth={viewMode === 'raw' ? 1.5 : 2.5} 
                dot={viewMode === 'raw' ? { r: 1.5, fill: '#f43f5e' } : false} 
                isAnimationActive={false} 
              />

              {/* Dynamic Vertical Tracking Cursor Line */}
              <ReferenceLine 
                x={viewMode === 'phased' ? currentPhase : currentTimeHours} 
                stroke="#38bdf8" 
                strokeWidth={1.5} 
                strokeDasharray="4 4" 
                isFront={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Synchronized Orbital Miniature & Time Telemetry */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/85 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-300 font-mono-data border-b border-slate-800/80 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-cyan-300">Synchronized Orbital Miniature</span>
            <span className="text-slate-500">•</span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center space-x-1.5 ${telemetryStatus.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${telemetryStatus.dot}`}></span>
              <span>{telemetryStatus.label}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 self-end sm:self-auto">
            <div className="text-slate-400">
              {viewMode === 'phased' ? 'Orbital Phase: ' : 'Timeline Clock: '}
              <span className="text-cyan-300 font-bold">
                {viewMode === 'phased' 
                  ? (currentPhase >= 0 ? `+${currentPhase.toFixed(2)}φ` : `${currentPhase.toFixed(2)}φ`)
                  : (currentTimeHours >= 0 ? `+${currentTimeHours.toFixed(2)} hrs` : `${currentTimeHours.toFixed(2)} hrs`)}
              </span>
              {viewMode === 'phased' && (
                <span className="text-xs text-slate-500 ml-1">
                  ({currentPhase <= 0.5 ? 'Orbit 1' : 'Orbit 2'})
                </span>
              )}
            </div>
            <div className="text-slate-400">
              Live Derived Flux: <span className="text-emerald-300 font-bold">{currentDerivedFlux.toFixed(5)}</span>
            </div>
          </div>
        </div>

        {/* Orbital Track Visualizer */}
        <div className="w-full h-28 flex items-center justify-center relative">
          <svg viewBox="0 0 200 100" className="w-full h-full max-w-lg">
            <defs>
              <radialGradient id="miniStarGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
            </defs>

            {/* Orbit Ellipse */}
            <ellipse cx="100" cy="50" rx="75" ry="22" fill="none" stroke="rgba(34,211,238,0.2)" strokeDasharray="3 3" />

            {/* If Planet is behind star (far side), render planet first */}
            {!miniatureCoords.isForeground && (
              <circle 
                cx={miniatureCoords.x} 
                cy={miniatureCoords.y} 
                r="5" 
                fill="#334155" 
                stroke="#64748b" 
                strokeWidth="1.5" 
              />
            )}

            {/* Host Star Disk */}
            <circle cx="100" cy="50" r="22" fill="url(#miniStarGrad)" className="shadow-lg" />

            {/* If Planet is in front of star (near side), render planet on top */}
            {miniatureCoords.isForeground && (
              <circle 
                cx={miniatureCoords.x} 
                cy={miniatureCoords.y} 
                r="6.5" 
                fill="#0f172a" 
                stroke="#22d3ee" 
                strokeWidth="2" 
              />
            )}
          </svg>
        </div>

        {/* Time Slider Scrubbing Bar */}
        <div className="pt-2">
          <div className="flex justify-between items-center text-[11px] font-mono-data text-slate-500 pb-1">
            <span>
              {viewMode === 'phased' ? `-0.50φ (Start Orbit 1)` : `0.0 hrs`}
            </span>
            <span className="text-cyan-400 font-bold">Interactive Timeline Scrub (Angle & Flux Synced)</span>
            <span>
              {viewMode === 'phased' ? `+1.50φ (End Orbit 2)` : `100.0 hrs`}
            </span>
          </div>
          <input
            type="range"
            min={viewMode === 'phased' ? -0.5 : 0}
            max={viewMode === 'phased' ? 1.5 : 100}
            step={viewMode === 'phased' ? 0.005 : 0.25}
            value={currentTimeHours}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTimeHours(parseFloat(e.target.value));
            }}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Measured Values Panel & Step Walkthrough */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Measured Values Panel */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono-data border-b border-slate-800/80 pb-3">
            Derived Photometric Measurements
          </h3>

          <div className="space-y-3 font-mono-data text-xs">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Transit Depth (ΔF/F):</span>
              <span className="text-cyan-400 font-bold">
                {(planetMetrics.transitDepth * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Transit Duration (t_dur):</span>
              <span className="text-indigo-400 font-bold">{planetMetrics.durationHours.toFixed(2)} Hours</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Secondary Eclipse (Est.):</span>
              <span className="text-violet-300 font-bold">
                ~{(planetMetrics.secondaryDepth * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Radius Ratio (Rp/R★):</span>
              <span className="text-purple-400 font-bold">{planetMetrics.rRatio.toFixed(4)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Planetary Radius (Rp):</span>
              <span className="text-emerald-400 font-bold">{planetMetrics.rEarth.toFixed(2)} R⊕</span>
            </div>
          </div>
        </div>

        {/* Walkthrough Guide */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white font-mono-data">
              Interactive Transit Walkthrough Guide
            </h3>
            <span className="text-xs text-cyan-400 font-mono-data font-bold">
              Step {activeStep + 1} of {walkthroughSteps.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 text-sm font-mono-data">
              {walkthroughSteps[activeStep].title}
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              {walkthroughSteps[activeStep].desc}
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => handleStepJump(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-data text-slate-300 disabled:opacity-40"
            >
              ← Previous Step
            </button>

            <button
              onClick={() => handleStepJump((activeStep + 1) % walkthroughSteps.length)}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono-data font-semibold hover:bg-cyan-500/30 transition-all flex items-center space-x-1"
            >
              <span>Next Phase</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Math Rendering Section */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono-data font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Physics of Transit Photometry & Mathematical Formulation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          
          <div className="space-y-3 text-xs leading-relaxed">
            <h3 className="text-base font-bold text-white">How Light Dips Reveal Planetary Geometry</h3>
            <p className="text-slate-300">
              When an exoplanet passes directly in front of its parent star relative to our line of sight, it occludes a fraction of the star's projected surface area. By calculating the fractional brightness drop <InlineMath math="\frac{\Delta F}{F}" />, astronomers determine the geometric ratio of the planetary radius to the stellar radius.
            </p>
            <p className="text-slate-400">
              Coupled with spectroscopic radial-velocity data or mass-radius relations, transit photometry allows calculation of mean planetary bulk density and interior structure.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/20 space-y-3 shadow-inner">
            <div className="text-center text-xs font-mono-data text-slate-400 font-semibold uppercase tracking-wider">
              Transit Depth Formula
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-cyan-300 flex justify-center border border-cyan-500/10">
              <BlockMath math="\frac{\Delta F}{F} = \left(\frac{R_{\text{planet}}}{R_{\star}}\right)^2" />
            </div>
            <div className="text-center text-slate-400 text-[11px] font-mono-data">
              Where <InlineMath math="R_{\text{planet}}" /> is planet radius and <InlineMath math="R_{\star}" /> is host star radius.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
