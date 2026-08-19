import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Orbit, Globe, Sparkles, Activity, Scale, ArrowLeft,
  RotateCw, Thermometer, Database, CheckCircle2,
  Ruler, Compass
} from 'lucide-react';
import { usePlanets } from '../context/PlanetContext';
import { fetchPlanetById } from '../api/exoplanetsApi';
import Planet3DViewer from '../components/Planet3DViewer';

function generatePlanetTagline(planet) {
  if (!planet) return 'Cataloged Exoplanetary World';
  const nameLower = (planet.name || '').toLowerCase();
  
  if (nameLower.includes('kepler-452')) return "Earth's Larger, Older Cousin";
  if (nameLower.includes('trappist-1 e') || nameLower.includes('trappist-1e')) return "Temperate Terrestrial World in Multi-Planet System";
  if (nameLower.includes('proxima')) return "Our Nearest Known Exoplanetary Neighbor";
  if (nameLower.includes('lhs 1140') || nameLower.includes('lhs-1140')) return "Dense Ocean Candidate in Quiet Red Dwarf System";
  if (nameLower.includes('kepler-22')) return "First Confirmed Habitable Zone Planet of a Sun-Like Star";
  if (nameLower.includes('kepler-186')) return "First Validated Earth-Sized Habitable Zone World";
  if (nameLower.includes('kepler-438')) return "Warm Terrestrial Super-Earth";
  if (nameLower.includes('toi-700')) return "TESS Validated Earth-Sized Habitable World";
  if (nameLower.includes('k2-18')) return "Hycean Candidate with Spectroscopic Detections";
  if (nameLower.includes('hd 209458')) return "Archetypal Hot Jupiter with Evaporating Atmosphere";
  if (nameLower.includes('wasp-12')) return "Ultra-Hot Tidally Distorted Gas Giant";

  const radius = Number(planet.radiusEarth || 1.0);
  const temp = Number(planet.equilibriumTempK ?? planet.eqTempK ?? 288);
  const inHZ = planet.zoneStatus === 'Habitable Zone' || planet.inHabitableZone;

  if (radius > 8) return "Massive Gas Giant with Extended Atmosphere";
  if (radius >= 1.75 && radius <= 4.0) return "Sub-Neptune Transiting Laboratory";
  if (inHZ) return "Temperate Circumstellar Habitable Zone World";
  if (temp > 700) return "Heavily Irradiated High-Temperature Exoplanet";
  if (temp < 190) return "Cryogenic Outer System Exoplanetary Body";
  return "Cataloged Exoplanetary Target";
}

