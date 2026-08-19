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
export const computeStellarFlux = (phaseValue, planetConfig) => {
  // Normalize phase to sit cleanly between -0.5 and +0.5
  let normalizedPhase = phaseValue;
  while (normalizedPhase > 0.5) normalizedPhase -= 1.0;
  while (normalizedPhase < -0.5) normalizedPhase += 1.0;

  const { Rp_Rs_ratio, transitDurationFraction } = planetConfig;
  const primaryDepth = Math.pow(Rp_Rs_ratio, 2); // (Rp / Rs)^2
  const secondaryDepth = primaryDepth * 0.08;   // Distinct, scaled 8% visual dip
  const halfWindow = transitDurationFraction / 2;
  const rampZone = halfWindow * 0.2;             // Smooth physical limb-darkening ingress

  // A. Primary Transit Zone (Centered at phase = 0.0)
  if (Math.abs(normalizedPhase) <= halfWindow) {
    if (Math.abs(normalizedPhase) < halfWindow - rampZone) {
      return 1.00000 - primaryDepth;
    }
    const factor = (halfWindow - Math.abs(normalizedPhase)) / rampZone;
    return 1.00000 - (primaryDepth * Math.sin((factor * Math.PI) / 2));
  }

  // B. Secondary Eclipse Zone (Centered tightly at phase = ±0.5)
  const distToSecondary = Math.abs(Math.abs(normalizedPhase) - 0.5);
  if (distToSecondary <= halfWindow) {
    if (distToSecondary < halfWindow - rampZone) {
      return 1.00000 - secondaryDepth;
    }
    const factor = (halfWindow - distToSecondary) / rampZone;
    return 1.00000 - (secondaryDepth * Math.sin((factor * Math.PI) / 2));
  }

  // C. Unoccluded Baseline Star Starlight
  return 1.00000;
};

// Unified Data Generation Engine (Transit Window, Phased Orbit, and Raw Photometric Stream)
export function generateTransitData(planet, viewMode = 'transitWindow') {
  const points = [];
  const rStar = Number(planet.starRadius || planet.st_rad || planet.stellarRadiusSolar || 1.0);
  const rPlanetEarth = Number(planet.radius || planet.radiusEarth || planet.pl_rade || 1.0);
  const rPlanetSolar = rPlanetEarth * 0.009168; // Earth radii to Solar radii
  const Rp_Rs_ratio = rPlanetSolar / rStar;
  const durationHours = Number(planet.transitDuration || planet.pl_trandur || 10.0);
  const periodHours = Number(planet.orbitalPeriod || planet.orbitalPeriodDays || planet.pl_orbper || 384.8) * 24;

  if (viewMode === 'transitWindow') {
    // Window coordinates: t in [-16, 16] hours
    const halfWindow = 16;
    const windowSpan = 32;
    const transitDurationFraction = durationHours / windowSpan;
    const config = { Rp_Rs_ratio, transitDurationFraction };
    const step = 0.25; // 128 evenly spaced numeric samples

    for (let t = -halfWindow; t <= halfWindow; t += step) {
      const phase = t / windowSpan;
      const flux = computeStellarFlux(phase, config);
      points.push({
        time: parseFloat(t.toFixed(2)),
        flux: parseFloat(flux.toFixed(6)),
      });
    }
  } else if (viewMode === 'phased') {
    // Full Orbit (Phased): phase in [-0.5, 0.5]
    const transitDurationFraction = Math.max(0.08, durationHours / periodHours);
    const config = { Rp_Rs_ratio, transitDurationFraction };
    const step = 1.0 / 200; // 200 evenly spaced numeric samples

    for (let p = -0.5; p <= 0.500001; p += step) {
      const currentP = Math.max(-0.5, Math.min(0.5, p));
      const flux = computeStellarFlux(currentP, config);
      points.push({
        phase: parseFloat(currentP.toFixed(3)),
        flux: parseFloat(flux.toFixed(6)),
      });
    }
  } else {
    // Raw Flux: 0 to 100 continuous observation timeline with Kepler/TESS photometric scatter
    const totalHours = 100;
    const step = 0.5; // 200 observation points
    const transitPeriod = Math.min(40, periodHours);
    const transitDurationFraction = durationHours / transitPeriod;
    const config = { Rp_Rs_ratio, transitDurationFraction };

    for (let t = 0; t <= totalHours; t += step) {
      const phase = (((t - 30) % transitPeriod) + transitPeriod) % transitPeriod / transitPeriod - 0.5;
      const baseFlux = computeStellarFlux(phase, config);
      const i = Math.round(t / step);
      const pseudoNoise = (Math.sin(i * 14.3) * 0.35 + Math.cos(i * 9.1) * 0.35 + (((i * 73) % 100) - 50) / 100 * 0.4) * 0.00008;
      const noisyFlux = Math.min(1.00000, baseFlux + pseudoNoise);

      points.push({
        time: parseFloat(t.toFixed(2)),
        flux: parseFloat(noisyFlux.toFixed(6)),
        baseFlux: parseFloat(baseFlux.toFixed(6)),
      });
    }
  }
  return points;
}

