import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Scale, Trash2, Sparkles, AlertTriangle, Bookmark, X, Search, Check, Plus, Globe
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, Cell, LabelList } from 'recharts';
import { usePlanets } from '../context/PlanetContext';

// Static Earth Reference Object (not counted against 4-planet selection limit)
const EARTH_REFERENCE = {
  id: 'earth-reference-standard',
  name: 'Earth (Reference Standard)',
  system: 'Solar System',
  starName: 'Sun',
  starType: 'G-type (G2V)',
  radiusEarth: 1.0,
  massEarth: 1.0,
  equilibriumTempK: 255,
  orbitalPeriodDays: 365.25,
  orbitalDistanceAu: 1.0,
  orbitAU: 1.0,
  distanceLy: 0,
  esiScore: 1.0,
  esi: 1.0,
  hzd: 0.0,
  zoneStatus: 'Habitable Zone',
  inHabitableZone: true,
  discoveryMethod: 'Direct Observation',
  discoveryYear: 0,
  description: 'Our home planetary baseline and calibrating reference standard for habitability indices (ESI = 1.00, HZD = 0.00).',
  isEarthReference: true,
};

function getMetric(planet, camelKey, snakeKey, fallback = null) {
  return planet?.[camelKey] ?? planet?.[snakeKey] ?? fallback;
}