export default function PlanetDetail() {
  const { planetId } = useParams();
  const { getPlanetById, planets, isLoading: isContextLoading } = usePlanets();
  const [planet, setPlanet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // 1. Try resolving from loaded context first
    const match = getPlanetById(planetId);
    if (match) {
      setPlanet(match);
      setIsLoading(false);
      return;
    }

    // 2. If not found in context or context is loading, fetch directly
    fetchPlanetById(planetId)
      .then(res => {
        if (isMounted) {
          if (res && res.planet) {
            setPlanet(res.planet);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [planetId, planets]);

  // Loading State
  if (isLoading || isContextLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-panel p-16 rounded-3xl text-center border border-slate-800 font-mono-data text-xs text-cyan-400 animate-pulse space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>Loading high-precision exoplanet metrics...</div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!planet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-panel p-12 rounded-3xl text-center space-y-5 border border-slate-800 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Target World Not Found</h2>
            <p className="text-slate-400 text-xs">Could not locate exoplanet parameters for "{planetId}".</p>
          </div>
          <Link
            to="/search"
            className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
          >
            Back to Exoplanet Catalog
          </Link>
        </div>
      </div>
    );
  }

  const name = planet.name || 'Exoplanet';
  const tagline = generatePlanetTagline(planet);
  const esi = Number(planet.esi ?? planet.esiScore ?? 0);
  const esiPercent = Math.min(100, Math.max(0, Math.round(esi * 100)));
  const hzd = planet.hzd != null ? Number(planet.hzd) : (planet.zoneStatus === 'Too Hot' || (planet.equilibriumTempK ?? planet.eqTempK) > 350 ? -1.5 : (planet.zoneStatus === 'Too Cold' || (planet.equilibriumTempK ?? planet.eqTempK) < 200 ? 2.5 : 0.2));

  let zoneStatusText = planet.zoneStatus || planet.hzStatus || planet.hzdStatus;
  if (!zoneStatusText) {
    if (hzd < -1.0) {
      zoneStatusText = 'Too Hot';
    } else if (hzd > 1.0) {
      zoneStatusText = 'Too Cold';
    } else {
      zoneStatusText = 'Habitable Zone';
    }
  }
  const inHZ = zoneStatusText === 'Habitable Zone' || zoneStatusText === 'HZ Candidate';

  const radius = planet.radiusEarth ? Number(planet.radiusEarth) : null;
  const mass = planet.massEarth ? Number(planet.massEarth) : null;
  const temp = planet.equilibriumTempK ?? planet.eqTempK ? Number(planet.equilibriumTempK ?? planet.eqTempK) : null;
  const period = planet.orbitalPeriodDays ?? planet.orbitPeriod ? Number(planet.orbitalPeriodDays ?? planet.orbitPeriod) : null;
  const starType = planet.starSpectralType || planet.starType || 'Unknown Host';
  const distance = (planet.distanceLy != null && !isNaN(Number(planet.distanceLy))) ? `${Number(planet.distanceLy).toFixed(1)} LY` : 'Distance data not yet available';
  const discoveryMethod = planet.discoveryMethod || 'Transit Photometry';
  const discoveryYear = planet.discoveryYear ? `${planet.discoveryYear}` : 'Archived';

  // Earth comparison ratios
  const radiusRatio = radius ? Math.min(3, radius / 1.0) : 0;
  const tempRatio = temp ? Math.min(3, temp / 255) : 0;
  const massRatio = mass ? Math.min(3, mass / 1.0) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/search"
          className="inline-flex items-center space-x-2 text-xs font-mono-data text-slate-400 hover:text-cyan-300 transition-colors py-1.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Exoplanet Catalog</span>
        </Link>
      </div>

      {/* Hero Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left: 3D Rotating Planet Visual with Atmospheric Glow */}
        <div className="lg:col-span-6 flex flex-col items-center space-y-3">
          <div className="relative w-full h-[400px] sm:h-[460px] glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden flex flex-col items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.12)] p-4">
            <div className="absolute w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl -z-10" />
            <Planet3DViewer 
              key={planet.id || name} 
              planet={{ ...planet, zoneStatus: zoneStatusText }} 
              size={320}
              isHero={false} 
              className="w-full flex items-center justify-center" 
            />
            {/* Interaction Badge */}
            <div className="text-xs font-mono-data text-cyan-300/80 bg-slate-950/60 px-3 py-1 rounded-full border border-cyan-500/20 shadow-sm mt-3">
              Double click and drag to rotate • Scroll to zoom
            </div>
          </div>

          <span className="text-[11px] font-mono-data text-slate-400 bg-slate-900/80 px-3.5 py-1 rounded-full border border-slate-800">
            Artist's visualization, not a direct photograph
          </span>
        </div>

        {/* Right: Planet Identity, Status Badges, ESI Circular Gauge, HZD & Repositioned Action Buttons */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2.5">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono-data">
                <Orbit className="w-3 h-3 text-cyan-400" />
                <span>{planet.system || planet.starName || name} System</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono-data">
                <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                <span>Confirmed Exoplanet</span>
              </span>
              {inHZ && (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono-data font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>HZ Candidate</span>
                </span>
              )}
            </div>

            {/* Title & Tagline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {name}
            </h1>
            <p className="text-base sm:text-lg font-medium text-cyan-400/90 font-display">
              {tagline}
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
              {planet.description || `${name} orbits host star ${planet.starName || 'a stellar host'} at an orbital distance of ${planet.orbitAU || planet.orbitalSemiMajorAxisAU || 'undetermined'} AU.`}
            </p>
          </div>

          {/* Gauges & Habitable Zone Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* ESI Circular Gauge */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between space-x-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono-data text-slate-400 uppercase tracking-wider block">
                  Earth Similarity
                </span>
                <div className="text-2xl font-extrabold text-white font-mono-data">
                  {esi.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 1.00</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono-data block">
                  {esi >= 0.8 ? 'High Similarity' : (esi >= 0.5 ? 'Moderate Similarity' : 'Low Similarity')}
                </span>
              </div>

              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-400"
                    strokeDasharray={`${esiPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold font-mono-data text-cyan-300">
                  {esiPercent}%
                </span>
              </div>
            </div>

            {/* HZD Value & Habitable Zone Status */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <span className="text-[11px] font-mono-data text-slate-400 uppercase tracking-wider block">
                  Habitable Zone (HZD)
                </span>
                <div className="text-xl font-extrabold text-white font-mono-data">
                  {hzd >= 0 ? `+${hzd.toFixed(2)}` : hzd.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
                <span className={`w-2 h-2 rounded-full ${inHZ ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className="text-xs text-slate-200 font-mono-data">
                  {zoneStatusText}
                </span>
              </div>
            </div>

          </div>

          {/* Repositioned Action Buttons: Light Curve & Compare */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Link
              to={`/lightcurve`}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/25 to-blue-600/25 hover:from-cyan-500/35 hover:to-blue-600/35 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.15)] group"
            >
              <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Explore its Light Curve &rarr;</span>
            </Link>
            <Link
              to={`/compare`}
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/30 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm group"
            >
              <Scale className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Compare with Earth &rarr;</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Key Stats Grid: Radius, Orbital Period, Eq. Temperature, Host Star Type, Distance, Discovery Method */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-base">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2>Key Astronomical Parameters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Radius */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Planetary Radius</span>
              <Ruler className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono-data">
              {radius ? `${radius.toFixed(2)} R⊕` : 'Archive Undetermined'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-data">Relative to Earth radius (1.00 R⊕)</div>
          </div>

          {/* Orbital Period */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Orbital Period</span>
              <RotateCw className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono-data">
              {period ? `${period.toFixed(1)} days` : 'Archive Undetermined'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-data">Duration of one complete planetary year</div>
          </div>

          {/* Eq. Temperature */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Eq. Temperature</span>
              <Thermometer className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono-data">
              {temp ? `${temp.toFixed(0)} K` : 'Archive Undetermined'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-data">
              {temp ? `${(temp - 273.15).toFixed(0)} °C surface equilibrium` : 'Surface thermal estimate'}
            </div>
          </div>

          {/* Host Star Type */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Host Star Type</span>
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-white font-mono-data">
              {starType}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-data">
              {planet.stellarTempK ? `${Number(planet.stellarTempK).toFixed(0)} K host temperature` : 'Spectral classification'}
            </div>
          </div>

          {/* Distance */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Distance from Earth</span>
              <Compass className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono-data">
              {distance}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-data">Measured in light-years (LY)</div>
          </div>

          {/* Discovery Method */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono-data text-slate-400">
              <span>Discovery Pipeline</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-extrabold text-white font-mono-data">
              {discoveryMethod}
            </div>
            <div className="text-[11px] text-slate-500 font-mono-data">Confirmed {discoveryYear}</div>
          </div>
        </div>
      </section>

      {/* "vs. Earth Reference" Comparison Bars & "Why Interesting" Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: vs. Earth Reference Comparison Bars */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white">vs. Earth Reference</h3>
              <p className="text-xs text-slate-400">Direct parameter benchmarks relative to Earth standard (1.00x)</p>
            </div>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-5 text-xs font-mono-data">
            {/* Radius Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Planetary Radius</span>
                <span className="text-cyan-400 font-bold">
                  {radius ? `${radius.toFixed(2)}x Earth (${radius.toFixed(2)} R⊕)` : 'Undetermined'}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 relative">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (radiusRatio / 2.5) * 100)}%` }}
                />
                <div className="absolute top-0 bottom-0 left-[40%] w-0.5 bg-slate-400/60" title="Earth (1.0x)" />
              </div>
            </div>

            {/* Temperature Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Equilibrium Temperature</span>
                <span className="text-indigo-400 font-bold">
                  {temp ? `${(temp / 255).toFixed(2)}x Earth (${temp.toFixed(0)} K)` : 'Undetermined'}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 relative">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (tempRatio / 2.5) * 100)}%` }}
                />
                <div className="absolute top-0 bottom-0 left-[40%] w-0.5 bg-slate-400/60" title="Earth (1.0x)" />
              </div>
            </div>

            {/* Mass Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Planetary Mass</span>
                <span className="text-purple-400 font-bold">
                  {mass ? `${mass.toFixed(2)}x Earth (${mass.toFixed(2)} M⊕)` : 'Archive Estimated'}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 relative">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (massRatio / 5.0) * 100)}%` }}
                />
                <div className="absolute top-0 bottom-0 left-[20%] w-0.5 bg-slate-400/60" title="Earth (1.0x)" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: "Why is [Planet] interesting?" Narrative Panel & Data Source Attribution */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Why Interesting Narrative */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-3.5">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono-data">
              <Sparkles className="w-4 h-4" />
              <span>Scientific Significance</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Why is {name} interesting?
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              {planet.whyInteresting || `${name} offers a valuable perspective on planetary formation and evolution beyond our solar system, with an Earth Similarity Index of ${esi.toFixed(2)}.`}
            </p>
          </div>

          {/* Data Source Attribution Panel */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Data Source Attribution</span>
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed font-mono-data">
              NASA Exoplanet Archive (Composite Parameters Table, pscomppars). Transit ephemerides and physical radii calibrated against standard astrophysical benchmarks.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
