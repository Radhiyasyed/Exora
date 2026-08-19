import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, LayoutGrid, Table as TableIcon, SlidersHorizontal, 
  RotateCcw, Sparkles, ChevronRight, Check, ArrowUpDown, Server,
  RefreshCw, Ruler, Thermometer
} from 'lucide-react';
import { usePlanets } from '../context/PlanetContext';
import { slugify } from '../api/exoplanetsApi';

/* Helper: classify star type from effective temp or spectral string */
function classifyStarType(starSpectralType, starTempK) {
  if (starSpectralType) {
    const s = String(starSpectralType).trim();
    if (s.startsWith('G')) return { label: s.includes('type') ? s : `${s.split(' ')[0]} Star`, color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30' };
    if (s.startsWith('M')) return { label: s.includes('type') ? s : `${s.split(' ')[0]} Star`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    if (s.startsWith('K')) return { label: s.includes('type') ? s : `${s.split(' ')[0]} Star`, color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/30' };
    if (s.startsWith('F')) return { label: s.includes('type') ? s : `${s.split(' ')[0]} Star`, color: 'text-sky-300', bg: 'bg-sky-500/10 border-sky-500/30' };
    if (s.startsWith('A')) return { label: s.includes('type') ? s : `${s.split(' ')[0]} Star`, color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/30' };
    return { label: s, color: 'text-slate-300', bg: 'bg-slate-800/80 border-slate-700' };
  }
  if (!starTempK) return { label: 'Unknown Star', color: 'text-slate-400', bg: 'bg-slate-800/80 border-slate-700' };
  if (starTempK >= 7500) return { label: 'A-type Star', color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/30' };
  if (starTempK >= 6000) return { label: 'F-type Star', color: 'text-sky-300', bg: 'bg-sky-500/10 border-sky-500/30' };
  if (starTempK >= 5200) return { label: 'G-type Star', color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30' };
  if (starTempK >= 3700) return { label: 'K-type Star', color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/30' };
  return { label: 'M-type Star', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
}

function getMetric(planet, camelKey, snakeKey, fallback = null) {
  if (planet == null) return fallback;
  return planet[camelKey] ?? planet[snakeKey] ?? fallback;
}

export default function SearchExplore() {
  const { planets, isLoading, isLiveBackend, forceRefresh, getExoplanetsOnly } = usePlanets();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;
  
  // Section 5 Filter States
  const [radiusMax, setRadiusMax] = useState(20);
  const [tempMax, setTempMax] = useState(3000);
  const [minEsi, setMinEsi] = useState(0.0);
  const [hzOnly, setHzOnly] = useState(false);
  const [habitabilityStatus, setHabitabilityStatus] = useState('all'); // 'all', 'hz_candidate', 'not_habitable', 'unknown'
  const [selectedStarTypes, setSelectedStarTypes] = useState([]);
  const [sortField, setSortField] = useState('esi');
  const [sortOrder, setSortOrder] = useState('desc');

  const starTypeOptions = ['G-type', 'M-type', 'K-type', 'F-type', 'A-type'];

  // Filter exoplanets (excluding Earth baseline)
  const exoplanetsOnly = useMemo(() => getExoplanetsOnly(), [planets]);
  
  const filteredPlanets = useMemo(() => {
    let filtered = [...exoplanetsOnly];

    // Full-text Search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.system?.toLowerCase().includes(searchLower) ||
        p.starName?.toLowerCase().includes(searchLower) ||
        p.starSpectralType?.toLowerCase().includes(searchLower) ||
        p.starType?.toLowerCase().includes(searchLower)
      );
    }

    // Max Radius filter
    if (radiusMax < 20) {
      filtered = filtered.filter(p => 
        p.radiusEarth == null || p.radiusEarth <= radiusMax
      );
    }

    // Max Temperature filter
    if (tempMax < 3000) {
      filtered = filtered.filter(p => 
        (p.equilibriumTempK ?? p.eqTempK) == null || (p.equilibriumTempK ?? p.eqTempK) <= tempMax
      );
    }

    // Min ESI Score filter (0.00 - 1.00)
    if (minEsi > 0) {
      filtered = filtered.filter(p => {
        const esi = Number(getMetric(p, 'esi', 'esiScore', p.esi_score ?? 0));
        return esi >= minEsi;
      });
    }

    // HZD / Habitable Zone Only Toggle
    if (hzOnly) {
      filtered = filtered.filter(p => {
        const isHz = p.zoneStatus === 'Habitable Zone' || 
          p.inHabitableZone || 
          (p.hzd != null && p.hzd >= -1.0 && p.hzd <= 1.0) ||
          Number(getMetric(p, 'esi', 'esiScore', 0)) >= 0.7;
        return isHz;
      });
    }

    // Habitability Status Filter
    if (habitabilityStatus !== 'all') {
      filtered = filtered.filter(p => {
        const isHz = p.zoneStatus === 'Habitable Zone' || 
          p.inHabitableZone || 
          (p.hzd != null && p.hzd >= -1.0 && p.hzd <= 1.0);
        
        if (habitabilityStatus === 'hz_candidate') {
          return isHz;
        } else if (habitabilityStatus === 'not_habitable') {
          return (p.zoneStatus === 'Too Hot' || p.zoneStatus === 'Too Cold') || (!isHz && p.zoneStatus);
        } else if (habitabilityStatus === 'unknown') {
          return p.zoneStatus == null && !p.inHabitableZone && p.hzd == null;
        }
        return true;
      });
    }

    // Star Type Chips Filter
    if (selectedStarTypes.length > 0) {
      filtered = filtered.filter(p => {
        const typeStr = (p.starType || p.starSpectralType || '').toUpperCase();
        return selectedStarTypes.some(st => typeStr.startsWith(st.charAt(0).toUpperCase()));
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const getSortValue = (planet) => {
        if (sortField === 'esi') {
          return Number(getMetric(planet, 'esi', 'esiScore', 0));
        }
        if (sortField === 'radiusEarth') {
          return planet.radiusEarth ?? (sortOrder === 'asc' ? Infinity : -Infinity);
        }
        if (sortField === 'equilibriumTempK') {
          return (planet.equilibriumTempK ?? planet.eqTempK) ?? (sortOrder === 'asc' ? Infinity : -Infinity);
        }
        if (sortField === 'name') {
          return planet.name || '';
        }
        return planet[sortField] ?? 0;
      };

      const aVal = getSortValue(a);
      const bVal = getSortValue(b);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [exoplanetsOnly, searchTerm, radiusMax, tempMax, minEsi, hzOnly, habitabilityStatus, selectedStarTypes, sortField, sortOrder]);

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
  }, [searchTerm, radiusMax, tempMax, minEsi, hzOnly, habitabilityStatus, selectedStarTypes, sortField, sortOrder]);

  const toggleStarType = (type) => {
    setSelectedStarTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setRadiusMax(20);
    setTempMax(3000);
    setMinEsi(0.0);
    setHzOnly(false);
    setHabitabilityStatus('all');
    setSelectedStarTypes([]);
    setSortField('esi');
    setSortOrder('desc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Section */}
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
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            }`}>
              <Server className="w-3 h-3" />
              <span>{isLiveBackend ? 'Python Flask API Connected' : '100+ Synced Catalog Cache'}</span>
              <button
                onClick={() => {
                  forceRefresh().catch(err => console.error('Refresh failed:', err));
                }}
                className="ml-1.5 p-1 rounded hover:bg-cyan-500/20 transition-colors"
                title="Refresh catalog data"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Exoplanet Explorer</h1>
          <p className="text-slate-400 text-xs mt-1">
            Search, filter, and compare cataloged worlds powered by NASA Exoplanet Archive parameters.
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

      {/* Main Grid: Sidebar Filters + Planet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ─── Filter Sidebar (Section 5) ─── */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Parametric Filters</span>
            </div>
            <button 
              onClick={resetFilters} 
              className="text-slate-400 hover:text-cyan-400 text-xs font-mono-data flex items-center space-x-1 transition-colors"
            >
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

          {/* Habitable Zone Only Toggle (HZD-based) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-200">Habitable Zone Only</span>
            <button
              onClick={() => setHzOnly(!hzOnly)}
              className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                hzOnly ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-800'
              }`}
              aria-label="Toggle Habitable Zone Only"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${hzOnly ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Habitability Status Filter Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-mono-data text-slate-300">Habitability Status</label>
            <select
              value={habitabilityStatus}
              onChange={(e) => setHabitabilityStatus(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Statuses</option>
              <option value="hz_candidate">HZ Candidate (Circumstellar Habitable)</option>
              <option value="not_habitable">Non-Habitable (Too Hot / Too Cold)</option>
              <option value="unknown">Unspecified / Unknown</option>
            </select>
          </div>

          {/* Host Star Type Chips */}
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

          {/* Min ESI Score Slider (0.00 to 1.00) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Min ESI Score:</span>
              <span className="text-cyan-400 font-bold">{minEsi.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.05" 
              value={minEsi}
              onChange={(e) => setMinEsi(parseFloat(e.target.value))} 
              className="w-full accent-cyan-400 cursor-pointer" 
            />
          </div>

          {/* Max Radius Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Max Radius:</span>
              <span className="text-cyan-400 font-bold">{radiusMax >= 20 ? 'All' : `${radiusMax} R⊕`}</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="20" 
              step="0.5" 
              value={radiusMax}
              onChange={(e) => setRadiusMax(parseFloat(e.target.value))} 
              className="w-full accent-cyan-400 cursor-pointer" 
            />
          </div>

          {/* Max Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-data">
              <span className="text-slate-400">Max Eq. Temperature:</span>
              <span className="text-indigo-400 font-bold">{tempMax >= 3000 ? 'All' : `${tempMax} K`}</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="3000" 
              step="50" 
              value={tempMax}
              onChange={(e) => setTempMax(parseInt(e.target.value, 10))} 
              className="w-full accent-indigo-400 cursor-pointer" 
            />
          </div>

          {/* Live Count & Sort Controls */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              Showing <strong className="text-cyan-400">{filteredPlanets.length}</strong> matching exoplanets of <strong className="text-slate-300">{exoplanetsOnly.length}</strong> total
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono-data">Sort:</span>
              <select 
                value={sortField} 
                onChange={(e) => setSortField(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 flex-1"
              >
                <option value="esi">ESI Score</option>
                <option value="name">Planet Name</option>
                <option value="radiusEarth">Radius</option>
                <option value="equilibriumTempK">Temperature</option>
              </select>
              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:border-cyan-500/40 transition-all"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Content Area: Simplified Cards / Table (Section 6) ─── */}
        <div className="lg:col-span-8 space-y-6">
          {filteredPlanets.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
              <p className="text-slate-400 text-sm">No exoplanets match your current parametric filter thresholds.</p>
              <button 
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'card' ? (
            /* ═══════════════════════════════════════════════════
               SIMPLIFIED PLANET CARDS (Section 6)
               Each card reduced to:
               - Planet name
               - Host star type badge
               - HZ Candidate tag (if applicable)
               - 2 key stats max (Radius, Temperature)
               - ESI score
               - "View Details" button
               ═══════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paginatedPlanets.map((planet) => {
                const pid = planet.id || slugify(planet.name);
                const star = classifyStarType(planet.starSpectralType || planet.starType, planet.starTempK || planet.equilibriumTempK);
                const esi = Number(getMetric(planet, 'esi', 'esiScore', planet.habitabilityIndex ?? 0));
                const inHZ = planet.zoneStatus === 'Habitable Zone' || 
                  planet.inHabitableZone || 
                  (planet.hzd != null && planet.hzd >= -1.0 && planet.hzd <= 1.0) ||
                  esi >= 0.75;

                const hasRadius = planet.radiusEarth != null && !isNaN(planet.radiusEarth);
                const hasTemp = (planet.equilibriumTempK ?? planet.eqTempK) != null && !isNaN(planet.equilibriumTempK ?? planet.eqTempK);

                return (
                  <div
                    key={pid}
                    className="glass-panel glass-panel-hover rounded-2xl border border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] flex flex-col justify-between p-5 space-y-4 group transition-all"
                  >
                    {/* Top Row: Name and HZ Candidate Tag */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {planet.name}
                        </h3>
                        {inHZ && (
                          <span className="shrink-0 text-[10px] font-mono-data px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-semibold flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>HZ Candidate</span>
                          </span>
                        )}
                      </div>

                      {/* Host Star Type Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono-data px-2.5 py-0.5 rounded-full border ${star.bg} ${star.color} font-medium`}>
                          {star.label}
                        </span>
                      </div>
                    </div>

                    {/* 2 Key Stats Max: Radius & Temperature (Omit if unavailable, no placeholder dashes) */}
                    {(hasRadius || hasTemp) && (
                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/60 bg-slate-950/40 rounded-xl px-3 text-xs font-mono-data">
                        {hasRadius && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase block">Radius</span>
                            <div className="flex items-center space-x-1 text-slate-200 font-semibold">
                              <Ruler className="w-3 h-3 text-cyan-400" />
                              <span>{Number(planet.radiusEarth).toFixed(2)} R⊕</span>
                            </div>
                          </div>
                        )}
                        {hasTemp && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 uppercase block">Eq. Temp</span>
                            <div className="flex items-center space-x-1 text-slate-200 font-semibold">
                              <Thermometer className="w-3 h-3 text-indigo-400" />
                              <span>{Number(planet.equilibriumTempK ?? planet.eqTempK).toFixed(0)} K</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: ESI Score + View Details Button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs font-mono-data">
                        <span className="text-slate-400">ESI: </span>
                        <span className="text-cyan-300 font-bold text-sm">{esi.toFixed(2)}</span>
                      </div>

                      <Link
                        to={`/planet/${pid}`}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:text-white flex items-center space-x-1.5 transition-all shadow-sm"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═════════ DATA TABLE VIEW ═════════ */
            <div className="glass-panel rounded-2xl overflow-x-auto border border-slate-800">
              <table className="w-full text-left text-xs font-mono-data">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">Planet Name</th>
                    <th className="p-3.5 whitespace-nowrap">Star Type</th>
                    <th className="p-3.5 whitespace-nowrap">Radius (R⊕)</th>
                    <th className="p-3.5 whitespace-nowrap">Eq Temp (K)</th>
                    <th className="p-3.5 whitespace-nowrap">ESI</th>
                    <th className="p-3.5 whitespace-nowrap">Zone</th>
                    <th className="p-3.5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedPlanets.map((planet) => {
                    const pid = planet.id || slugify(planet.name);
                    const esi = Number(getMetric(planet, 'esi', 'esiScore', planet.habitabilityIndex ?? 0));
                    const star = classifyStarType(planet.starSpectralType || planet.starType, planet.starTempK || planet.equilibriumTempK);
                    const inHZ = planet.zoneStatus === 'Habitable Zone' || 
                      planet.inHabitableZone || 
                      (planet.hzd != null && planet.hzd >= -1.0 && planet.hzd <= 1.0) ||
                      esi >= 0.75;

                    return (
                      <tr key={pid} className="hover:bg-slate-900/40 transition">
                        <td className="p-3.5 font-semibold text-slate-200">{planet.name}</td>
                        <td className={`p-3.5 font-medium ${star.color}`}>{star.label}</td>
                        <td className="p-3.5 text-slate-300">
                          {planet.radiusEarth != null ? `${Number(planet.radiusEarth).toFixed(2)} R⊕` : ''}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {(planet.equilibriumTempK ?? planet.eqTempK) != null ? `${Number(planet.equilibriumTempK ?? planet.eqTempK).toFixed(0)} K` : ''}
                        </td>
                        <td className="p-3.5 text-cyan-400 font-bold">{esi.toFixed(2)}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border font-medium ${
                            inHZ 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : 'text-slate-400 bg-slate-500/5 border-slate-500/10'
                          }`}>
                            {inHZ ? 'Habitable' : 'Non-HZ'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Link to={`/planet/${pid}`} className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs">
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
                  className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition text-slate-200"
                >
                  Prev
                </button>
                <div className="flex items-center px-3 text-xs font-mono text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition text-slate-200"
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