// High-Tech Tooltip
const CustomTooltip = ({ active, payload, label, viewMode, durationHours }) => {
  if (active && payload && payload.length) {
    const fluxVal = Number(payload[0].value);
    const dropPct = ((1.000 - fluxVal) * 100).toFixed(4);
    const brightPct = (fluxVal * 100).toFixed(4);
    const val = typeof label === 'number' ? label : parseFloat(label);

    let phase = "Out-of-Transit Baseline";
    let phaseColor = "text-slate-400 border-slate-700 bg-slate-800/80";

    const isPhasedView = viewMode === 'phased';
    const isPrimaryTransit = isPhasedView ? Math.abs(val) <= 0.04 : (viewMode === 'transitWindow' ? Math.abs(val) <= (0.5 * (durationHours || 5.0)) : (Math.abs((val - 30) % 40) <= (0.5 * (durationHours || 5.0))));
    const isSecondaryEclipse = isPhasedView && (Math.abs(val - 0.5) <= 0.06 || Math.abs(val + 0.5) <= 0.06);

    if (isPrimaryTransit) {
      if (Math.abs(val) <= 0.15 || (viewMode === 'raw' && Math.abs((val - 30) % 40) <= 0.5)) {
        phase = "Primary Mid-Transit Minimum";
        phaseColor = "text-cyan-300 border-cyan-500/50 bg-cyan-500/20";
      } else {
        phase = val < 0 ? "Primary Transit Ingress" : "Primary Transit Egress";
        phaseColor = "text-indigo-300 border-indigo-500/50 bg-indigo-500/20";
      }
    } else if (isSecondaryEclipse) {
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
              : (val === 0 ? "0h" : (val > 0 ? `+${val.toFixed(2)}h` : `${val.toFixed(2)}h`))}
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
            <span className="text-slate-400">Normalized Flux:</span>
            <span className="text-cyan-400 font-bold">{fluxVal.toFixed(5)}</span>
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
  const [viewMode, setViewMode] = useState('transitWindow'); // 'transitWindow' | 'phased' | 'raw'
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
    const primaryDepth = Math.pow(Rp_Rs_ratio, 2);
    const secondaryDepth = primaryDepth * 0.08;

    return {
      rEarth,
      sRadSolar,
      Rp_Rs_ratio,
      rRatio: rEarth / (sRadSolar * 109.076),
      transitDepth: primaryDepth,
      secondaryDepth,
      durationHours,
      halfWindow: 16,
      periodDays,
      periodHours,
    };
  }, [planet]);

  // Generate dataset from unified physics generator
  const lightCurveData = useMemo(() => {
    return generateTransitData(planet, viewMode);
  }, [planet, viewMode]);

  // Master Synchronized Clock
  const [currentTimeHours, setCurrentTimeHours] = useState(0);

  // Initialize clock on view switch
  useEffect(() => {
    if (viewMode === 'transitWindow') {
      setCurrentTimeHours(-16);
    } else if (viewMode === 'phased') {
      setCurrentTimeHours(-planetMetrics.periodHours / 2);
    } else {
      setCurrentTimeHours(0);
    }
  }, [viewMode, planetMetrics.periodHours]);

  // Live simulation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimeHours((prev) => {
        const minVal = viewMode === 'transitWindow' ? -16 : (viewMode === 'phased' ? -planetMetrics.periodHours / 2 : 0);
        const maxVal = viewMode === 'transitWindow' ? 16 : (viewMode === 'phased' ? planetMetrics.periodHours / 2 : 100);
        const step = (maxVal - minVal) / 280;
        const next = prev + step;
        if (next > maxVal) {
          return minVal;
        }
        return next;
      });
    }, 35);
    return () => clearInterval(interval);
  }, [isPlaying, viewMode, planetMetrics]);

  // Master Phase (-0.5 to +0.5)
  const currentPhase = useMemo(() => {
    if (viewMode === 'raw') {
      const transitPeriod = Math.min(40, planetMetrics.periodHours);
      return (((currentTimeHours - 30) % transitPeriod) + transitPeriod) % transitPeriod / transitPeriod - 0.5;
    }
    const raw = currentTimeHours / (planetMetrics.periodHours || 1);
    return parseFloat(raw.toFixed(4));
  }, [currentTimeHours, planetMetrics.periodHours, viewMode]);

  // Live calculated flux reading directly from computeStellarFlux
  const currentDerivedFlux = useMemo(() => {
    const { Rp_Rs_ratio, durationHours, periodHours } = planetMetrics;
    if (viewMode === 'transitWindow') {
      const transitDurationFraction = durationHours / 32;
      return computeStellarFlux(currentTimeHours / 32, { Rp_Rs_ratio, transitDurationFraction });
    } else if (viewMode === 'phased') {
      const transitDurationFraction = Math.max(0.08, durationHours / periodHours);
      return computeStellarFlux(currentPhase, { Rp_Rs_ratio, transitDurationFraction });
    } else {
      const transitPeriod = Math.min(40, periodHours);
      const transitDurationFraction = durationHours / transitPeriod;
      return computeStellarFlux(currentPhase, { Rp_Rs_ratio, transitDurationFraction });
    }
  }, [currentTimeHours, currentPhase, viewMode, planetMetrics]);

  // Synchronized Orbital Miniature Coordinates
  const miniatureCoords = useMemo(() => {
    const { periodHours, durationHours } = planetMetrics;
    const angle = 2 * Math.PI * (viewMode === 'raw' ? currentPhase : currentTimeHours / (periodHours || 1));

    const cx = 100;
    const cy = 50;
    const rx = 75;
    const ry = 22;

    const x = cx + rx * Math.sin(angle);
    const y = cy + ry * Math.cos(angle);

    const isForeground = Math.cos(angle) >= 0;
    const isPrimaryTransit = viewMode === 'raw' 
      ? Math.abs(currentPhase * Math.min(40, periodHours)) <= (durationHours / 2)
      : Math.abs(currentTimeHours) <= (durationHours / 2);
    const isSecondaryOccultation = Math.min(
      Math.abs(currentTimeHours - periodHours / 2),
      Math.abs(currentTimeHours + periodHours / 2)
    ) <= (durationHours / 2);

    return {
      x,
      y,
      isForeground,
      isPrimaryTransit,
      isSecondaryOccultation,
      angle,
    };
  }, [currentTimeHours, currentPhase, viewMode, planetMetrics]);

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
      time: -16,
      desc: "Before ingress, the telescope receives 100% (1.00000 flux) of the host star's unoccluded light." 
    },
    { 
      title: "2. Primary Ingress Phase", 
      time: -0.38 * planetMetrics.durationHours,
      desc: "The exoplanet begins crossing the stellar limb, smoothly reducing observed light flux." 
    },
    { 
      title: "3. Mid-Transit Minimum", 
      time: 0,
      desc: "The planet is centered directly in front of the star. The flux drop reaches maximum depth: (Rp/R★)²." 
    },
    { 
      title: "4. Primary Egress Phase", 
      time: 0.38 * planetMetrics.durationHours,
      desc: "The planet exits the stellar disk, and measured brightness curves smoothly back to 1.00000 baseline." 
    },
    { 
      title: "5. Secondary Eclipse Occultation", 
      time: planetMetrics.periodHours / 2,
      desc: "Half an orbit later, the planet passes behind the host star, producing a shallow secondary dip." 
    }
  ];

  const handleStepJump = (idx) => {
    setActiveStep(idx);
    setIsPlaying(false);
    if (idx === 4) {
      setViewMode('phased');
      setCurrentTimeHours(planetMetrics.periodHours / 2);
    } else {
      setViewMode('transitWindow');
      setCurrentTimeHours(walkthroughSteps[idx].time);
    }
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
              onClick={() => setViewMode('transitWindow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-data transition-all ${
                viewMode === 'transitWindow' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Transit Window
            </button>
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
              {viewMode === 'transitWindow' 
                ? 'Normalized Stellar Flux vs. Time (Hours relative to mid-transit)' 
                : viewMode === 'phased'
                ? 'Full Orbit Phased Light Curve (Primary Transit centered at Phase φ = 0.0)'
                : 'Raw Telescopic Photometry Data Stream (Continuous Un-binned Flux)'}
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
                setCurrentTimeHours(viewMode === 'transitWindow' ? -16 : (viewMode === 'phased' ? -planetMetrics.periodHours / 2 : 0));
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
              
              {/* Y Axis with safe margin, precision, and locked 1.00000 upper bound */}
              <YAxis 
                domain={[dataMin => dataMin - 0.00005, 1.00000]} 
                tickFormatter={(v) => Number(v).toFixed(5)}
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                label={{ value: 'Normalized Flux', angle: -90, position: 'insideLeft', offset: -60, fill: '#94a3b8', fontSize: 11 }}
              />

              {/* X Axis with explicit numeric arrays and formatters */}
              {viewMode === 'transitWindow' ? (
                <XAxis 
                  type="number"
                  dataKey="time" 
                  domain={[-16, 16]}
                  stroke="#64748b" 
                  ticks={[-16, -12, -8, -4, 0, 4, 8, 12]}
                  tickFormatter={(v) => v === 0 ? "0h" : (v > 0 ? `+${v}h` : `${v}h`)}
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  label={{ value: 'Time (Hours from mid-transit)', position: 'bottom', offset: 15, fill: '#94a3b8', fontSize: 11 }}
                />
              ) : viewMode === 'phased' ? (
                <XAxis 
                  type="number"
                  dataKey="phase" 
                  domain={[-0.5, 0.5]}
                  stroke="#64748b" 
                  ticks={[-0.5, -0.25, 0, 0.25, 0.5]} 
                  tickFormatter={(v) => v === 0 ? "0φ" : (v > 0 ? `+${v}φ` : `${v}φ`)}
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
              
              <Tooltip content={<CustomTooltip viewMode={viewMode} durationHours={planetMetrics.durationHours} />} />

              {/* Subtle background highlight for Primary Transit */}
              {viewMode === 'transitWindow' ? (
                <ReferenceArea 
                  x1={-0.5 * planetMetrics.durationHours} 
                  x2={0.5 * planetMetrics.durationHours} 
                  fill="#22d3ee" 
                  fillOpacity={0.06} 
                />
              ) : viewMode === 'phased' ? (
                <ReferenceArea 
                  x1={-(planetMetrics.durationHours / planetMetrics.periodHours) / 2} 
                  x2={(planetMetrics.durationHours / planetMetrics.periodHours) / 2} 
                  fill="#22d3ee" 
                  fillOpacity={0.06} 
                />
              ) : null}

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
              Timeline Clock: <span className="text-cyan-300 font-bold">{currentTimeHours >= 0 ? `+${currentTimeHours.toFixed(2)}` : currentTimeHours.toFixed(2)} hrs</span>
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
              {viewMode === 'transitWindow' ? `-16.0 hrs` : (viewMode === 'phased' ? `-${(planetMetrics.periodHours / 2).toFixed(1)} hrs` : `0.0 hrs`)}
            </span>
            <span className="text-cyan-400 font-bold">Interactive Timeline Scrub (Angle & Flux Synced)</span>
            <span>
              {viewMode === 'transitWindow' ? `+16.0 hrs` : (viewMode === 'phased' ? `+${(planetMetrics.periodHours / 2).toFixed(1)} hrs` : `100.0 hrs`)}
            </span>
          </div>
          <input
            type="range"
            min={viewMode === 'transitWindow' ? -16 : (viewMode === 'phased' ? -planetMetrics.periodHours / 2 : 0)}
            max={viewMode === 'transitWindow' ? 16 : (viewMode === 'phased' ? planetMetrics.periodHours / 2 : 100)}
            step="0.05"
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