export default function CompareWorlds() {
  const { planets } = usePlanets();
  
  // Default selected exoplanet IDs (max 4)
  const [selectedIds, setSelectedIds] = useState(['kepler-452b', 'trappist-1e', 'proxima-cen-b']);
  const [includeEarth, setIncludeEarth] = useState(false);
  const [activePlanet, setActivePlanet] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  
  // Search state for browsing & adding planets
  const [planetSearch, setPlanetSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleBookmark = (planetId) => {
    setBookmarkedIds((prev) =>
      prev.includes(planetId) ? prev.filter((id) => id !== planetId) : [...prev, planetId]
    );
  };

  const openPlanetModal = (planet) => setActivePlanet(planet);
  const closePlanetModal = () => setActivePlanet(null);

  // Available exoplanets from catalog
  const availablePlanets = useMemo(() => {
    return (planets || []).filter(p => p.id !== 'earth' && p.name !== 'Earth');
  }, [planets]);

  // Filtered search list for the selection UI
  const filteredSearchList = useMemo(() => {
    if (!planetSearch.trim()) return availablePlanets.slice(0, 20);
    const q = planetSearch.toLowerCase().trim();
    return availablePlanets.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.system?.toLowerCase().includes(q) ||
      p.starType?.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [availablePlanets, planetSearch]);

  // Selected planets array (up to 4)
  const selectedExoplanets = useMemo(() => {
    return selectedIds
      .map(id => availablePlanets.find(p => p.id === id || p.id?.replace(/-/g, '') === id.replace(/-/g, '')))
      .filter(Boolean);
  }, [selectedIds, availablePlanets]);

  // Displayed worlds: include Earth as reference when enabled
  const displayedPlanets = useMemo(() => {
    return includeEarth ? [EARTH_REFERENCE, ...selectedExoplanets] : selectedExoplanets;
  }, [includeEarth, selectedExoplanets]);

  const addPlanet = (id) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removePlanet = (id) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    }
  };

  const bookmarkedPlanets = displayedPlanets.filter((planet) => bookmarkedIds.includes(planet.id));

  // Chart datasets
  const radiusChartData = displayedPlanets.map((p) => ({
    name: p.name,
    "Radius (R⊕)": p.radiusEarth ? Number(p.radiusEarth) : 0,
  }));

  const tempChartData = displayedPlanets.map((p) => ({
    name: p.name,
    "Eq Temp (K)": (p.equilibriumTempK ?? p.eqTempK) ? Number(p.equilibriumTempK ?? p.eqTempK) : 0,
  }));

  const periodChartData = displayedPlanets.map((p) => ({
    name: p.name,
    "Orbital Period (Days)": p.orbitalPeriodDays ? Number(p.orbitalPeriodDays) : 0,
  }));

  // Scatter plot data for ESI vs Radius
  const scatterPlotData = displayedPlanets.map((p) => {
    const esi = Number(getMetric(p, 'esi', 'esiScore', p.habitabilityIndex ?? 0));
    const radius = Number(p.radiusEarth || 1.0);
    return {
      id: p.id,
      name: p.name,
      radiusEarth: radius,
      esi: esi,
      isEarth: Boolean(p.isEarthReference),
    };
  });

  // Highest similarity planet among non-Earth worlds
  const nonEarthPlanets = displayedPlanets.filter(p => !p.isEarthReference);
  const highestSimilarityPlanet = nonEarthPlanets.length
    ? nonEarthPlanets.reduce((max, p) => {
        const pScore = Number(getMetric(p, 'esi', 'esiScore', p.habitabilityIndex ?? 0));
        const maxScore = Number(getMetric(max, 'esi', 'esiScore', max.habitabilityIndex ?? 0));
        return pScore > maxScore ? p : max;
      }, nonEarthPlanets[0])
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header & Controls Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Scale className="w-7 h-7 text-cyan-400" />
            <span>Exoplanetary Comparison Grid</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Compare up to 4 exoplanets side by side with optional Earth baseline across radius, temperature, and habitability metrics.
          </p>
        </div>

        {/* Action Controls: Earth Reference Toggle + Add World Modal / Search Trigger */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Include Earth as Reference Toggle */}
          <div className="flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono-data text-slate-300">Include Earth as reference</span>
            <button
              type="button"
              onClick={() => setIncludeEarth(!includeEarth)}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ml-1 ${
                includeEarth ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-slate-800'
              }`}
              aria-label="Toggle Earth reference standard"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeEarth ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Add Exoplanet Button / Trigger */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            disabled={selectedIds.length >= 4}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              selectedIds.length >= 4
                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300 hover:brightness-125 shadow-sm'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add World ({selectedIds.length}/4)</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          1. SEARCH & BROWSABLE LIST / GRID SELECTION UI
          ═══════════════════════════════════════════════════ */}
      {isSearchOpen && (
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Select Exoplanet to Compare (Max 4)</span>
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={planetSearch}
              onChange={(e) => setPlanetSearch(e.target.value)}
              placeholder="Search planet name, star system, or type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner font-mono-data"
              autoFocus
            />
          </div>

          {/* Browsable Planet Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredSearchList.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const esi = Number(getMetric(p, 'esi', 'esiScore', 0));
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (isSelected) {
                      removePlanet(p.id);
                    } else {
                      addPlanet(p.id);
                    }
                  }}
                  disabled={!isSelected && selectedIds.length >= 4}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs truncate text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono-data">
                      ESI {esi.toFixed(2)} • {p.radiusEarth ? `${Number(p.radiusEarth).toFixed(1)} R⊕` : 'N/A'}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-700 text-slate-500'
                  }`}>
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : '+'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Travel Dossier */}
      {bookmarkedPlanets.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-3 text-xs font-mono-data">
          <span className="text-cyan-400 uppercase tracking-widest font-semibold flex items-center space-x-1.5">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Travel Dossier</span>
          </span>
          {bookmarkedPlanets.map((planet) => (
            <button
              key={planet.id}
              type="button"
              onClick={() => openPlanetModal(planet)}
              className="rounded-full border border-cyan-500/30 bg-slate-900/90 px-3 py-1 text-cyan-300 text-[11px] transition hover:bg-cyan-500/10"
            >
              {planet.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setBookmarkedIds([])}
            className="ml-auto text-slate-400 hover:text-cyan-300 text-[11px]"
          >
            Clear Dossier
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          COMPARISON CARDS GRID (No PHI, replaced with HZD)
          ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {displayedPlanets.map((planet) => {
          const esi = Number(getMetric(planet, 'esi', 'esiScore', 0));
          const hzd = planet.hzd != null ? Number(planet.hzd) : (planet.zoneStatus === 'Habitable Zone' ? 0.2 : (planet.equilibriumTempK > 350 ? -1.5 : 2.5));
          const isEarth = Boolean(planet.isEarthReference);

          return (
            <div
              key={planet.id}
              onClick={() => openPlanetModal(planet)}
              className={`glass-panel p-5 rounded-2xl border relative space-y-3 group cursor-pointer transition-all ${
                isEarth
                  ? 'border-emerald-500/40 bg-emerald-950/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]'
              }`}
            >
              {/* Bookmark Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(planet.id);
                }}
                className={`absolute right-4 top-4 rounded-full p-2 transition ${
                  bookmarkedIds.includes(planet.id) 
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' 
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30'
                }`}
                title="Add to Travel Dossier"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>

              {/* Title & System */}
              <div className="space-y-1 pr-8">
                <span className="text-[11px] font-mono-data text-cyan-400 block truncate">
                  {planet.system}
                </span>
                <h3 className="font-bold text-white text-base truncate">
                  {planet.name}
                </h3>
              </div>

              {/* Reference Badge or Remove Action */}
              <div className="flex items-center justify-between pt-1">
                {isEarth ? (
                  <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-semibold">
                    Reference Standard
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-data text-slate-400">
                    {planet.starType || 'Host Star'}
                  </span>
                )}

                {!isEarth && selectedIds.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlanet(planet.id);
                    }}
                    className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Remove from comparison"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Metrics Readout: ESI Score, HZD Value, Radius, Eq Temp */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono-data text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">ESI Score:</span>
                  <span className="text-cyan-400 font-bold">{esi.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HZD Value:</span>
                  <span className={`font-bold ${hzd >= -1.0 && hzd <= 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hzd >= 0 ? `+${hzd.toFixed(2)}` : hzd.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Radius:</span>
                  <span className="text-slate-200">{planet.radiusEarth ? `${Number(planet.radiusEarth).toFixed(2)} R⊕` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Eq. Temp:</span>
                  <span className="text-slate-200">
                    {(planet.equilibriumTempK ?? planet.eqTempK) ? `${Number(planet.equilibriumTempK ?? planet.eqTempK).toFixed(0)} K` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════
          2. SCATTER PLOT: ESI VS. RADIUS (Fixed Bubble Size)
          ═══════════════════════════════════════════════════ */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="text-xs font-mono-data text-cyan-400 uppercase tracking-widest font-bold">
              ESI vs. Radius
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scatter distribution of Earth Similarity Index relative to planetary physical radius (all markers fixed size).
            </p>
          </div>
        </div>

        {/* Planet Selection Chips */}
        <div className="flex flex-wrap gap-2 py-1">
          {displayedPlanets.map((planet) => (
            <div 
              key={planet.id} 
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-mono-data text-slate-300"
            >
              <span className="font-semibold">{planet.name}</span>
              {!planet.isEarthReference && selectedIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlanet(planet.id)}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                  title={`Remove ${planet.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Clean Scatter Chart */}
        <div className="w-full h-80 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey="radiusEarth" 
                name="Radius" 
                unit=" R⊕" 
                stroke="#94a3b8"
                domain={[0, (dataMax) => Math.max(2.5, Math.ceil(dataMax * 1.15))]}
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
              />
              <YAxis 
                type="number" 
                dataKey="esi" 
                name="ESI Score" 
                stroke="#94a3b8" 
                domain={[0, 1.05]}
                ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#38bdf8', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 border border-cyan-500/40 p-3 rounded-xl shadow-2xl text-xs font-mono-data space-y-1">
                        <div className="font-bold text-white text-sm pb-1 border-b border-slate-800 flex items-center justify-between gap-3">
                          <span>{data.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${data.isEarth ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                            {data.isEarth ? 'Reference Baseline' : 'Exoplanet'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 pt-1">
                          <span className="text-slate-400">Radius (R⊕):</span>
                          <span className="text-cyan-400 font-bold">{Number(data.radiusEarth).toFixed(2)} R⊕</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">ESI Score:</span>
                          <span className="text-emerald-400 font-bold">{Number(data.esi).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Planets" 
                data={scatterPlotData}
              >
                {scatterPlotData.map((p, index) => {
                  const color = p.isEarth ? '#10b981' : (p.esi >= 0.8 ? '#22d3ee' : p.esi >= 0.5 ? '#818cf8' : '#c084fc');
                  return (
                    <Cell 
                      key={`scatter-cell-${index}`} 
                      fill={color} 
                      stroke="#ffffff" 
                      strokeWidth={1.5}
                      className="cursor-pointer transition-transform hover:scale-125"
                    />
                  );
                })}
                <LabelList 
                  dataKey="name" 
                  content={({ x, y, value, index }) => {
                    if (x == null || y == null) return null;
                    const posOffsets = [
                      { dx: 10, dy: -10, anchor: 'start' },
                      { dx: -10, dy: 16, anchor: 'end' },
                      { dx: 10, dy: 16, anchor: 'start' },
                      { dx: -10, dy: -10, anchor: 'end' },
                    ];
                    const offset = posOffsets[index % posOffsets.length];
                    return (
                      <text
                        x={x + offset.dx}
                        y={y + offset.dy}
                        fill="#f1f5f9"
                        fontSize={10}
                        fontFamily="JetBrains Mono"
                        fontWeight="600"
                        textAnchor={offset.anchor}
                        className="pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                      >
                        {value}
                      </text>
                    );
                  }}
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side-by-side Recharts Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Chart 1: Radius Comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-mono-data text-cyan-400 font-bold">Radius Comparison (R⊕)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radiusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="Radius (R⊕)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Equilibrium Temp */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-mono-data text-indigo-400 font-bold">Equilibrium Temp (K)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="Eq Temp (K)" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Orbital Period */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-mono-data text-purple-400 font-bold">Orbital Period (Days)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="Orbital Period (Days)" fill="#c084fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Comprehensive Data Comparison Table (with HZD) */}
      <div className="glass-panel rounded-2xl overflow-x-auto border border-slate-800">
        <table className="w-full text-left text-xs font-mono-data">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">Parameter</th>
              {displayedPlanets.map((p) => (
                <th key={p.id} className="p-3.5 text-cyan-300 font-bold whitespace-nowrap">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Earth Similarity Index (ESI)</td>
              {displayedPlanets.map((p) => {
                const esi = Number(getMetric(p, 'esi', 'esiScore', 0));
                return (
                  <td key={p.id} className="p-3 font-bold text-cyan-400">{esi.toFixed(2)}</td>
                );
              })}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Habitable Zone Distance (HZD)</td>
              {displayedPlanets.map((p) => {
                const hzd = p.hzd != null ? Number(p.hzd) : (p.zoneStatus === 'Habitable Zone' ? 0.2 : (p.equilibriumTempK > 350 ? -1.5 : 2.5));
                return (
                  <td key={p.id} className="p-3 font-bold text-emerald-400">{hzd >= 0 ? `+${hzd.toFixed(2)}` : hzd.toFixed(2)}</td>
                );
              })}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Radius (Earth Radii)</td>
              {displayedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.radiusEarth ? `${Number(p.radiusEarth).toFixed(2)} R⊕` : 'N/A'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Mass (Earth Masses)</td>
              {displayedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.massEarth ? `${Number(p.massEarth).toFixed(2)} M⊕` : 'N/A'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Equilibrium Temperature</td>
              {displayedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">
                  {(p.equilibriumTempK ?? p.eqTempK) ? `${Number(p.equilibriumTempK ?? p.eqTempK).toFixed(0)} K` : 'N/A'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Orbital Period</td>
              {displayedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.orbitalPeriodDays ? `${Number(p.orbitalPeriodDays).toFixed(1)} Days` : 'N/A'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Host Star Type</td>
              {displayedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.starType || p.starSpectralType || 'N/A'}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Habitable Zone Status</td>
              {displayedPlanets.map((p) => {
                const inHZ = p.zoneStatus === 'Habitable Zone' || p.inHabitableZone || (p.hzd != null && p.hzd >= -1.0 && p.hzd <= 1.0);
                return (
                  <td key={p.id} className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      inHZ ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                    }`}>
                      {inHZ ? 'Inside HZ' : 'Outside HZ'}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detail Modal Rendered via React Portal */}
      {activePlanet && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto"
          onClick={closePlanetModal}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[88vh] my-auto overflow-y-auto rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-[0_0_60px_rgba(8,15,38,0.65)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePlanetModal}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:bg-cyan-500/20 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-mono-data">
                    Focused Comparison Details
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-mono-data">{activePlanet.system}</p>
                    <h2 className="text-3xl font-extrabold text-white">{activePlanet.name}</h2>
                    <p className="text-slate-400 text-xs">{activePlanet.starType || activePlanet.starSpectralType || 'Host star'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Distance from Earth', value: (activePlanet.distanceLy != null && !isNaN(Number(activePlanet.distanceLy))) ? `${Number(activePlanet.distanceLy).toFixed(1)} LY` : 'Distance data not yet available' },
                    { label: 'Orbital Period', value: activePlanet.orbitalPeriodDays ? `${Number(activePlanet.orbitalPeriodDays).toFixed(1)} days` : 'N/A' },
                    { label: 'Orbital Distance', value: activePlanet.orbitAU || activePlanet.orbitalSemiMajorAxisAU ? `${Number(activePlanet.orbitAU || activePlanet.orbitalSemiMajorAxisAU).toFixed(2)} AU` : 'N/A' },
                    { label: 'Radius', value: activePlanet.radiusEarth ? `${Number(activePlanet.radiusEarth).toFixed(2)} R⊕` : 'N/A' },
                    { label: 'Mass', value: activePlanet.massEarth ? `${Number(activePlanet.massEarth).toFixed(2)} M⊕` : 'N/A' },
                  ].map((param) => (
                    <div key={param.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono-data">
                        {param.label}
                      </p>
                      <p className="mt-1 text-base font-semibold text-white font-mono-data">
                        {param.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <p className="text-slate-300 text-xs leading-relaxed">{activePlanet.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-widest text-cyan-300 font-semibold font-mono-data">Telemetry</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(activePlanet.id);
                      }}
                      className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-mono-data transition ${
                        bookmarkedIds.includes(activePlanet.id) 
                          ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200' 
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-200'
                      }`}
                    >
                      {bookmarkedIds.includes(activePlanet.id) ? 'Saved' : '+ Save'}
                    </button>
                  </div>
                  <div className="mt-4 space-y-2.5 font-mono-data">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>ESI Score</span>
                      <span className="text-cyan-300 font-bold">{Number(getMetric(activePlanet, 'esi', 'esiScore', 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>HZD Value</span>
                      <span className="text-emerald-300 font-bold">{Number(activePlanet.hzd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Temperature</span>
                      <span className="text-indigo-300 font-bold">{(activePlanet.equilibriumTempK ?? activePlanet.eqTempK) ? `${Number(activePlanet.equilibriumTempK ?? activePlanet.eqTempK).toFixed(0)} K` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs leading-relaxed text-slate-400 font-mono-data">
                  Discovery: <span className="text-cyan-300 font-semibold">{activePlanet.discoveryMethod || 'Transit'}</span> ({activePlanet.discoveryYear || 'Cataloged'}).
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Summary Highlight & Scientific Caveat Panel */}
      {highestSimilarityPlanet && (
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono-data font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Highest Earth-Similarity Candidate</span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">
              {highestSimilarityPlanet.name} (ESI Score: {Number(getMetric(highestSimilarityPlanet, 'esi', 'esiScore', 0)).toFixed(2)})
            </h3>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
              Among selected worlds, <strong>{highestSimilarityPlanet.name}</strong> exhibits the closest physical parity to Earth, with a radius of {Number(highestSimilarityPlanet.radiusEarth).toFixed(2)} R⊕ and an equilibrium temperature near {Number(highestSimilarityPlanet.equilibriumTempK ?? highestSimilarityPlanet.eqTempK).toFixed(0)} K.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-300 mb-0.5">Scientific Caveat:</strong>
              High Earth Similarity Index (ESI) scores measure physical size, mass, and stellar flux parity, but do not guarantee liquid surface water, protective magnetospheres, or breathable atmospheric pressure without direct spectroscopic confirmation.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
