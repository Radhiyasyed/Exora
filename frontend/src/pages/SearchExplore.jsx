import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, LayoutGrid, Table as TableIcon, SlidersHorizontal, 
  RotateCcw, Sparkles, ChevronRight, Check, ArrowUpDown, Server,
  Atom, Thermometer, Ruler, Scale, CircleDot, Sun, Orbit, RefreshCw
} from 'lucide-react';
import { usePlanets } from '../context/PlanetContext';

/* Helper: classify star type from effective temp */
function classifyStarType(starTempK) {
  if (!starTempK) return { label: 'Unknown', color: 'text-slate-400' };
  if (starTempK >= 7500) return { label: 'A-type', color: 'text-blue-300' };
  if (starTempK >= 6000) return { label: 'F-type', color: 'text-sky-300' };
  if (starTempK >= 5200) return { label: 'G-type', color: 'text-amber-300' };
  if (starTempK >= 3700) return { label: 'K-type', color: 'text-orange-300' };
  return { label: 'M-type', color: 'text-red-400' };
}

/* Helper: format numbers with appropriate precision */
function fmt(val, decimals = 2) {
  if (val === null || val === undefined) return '—';
  return typeof val === 'number' ? val.toFixed(decimals) : String(val);
}

function getMetric(planet, camelKey, snakeKey, fallback = null) {
  if (planet == null) return fallback;
  return planet[camelKey] ?? planet[snakeKey] ?? fallback;
}

