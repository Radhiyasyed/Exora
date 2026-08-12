import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Orbit, Globe, Sparkles, Activity, Scale, ArrowLeft, Info, 
  RotateCw, ShieldCheck, Thermometer, Radio, Gauge, Move3d
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { usePlanets } from '../context/PlanetContext';
import Planet3DViewer from '../components/Planet3DViewer';

function getMetric(planet, camelKey, snakeKey, fallback = null) {
  return planet?.[camelKey] ?? planet?.[snakeKey] ?? fallback;
}

export default function PlanetDetail() {
  const { planetId } = useParams();
  const { planets, getPlanetById, getPlanetByName, isLoading } = usePlanets();

  // Try to find planet by ID first, then by name, fallback to first planet or null
  const planet = getPlanetById(planetId) || getPlanetByName(planetId) || planets[0] || null;
  const earth = getPlanetById('earth') || getPlanetByName('earth') || null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800 font-mono-data text-xs text-cyan-400 animate-pulse">
          Loading planet data...
        </div>
      </div>
    );
  }

  // Show error state if planet not found
  if (!planet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4 border border-slate-800">
          <p className="text-slate-400 text-sm">Planet not found: {planetId}</p>
          <Link
            to="/search"
            className="inline-block px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const computeESI = (planet) => {
    const r = planet.radiusEarth;
    const density = planet.massEarth / Math.max(1, Math.pow(planet.radiusEarth, 3));
    const flux = Math.max(0.1, Math.min(3.0, planet.equilibriumTempK / 255));
    const wR = 0.57;
    const wD = 1.07;
    const wF = 0.62;
    const esiR = Math.pow(1 - Math.abs(r - 1) / (r + 1), wR);
    const esiD = Math.pow(1 - Math.abs(density - 1) / (density + 1), wD);
    const esiF = Math.pow(1 - Math.abs(flux - 1) / (flux + 1), wF);
    return Math.max(0, Math.min(1, esiR * esiD * esiF));
  };

  const computeHI = (planet) => {
    const r = planet.radiusEarth;
    const density = planet.massEarth / Math.max(1, Math.pow(planet.radiusEarth, 3));
    const flux = Math.max(0.1, Math.min(3.0, planet.equilibriumTempK / 255));
    const esiR = Math.pow(1 - Math.abs(r - 1) / (r + 1), 0.57);
    const esiD = Math.pow(1 - Math.abs(density - 1) / (density + 1), 1.07);
    const esiF = Math.pow(1 - Math.abs(flux - 1) / (flux + 1), 0.62);
    return Math.max(0, Math.min(1, 0.45 * esiR + 0.30 * esiD + 0.25 * esiF));
  };

  const computedESI = computeESI(planet);
  const computedHI = computeHI(planet);

  const displayedESI = getMetric(planet, 'esiScore', 'esi_score', computedESI);
  const displayedPHI = getMetric(planet, 'phiScore', 'phi_score', computedHI);
  const habitabilityIndex = planet.habitabilityIndex ?? computedHI;
  const inHabitableZone = planet.inHabitableZone ?? planet.isInHabitableZone ?? planet.is_in_habitable_zone ?? (habitabilityIndex >= 0.6);

  // 6 Parameter Cards
  const parameters = [
    { label: "Planetary Radius", value: `${planet.radiusEarth ?? '—'} R⊕`, sub: "Earth radii", icon: Globe, color: "text-cyan-400" },
    { label: "Est. Mass", value: `${planet.massEarth ?? '—'} M⊕`, sub: "Earth masses", icon: Orbit, color: "text-indigo-400" },
    { label: "Earth Similarity Index (ESI)", value: `${displayedESI.toFixed(2)} / 1.00`, sub: "Backend-calculated similarity score", icon: Sparkles, color: "text-emerald-400" },
    { label: "Potential Habitability Index (PHI)", value: `${displayedPHI.toFixed(2)} / 1.00`, sub: "Surface and flux habitability proxy", icon: ShieldCheck, color: "text-cyan-400" },
    { label: "Orbital Period", value: `${planet.orbitalPeriodDays ?? planet.orbitPeriod ?? '—'} days`, sub: "Annual year length", icon: RotateCw, color: "text-emerald-400" },
    { label: "Surface Gravity", value: `${planet.surfaceGravityG ?? '—'} g`, sub: "Relative to Earth", icon: Gauge, color: "text-amber-400" },
  ];

  // Recharts Earth-similarity metric dataset
  const comparisonData = [
    { metric: "Radius (R⊕)", Planet: planet.radiusEarth ?? 0, Earth: 1.0 },
    { metric: "Mass (M⊕)", Planet: planet.massEarth ?? 0, Earth: 1.0 },
    { metric: "Temp (K)", Planet: planet.equilibriumTempK ? Number((planet.equilibriumTempK / 255).toFixed(2)) : 0, Earth: 1.0 },
    { metric: "Gravity (g)", Planet: planet.surfaceGravityG ?? 0, Earth: 1.0 },
    { metric: "Earth Similarity (ESI)", Planet: Number(displayedESI), Earth: 1.0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/search"
          className="inline-flex items-center space-x-2 text-xs font-mono-data text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exoplanet Catalog</span>
        </Link>

        <div className="flex space-x-3">
          <Link
            to="/compare"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compare Worlds</span>
          </Link>
          <Link
            to="/lightcurve"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300 hover:brightness-125 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Light Curve Lab</span>
          </Link>
        </div>
      </div>

      {/* Hero Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Interactive Three.js 3D Sphere Showcase */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-4">
          <div className="relative w-full h-[380px] sm:h-[450px] glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden flex items-center justify-center">
            
            {/* Ambient Lighting Background */}
            <div className="absolute w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl -z-10" />

            {/* Pure Three.js Interactive 3D Sphere Component */}
            <Planet3DViewer planetColor={planet.color || '#22d3ee'} planetName={planet.name || 'Exoplanet'} />

          </div>

          {/* Mandatory Label Notice */}
          <div className="text-center">
            <span className="text-[12px] font-mono-data text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
              Artist's visualization — not a direct photograph
            </span>
          </div>
        </div>

        {/* Right Info Showcase */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-data">
              <Orbit className="w-3.5 h-3.5" />
              <span>{planet.system || planet.starName || 'Unknown'} System • {planet.starType || 'Unknown'} Host</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white">{planet.name}</h1>
            <p className="text-slate-300 text-sm leading-relaxed">{planet.description || `Exoplanet ${planet.name} orbits ${planet.starName || 'a host star'} at a distance of ${planet.distanceLy || 'unknown'} light-years from Earth.`}</p>
          </div>

          {/* Dual ESI & PHI Radial Gauges */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between space-x-6">
            {/* ESI Gauge */}
            <div className="flex-1 space-y-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-mono-data text-slate-400">Earth Similarity Index (ESI)</span>
                <div className="text-2xl font-extrabold text-white font-display">
                  {displayedESI.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 1.00</span>
                </div>
              </div>
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-400"
                    strokeDasharray={`${displayedESI * 100}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[12px] font-bold font-mono-data text-cyan-300">
                  {Math.round(displayedESI * 100)}%
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-slate-800"></div>

            {/* PHI Gauge */}
            <div className="flex-1 space-y-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-mono-data text-slate-400">Potential Habitability Index (PHI)</span>
                <div className="text-2xl font-extrabold text-white font-display">
                  {displayedPHI.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 1.00</span>
                </div>
              </div>
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-400"
                    strokeDasharray={`${displayedPHI * 100}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[12px] font-bold font-mono-data text-purple-300">
                  {Math.round(displayedPHI * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* HZ Status Badge */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono-data text-slate-400">Habitable Zone Status</span>
              <p className="text-sm text-slate-200">
                {inHabitableZone ? '✓ Inside Circumstellar Habitable Zone' : '⚠ Outside Optimistic HZ'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${inHabitableZone ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          </div>

          {/* Atmosphere Composition Tags */}
          <div className="space-y-2">
            <span className="text-xs font-mono-data text-slate-400">Atmospheric Spectrographic Indicators:</span>
            <div className="flex flex-wrap gap-2">
              {planet.atmosphere && planet.atmosphere.length > 0 ? (
                planet.atmosphere.map((gas, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono-data text-slate-300">
                    {gas}
                  </span>
                ))
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono-data text-slate-500">
                  No atmospheric data available
                </span>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 6 Parameter Metrics Cards Grid */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white">Physical & Orbital Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {parameters.map((param, i) => {
            const Icon = param.icon;
            return (
              <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
                  <span>{param.label}</span>
                  <Icon className={`w-4 h-4 ${param.color}`} />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono-data">
                  {param.value}
                </div>
                <div className="text-[12px] text-slate-500 font-mono-data">{param.sub}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Earth-Similarity Comparison Bar Chart & Prose Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recharts Bar Chart */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Earth Comparison Matrix</h3>
            <span className="text-xs font-mono-data text-cyan-400">Normalized Scale</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : value, name]}
                />
                <Bar dataKey="Planet" fill="#22d3ee" radius={[6, 6, 0, 0]} name={planet.name || 'Planet'} />
                <Bar dataKey="Earth" fill="#818cf8" radius={[6, 6, 0, 0]} name="Earth" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Why Interesting Prose Panel */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono-data">
              <Sparkles className="w-4 h-4" />
              <span>Scientific Significance</span>
            </div>
            <h3 className="text-lg font-bold text-white">Why {planet.name} is Compelling</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              {planet.whyInteresting || `This exoplanet represents one of the many fascinating worlds discovered in our galaxy. With an Earth Similarity Index of ${displayedESI.toFixed(2)} and a Potential Habitability Index of ${displayedPHI.toFixed(2)}, it offers a modern perspective on planetary habitability.`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono-data text-slate-400 block">Discovery Pipeline:</span>
            <div className="flex justify-between text-xs font-mono-data text-slate-200">
              <span>Method: {planet.discoveryMethod || 'Unknown'}</span>
              <span>Year: {planet.discoveryYear || 'N/A'}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