export default function SearchExplore() {
  const { planets, isLoading, isLiveBackend, forceRefresh, getExoplanetsOnly, isEarth } = usePlanets();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [expandedCard, setExpandedCard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;
  
  // Filter States
  const [radiusMax, setRadiusMax] = useState(20);
  const [tempMax, setTempMax] = useState(3000);
  const [minHabitability, setMinHabitability] = useState(0.0);
  const [minEsi, setMinEsi] = useState(0.0);
  const [minPhi, setMinPhi] = useState(0.0);
  const [selectedStarTypes, setSelectedStarTypes] = useState([]);
  const [hzOnly, setHzOnly] = useState(false);
  const [sortField, setSortField] = useState('habitabilityIndex');
  const [sortOrder, setSortOrder] = useState('desc');

  const starTypeOptions = ['G-type', 'M-type', 'K-type', 'F-type'];

  // Filter and sort planets from cached data (excluding Earth for exoplanet-only searches)
  const exoplanetsOnly = useMemo(() => getExoplanetsOnly(), [planets]);
  
  const filteredPlanets = useMemo(() => {
    let filtered = [...exoplanetsOnly];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.system?.toLowerCase().includes(searchLower) ||
        p.starName?.toLowerCase().includes(searchLower)
      );
    }

    // Radius filter
    if (radiusMax) {
      filtered = filtered.filter(p => 
        (p.radiusEarth ?? Infinity) <= radiusMax
      );
    }

    // Temperature filter
    if (tempMax) {
      filtered = filtered.filter(p => 
        (p.equilibriumTempK ?? Infinity) <= tempMax
      );
    }

    // Habitability filter
    if (minHabitability > 0) {
      filtered = filtered.filter(p => 
        (p.habitabilityIndex ?? 0) >= minHabitability
      );
    }

    // ESI / PHI filters
    if (minEsi > 0) {
      filtered = filtered.filter(p => 
        (getMetric(p, 'esiScore', 'esi_score', p.habitabilityIndex ?? 0) ?? 0) >= minEsi
      );
    }
    if (minPhi > 0) {
      filtered = filtered.filter(p => 
        (getMetric(p, 'phiScore', 'phi_score', 0) ?? 0) >= minPhi
      );
    }

    // Star type filter with prefix matching
    if (selectedStarTypes.length > 0) {
      filtered = filtered.filter(p => {
        const star = classifyStarType(p.starTempK || p.equilibriumTempK);
        return selectedStarTypes.some(st => star.label.startsWith(st) || star.label.includes(st));
      });
    }

    // Habitable zone filter
    if (hzOnly) {
      filtered = filtered.filter(p => {
        const esi = getMetric(p, 'esiScore', 'esi_score', p.habitabilityIndex ?? 0);
        const inHz = p.inHabitableZone ?? p.isInHabitableZone ?? p.is_in_habitable_zone ?? (esi >= 0.6);
        return inHz;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const getSortValue = (planet) => {
        if (sortField === 'esiScore') {
          return getMetric(planet, 'esiScore', 'esi_score', planet.habitabilityIndex ?? 0) ?? 0;
        }
        if (sortField === 'phiScore') {
          return getMetric(planet, 'phiScore', 'phi_score', 0) ?? 0;
        }
        return planet[sortField];
      };

      let aVal = getSortValue(a);
      let bVal = getSortValue(b);

      // Handle missing values
      if (aVal === undefined || aVal === null) aVal = sortOrder === 'asc' ? Infinity : -Infinity;
      if (bVal === undefined || bVal === null) bVal = sortOrder === 'asc' ? Infinity : -Infinity;

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [planets, searchTerm, radiusMax, tempMax, minHabitability, minEsi, minPhi, selectedStarTypes, hzOnly, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredPlanets.length / pageSize));
  const paginatedPlanets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlanets.slice(start, start + pageSize);
  }, [filteredPlanets, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, radiusMax, tempMax, minHabitability, minEsi, minPhi, selectedStarTypes, hzOnly, sortField, sortOrder]);

  const toggleStarType = (type) => {
    setSelectedStarTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRadiusMax(20);
    setTempMax(3000);
    setMinHabitability(0.0);
    setMinEsi(0.0);
    setMinPhi(0.0);
    setSelectedStarTypes([]);
    setHzOnly(false);
  };

  /* ──────────── Inline Detail Row for a planet ──────────── */
  const DetailRow = ({ icon: Icon, label, value, unit, color = 'text-cyan-400' }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-b-0">
      <div className="flex items-center space-x-2 text-slate-400 text-[12px] font-mono-data">
        <Icon className={`w-3 h-3 ${color}`} />
        <span>{label}</span>
      </div>
      <span className="text-slate-200 text-[12px] font-mono-data font-semibold">
        {value}{unit && <span className="text-slate-500 ml-0.5">{unit}</span>}
      </span>
    </div>
  );

  /* ──────────── Simplified minimal detail section ──────────── */
  const PlanetDetails = ({ planet }) => {
    const star = classifyStarType(planet.starTempK || planet.equilibriumTempK);
    const hi = planet.habitabilityIndex ?? 0;
    const esi = getMetric(planet, 'esiScore', 'esi_score', hi);
    const phi = getMetric(planet, 'phiScore', 'phi_score', 0);
    const inHZ = planet.inHabitableZone ?? planet.isInHabitableZone ?? planet.is_in_habitable_zone ?? (esi >= 0.6);

    return (
      <div className="mt-3 space-y-1 bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
        <DetailRow icon={Ruler}        label="Radius"           value={fmt(planet.radiusEarth)}           unit="R⊕"    color="text-cyan-400" />
        <DetailRow icon={Scale}        label="Mass"             value={fmt(planet.massEarth)}             unit="M⊕"    color="text-indigo-400" />
        <DetailRow icon={Atom}         label="Density"          value={fmt(planet.densityGCm3)}           unit="g/cm³" color="text-purple-400" />
        <DetailRow icon={Thermometer}  label="Eq. Temperature"  value={fmt(planet.eqTempK ?? planet.equilibriumTempK)} unit="K"     color="text-amber-400" />
        <DetailRow icon={Orbit}        label="Orbit Semi-Major" value={fmt(planet.orbitAU, 4)}            unit="AU"    color="text-emerald-400" />
        <DetailRow icon={Sun}          label="Host Star Temp"   value={fmt(planet.starTempK, 0)}          unit="K"     color="text-orange-400" />
        <DetailRow icon={CircleDot}    label="Star Type"        value={star.label}                        unit=""      color={star.color} />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono-data shadow-[0_0_10px_rgba(34,211,238,0.15)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Parametric Search & Exploration Engine</span>
            </div>
            <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[12px] font-mono-data border ${
              isLiveBackend
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              <Server className="w-3 h-3" />
              <span>{isLiveBackend ? 'Python Flask API Connected' : 'Embedded Data Cache'}</span>
              <button
                onClick={() => {
                  forceRefresh().catch(err => console.error('Refresh failed:', err));
                }}
                className="ml-2 p-1 rounded hover:bg-cyan-500/20 transition-colors"
                title="Force refresh data from backend"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Exoplanet Explorer</h1>
          <p className="text-slate-400 text-xs mt-1">
            Search, filter, and compare cataloged worlds powered by NASA Exoplanet Archive TAP queries.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 glass-panel p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              viewMode === 'card'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Card View</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Data Table</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ─── Filter Sidebar ─── */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Parametric Filters</span>
            </div>
            <button onClick={resetFilters} className="text-slate-400 hover:text-cyan-400 text-xs font-mono-data flex items-center space-x-1 transition-colors">
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Full-text Search */}
          <div className="space-y-2">
            <label className="text-xs font-mono-data text-slate-300">Full-Text Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search planet or star system..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          {/* HZ Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-200">Habitable Zone Only</span>
            <button
              onClick={() => setHzOnly(!hzOnly)}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                hzOnly ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${hzOnly ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Star Type Chips */}
          <div className="space-y-2">
            <label className="text-xs font-mono-data text-slate-300">Host Star Type</label>
            <div className="flex flex-wrap gap-2">
              {starTypeOptions.map((type) => {
                const selected = selectedStarTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleStarType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono-data flex items-center space-x-1 transition-all ${
                      selected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] font-semibold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 text-cyan-400" />}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Max Radius:</span>
              <span className="text-cyan-400 font-bold">{radiusMax} R⊕</span>
            </div>
            <input type="range" min="0.5" max="20" step="0.5" value={radiusMax}
              onChange={(e) => setRadiusMax(parseFloat(e.target.value))} className="w-full accent-cyan-400 cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Max Eq. Temperature:</span>
              <span className="text-indigo-400 font-bold">{tempMax} K</span>
            </div>
            <input type="range" min="100" max="3000" step="50" value={tempMax}
              onChange={(e) => setTempMax(parseInt(e.target.value, 10))} className="w-full accent-indigo-400 cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Min Habitability Score:</span>
              <span className="text-emerald-400 font-bold">{minHabitability.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.05" value={minHabitability}
              onChange={(e) => setMinHabitability(parseFloat(e.target.value))} className="w-full accent-emerald-400 cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Min ESI Score:</span>
              <span className="text-cyan-400 font-bold">{minEsi.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.05" value={minEsi}
              onChange={(e) => setMinEsi(parseFloat(e.target.value))} className="w-full accent-cyan-400 cursor-pointer" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Min PHI Score:</span>
              <span className="text-purple-400 font-bold">{minPhi.toFixed(2)}</span>
            </div>
            <input type="range" min="0.0" max="1.0" step="0.05" value={minPhi}
              onChange={(e) => setMinPhi(parseFloat(e.target.value))} className="w-full accent-purple-400 cursor-pointer" />
          </div>

          <div className="space-y-4">
            <div className="text-xs text-slate-400">
              Showing <strong className="text-cyan-400">{filteredPlanets.length}</strong> of <strong className="text-cyan-400">{planets.length}</strong> cataloged exoplanets
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Sort:</span>
              <select value={sortField} onChange={(e) => setSortField(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400">
                <option value="habitabilityIndex">Habitability Index</option>
                <option value="esiScore">ESI Score</option>
                <option value="phiScore">PHI Score</option>
                <option value="name">Name</option>
                <option value="radiusEarth">Radius</option>
                <option value="equilibriumTempK">Temperature</option>
                <option value="massEarth">Mass</option>
                <option value="densityGCm3">Density</option>
              </select>
              <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:border-cyan-500/40 transition-all">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Content Area (Cards / Table / Empty state) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {filteredPlanets.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
              <p className="text-slate-400 text-sm">No exoplanets match your current parametric filter thresholds.</p>
              <button onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-all">
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paginatedPlanets.map((planet) => {
                const pid = planet.id || planet.name;
                const isExpanded = expandedCard === pid;
                const star = classifyStarType(planet.starTempK);
                const hi = planet.habitabilityIndex ?? 0;
                const esi = getMetric(planet, 'esiScore', 'esi_score', hi);
                const phi = getMetric(planet, 'phiScore', 'phi_score', 0);
                const inHZ = planet.inHabitableZone ?? planet.isInHabitableZone ?? planet.is_in_habitable_zone ?? (esi >= 0.6);

                return (
                  <div
                    key={pid}
                    className="glass-panel glass-panel-hover rounded-2xl border border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] flex flex-col group transition-all"
                  >
                    {/* Card Header */}
                    <div className="p-5 pb-0">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <span className="text-[12px] font-mono-data text-slate-500 block">{planet.system || planet.name.split(' ')[0]}</span>
                          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {planet.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${inHZ ? 'bg-emerald-400' : 'bg-rose-400'}`} title={inHZ ? 'In Habitable Zone' : 'Outside Habitable Zone'} />
                        </div>
                      </div>

                      {/* Inline metrics */}
                      <div className="flex items-center space-x-3 mt-2 text-[12px] font-mono-data text-slate-400">
                        <span>ESI: <span className="text-cyan-300 font-semibold">{fmt(esi, 4)}</span></span>
                        <span className="text-slate-600">|</span>
                        <span>PHI: <span className="text-purple-300 font-semibold">{phi ? fmt(phi, 4) : '—'}</span></span>
                      </div>

                      {/* Star type pill */}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-[12px] font-mono-data px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/60 ${star.color}`}>
                          {star.label} Star
                        </span>
                        {planet.starTempK && (
                          <span className="text-[12px] font-mono-data text-slate-500">
                            {fmt(planet.starTempK, 0)} K
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── All JSON Details Rendered Cleanly ── */}
                    <div className="px-5 pt-3 pb-2">
                      <PlanetDetails planet={planet} />
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 pb-5 pt-2 mt-auto flex items-center justify-between">
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : pid)}
                        className="text-[12px] font-mono-data text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                        {isExpanded ? '− Collapse' : '+ Expand Raw'}
                      </button>
                      <Link
                        to={`/planet/${pid}`}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:text-white flex items-center space-x-1 transition-all"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Expanded raw JSON dump */}
                    {isExpanded && (
                      <div className="px-5 pb-5">
                        <pre className="text-[12px] font-mono-data text-slate-500 bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-x-auto max-h-48 overflow-y-auto">
                          {JSON.stringify(planet, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═════════ TABLE VIEW — all fields ═════════ */
            <div className="glass-panel rounded-2xl overflow-x-auto border border-slate-800">
              <table className="w-full text-left text-xs font-mono-data">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Planet Name</th>
                    <th className="p-3 whitespace-nowrap">Radius (R⊕)</th>
                    <th className="p-3 whitespace-nowrap">Mass (M⊕)</th>
                    <th className="p-3 whitespace-nowrap">Density (g/cm³)</th>
                    <th className="p-3 whitespace-nowrap">Eq Temp (K)</th>
                    <th className="p-3 whitespace-nowrap">Orbit (AU)</th>
                    <th className="p-3 whitespace-nowrap">Star Temp (K)</th>
                    <th className="p-3 whitespace-nowrap">Star Type</th>
                    <th className="p-3 whitespace-nowrap">ESI</th>
                    <th className="p-3 whitespace-nowrap">PHI</th>
                    <th className="p-3 whitespace-nowrap">HZ</th>
                    <th className="p-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedPlanets.map((planet) => {
                    const pid = planet.id || planet.name;
                    const hi = planet.habitabilityIndex ?? 0;
                    const esi = getMetric(planet, 'esiScore', 'esi_score', hi);
                    const phi = getMetric(planet, 'phiScore', 'phi_score', 0);
                    const star = classifyStarType(planet.starTempK || planet.equilibriumTempK);
                    const inHZ = planet.inHabitableZone ?? planet.isInHabitableZone ?? planet.is_in_habitable_zone ?? (esi >= 0.6);

                    return (
                      <tr key={pid} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 font-semibold text-slate-200">{planet.name}</td>
                        <td className="p-3 text-slate-300">{fmt(planet.radiusEarth)} R⊕</td>
                        <td className="p-3 text-slate-300">{fmt(planet.massEarth)} M⊕</td>
                        <td className="p-3 text-slate-300">{fmt(planet.densityGCm3)} g/cm³</td>
                        <td className="p-3 text-slate-300">{fmt(planet.eqTempK ?? planet.equilibriumTempK)} K</td>
                        <td className="p-3 text-slate-300">{fmt(planet.orbitAU, 4)} AU</td>
                        <td className="p-3 text-slate-300">{fmt(planet.starTempK, 0)} K</td>
                        <td className={`p-3 font-medium ${star.color}`}>{star.label}</td>
                        <td className="p-3 text-cyan-400 font-mono-data">{fmt(esi, 4)}</td>
                        <td className="p-3 text-purple-400 font-mono-data">{phi ? fmt(phi, 4) : '—'}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${
                            inHZ 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : 'text-slate-400 bg-slate-500/5 border-slate-500/10'
                          }`}>
                            {inHZ ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Link to={`/planet/${pid}`} className="text-cyan-400 hover:text-cyan-300 font-medium text-xs">
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Section */}
          {filteredPlanets.length > pageSize && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-4">
              <div className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-200">{paginatedPlanets.length}</span> of <span className="font-semibold text-slate-200">{filteredPlanets.length}</span> planets
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
                >
                  Prev
                </button>
                <div className="flex items-center px-3 text-xs font-mono text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}