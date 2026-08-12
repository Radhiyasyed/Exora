import React, { useState, useEffect } from 'react';
import { 
  Scale, Trash2, Sparkles, AlertTriangle, Bookmark, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis, Cell, LabelList } from 'recharts';
import { EXOPLANETS } from '../data/exoplanetsData';

function getMetric(planet, camelKey, snakeKey, fallback = null) {
  return planet?.[camelKey] ?? planet?.[snakeKey] ?? fallback;
}

function CompareWorlds() {
  // Default selected planets: Earth, Kepler-452b, TRAPPIST-1e, Kepler-186f
  const [selectedIds, setSelectedIds] = useState(['earth', 'kepler-452b', 'trappist-1e', 'kepler-186f']);
  const [activePlanet, setActivePlanet] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Planets data is sourced from a local dataset by default but is fetch-ready
  // for future backend integration (e.g., GET /api/exoplanets)
  const [planetsData, setPlanetsData] = useState(EXOPLANETS);
  const bookmarkedPlanets = planetsData.filter((planet) => bookmarkedIds.includes(planet.id));

  const toggleBookmark = (planetId) => {
    setBookmarkedIds((prev) =>
      prev.includes(planetId) ? prev.filter((id) => id !== planetId) : [...prev, planetId]
    );
  };

  const openPlanetModal = (planet) => setActivePlanet(planet);
  const closePlanetModal = () => setActivePlanet(null);

  useEffect(() => {
    // Placeholder fetch - will connect to Python backend endpoint when available
    // fetch('/api/exoplanets').then(r => r.json()).then(setPlanetsData).catch(() => {});
  }, []);

  const selectedPlanets = selectedIds
    .map((id) => planetsData.find((p) => p.id === id))
    .filter(Boolean);

  const factHighlights = selectedPlanets.map((planet) => ({
    name: planet.name,
    fact: planet.inHabitableZone
      ? `${planet.name} remains within the optimistic habitable zone of its host star with an equilibrium temperature of ${planet.equilibriumTempK} K.`
      : `${planet.name} lies outside the optimistic habitable zone but provides a valuable contrast for orbital irradiation and habitability analysis.`
  }));

  const addPlanet = (id) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removePlanet = (id) => {
    if (selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter((pid) => pid !== id));
    }
  };

  // Prepare Recharts metrics comparisons
  const radiusChartData = selectedPlanets.map((p) => ({
    name: p.name,
    "Radius (R⊕)": p.radiusEarth,
  }));

  const tempChartData = selectedPlanets.map((p) => ({
    name: p.name,
    "Eq Temp (K)": p.equilibriumTempK,
  }));

  const periodChartData = selectedPlanets.map((p) => ({
    name: p.name,
    "Orbital Period (Days)": p.orbitalPeriodDays,
  }));

  // Identify highest similarity candidate (excluding Earth itself)
  const nonEarths = selectedPlanets.filter((p) => p.id !== 'earth');
  const highestSimilarityPlanet = nonEarths.length
    ? nonEarths.reduce(
        (max, p) => {
          const pScore = getMetric(p, 'esiScore', 'esi_score', p.habitabilityIndex);
          const maxScore = getMetric(max, 'esiScore', 'esi_score', max.habitabilityIndex);
          return pScore > maxScore ? p : max;
        },
        nonEarths[0]
      )
    : null;


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <Scale className="w-7 h-7 text-cyan-400" />
            <span>Exoplanetary Comparison Grid</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Compare 2 to 4 worlds side-by-side across radius, mass, equilibrium temperature, and habitability indices.
          </p>
        </div>

        {/* Selection Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono-data text-slate-400">Add World (Max 4):</span>
          <select
            onChange={(e) => {
              if (e.target.value) addPlanet(e.target.value);
              e.target.value = '';
            }}
            disabled={selectedIds.length >= 4}
            className="bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono-data rounded-xl px-3 py-2 focus:outline-none disabled:opacity-50"
          >
            <option value="">+ Choose Exoplanet...</option>
            {planetsData.filter((p) => !selectedIds.includes(p.id)).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (ESI: {getMetric(p, 'esiScore', 'esi_score', p.habitabilityIndex)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Planets Cards Grid */}
      {bookmarkedPlanets.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-3 text-xs font-mono-data">
          <span className="text-cyan-400 uppercase tracking-[0.18em] font-semibold">Travel Dossier</span>
          {bookmarkedPlanets.map((planet) => (
            <button
              key={planet.id}
              type="button"
              onClick={() => openPlanetModal(planet)}
              className="rounded-full border border-cyan-500/30 bg-slate-900/90 px-3 py-1 text-cyan-300 text-[12px] transition hover:bg-cyan-500/10"
            >
              {planet.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setBookmarkedIds([])}
            className="ml-auto text-slate-400 hover:text-cyan-300 text-[12px]"
          >
            Clear Dossier
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {selectedPlanets.map((planet) => (
          <div
            key={planet.id}
            onClick={() => openPlanetModal(planet)}
            className="glass-panel p-5 rounded-2xl border border-slate-800 relative space-y-3 group cursor-pointer hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(planet.id);
              }}
              className={`absolute right-4 top-4 rounded-full p-2 transition ${bookmarkedIds.includes(planet.id) ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30'}`}
              title="Add to Travel Dossier"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[12px] font-mono-data text-cyan-400">{planet.system}</span>
                <h3 className="font-bold text-white text-base">{planet.name}</h3>
              </div>
              {selectedIds.length > 2 && (
                <button
                  onClick={() => removePlanet(planet.id)}
                  className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  title="Remove from comparison"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 font-mono-data text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ESI Score:</span>
                <span className="text-cyan-400 font-bold">{getMetric(planet, 'esiScore', 'esi_score', planet.habitabilityIndex)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PHI Score:</span>
                <span className="text-purple-400 font-bold">{getMetric(planet, 'phiScore', 'phi_score', 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Radius:</span>
                <span className="text-slate-200">{planet.radiusEarth} R⊕</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Relative Size Matrix */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="space-y-3">
          <div className="text-xs font-mono-data text-cyan-400 uppercase tracking-wider">Relative Size Matrix</div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-[12px] text-slate-300">
            Observatory Perspective: Scaled Matrix View from 1,000,000 Miles in Deep Space.
          </div>
        </div>

        {/* Active Selection Chips */}
        <div className="flex flex-wrap gap-3 py-2">
          {selectedPlanets.map((planet) => (
            <div key={planet.id} className="inline-flex items-center gap-2 rounded-full bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs font-mono-data text-slate-300 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <span className="font-semibold">{planet.name}</span>
              {selectedIds.length > 2 && (
                <button
                  type="button"
                  onClick={() => removePlanet(planet.id)}
                  className="text-slate-500 hover:text-cyan-400 transition-colors ml-1"
                  title={`Remove ${planet.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Unified Bubble Chart */}
        <div className="w-full h-80 bg-slate-950/50 rounded-2xl border border-slate-800 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey="radiusEarth" 
                name="Radius" 
                unit=" R⊕" 
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="esi" 
                name="ESI Score" 
                stroke="#94a3b8" 
                domain={[0, 1]}
                tick={{ fontSize: 11 }}
              />
              <ZAxis 
                type="number" 
                dataKey="radiusEarth" 
                range={[200, 2500]} 
                name="Radius" 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                itemStyle={{ color: '#22d3ee' }}
                formatter={(value, name) => [value, name === 'esi' ? 'ESI Score' : 'Radius']}
              />
              <Scatter 
                name="Planets" 
                data={selectedPlanets.map(p => ({
                  ...p,
                  esi: getMetric(p, 'esiScore', 'esi_score', p.habitabilityIndex)
                }))}
              >
                {selectedPlanets.map((p, index) => {
                  const esi = getMetric(p, 'esiScore', 'esi_score', p.habitabilityIndex);
                  const color = esi >= 0.8 ? '#2dd4bf' : esi >= 0.5 ? '#0ea5e9' : '#3b82f6';
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color} 
                      fillOpacity={0.6} 
                      stroke={color} 
                      strokeWidth={2} 
                    />
                  );
                })}
                <LabelList dataKey="name" position="top" fill="#cbd5e1" fontSize={11} fontWeight="bold" />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side-by-side Recharts Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Chart 1: Radius */}
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

        {/* Chart 2: Temp */}
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

      {/* Comprehensive Data Comparison Table */}
      <div className="glass-panel rounded-2xl overflow-x-auto border border-slate-800">
        <table className="w-full text-left text-xs font-mono-data">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">Parameter</th>
              {selectedPlanets.map((p) => (
                <th key={p.id} className="p-3 text-cyan-300 font-bold">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Earth Similarity Index (ESI)</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 font-bold text-emerald-400">{getMetric(p, 'esiScore', 'esi_score', p.habitabilityIndex)}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Potential Habitability Index (PHI)</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-purple-400">{getMetric(p, 'phiScore', 'phi_score', 0)}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Radius (Earth Radii)</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.radiusEarth} R⊕</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Mass (Earth Masses)</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.massEarth} M⊕</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Equilibrium Temperature</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.equilibriumTempK} K</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Orbital Period</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.orbitalPeriodDays} Days</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Host Star Type</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{p.starType}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Potential Habitability Index</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3 text-slate-200">{getMetric(p, 'phiScore', 'phi_score', 0)}</td>
              ))}
            </tr>
            <tr>
              <td className="p-3 text-slate-400 font-semibold">Habitable Zone Status</td>
              {selectedPlanets.map((p) => (
                <td key={p.id} className="p-3">
                  <span className={`px-1.5 py-0.5 rounded text-[12px] ${
                    (p.inHabitableZone ?? p.isInHabitableZone ?? p.is_in_habitable_zone) ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                  }`}>
                    {(p.inHabitableZone ?? p.isInHabitableZone ?? p.is_in_habitable_zone) ? 'In HZ' : 'Outside HZ'}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {activePlanet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="relative w-full max-w-3xl rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-[0_0_60px_rgba(8,15,38,0.65)]">
            <button
              type="button"
              onClick={closePlanetModal}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:bg-cyan-500/20 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[12px] uppercase tracking-[0.24em] text-cyan-300">
                    Focused Comparison Modal
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-[0.24em]">{activePlanet.system}</p>
                    <h2 className="text-3xl font-extrabold text-white">{activePlanet.name}</h2>
                    <p className="text-slate-400 text-sm">{activePlanet.starType} host star: {activePlanet.starName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Distance from Earth', value: `${activePlanet.distanceLy} LY` },
                    { label: 'Orbital Period', value: `${activePlanet.orbitalPeriodDays} days` },
                    { label: 'Orbital Distance', value: `${activePlanet.orbitalDistanceAu ?? 'N/A'} AU` },
                    { label: 'Radius', value: `${activePlanet.radiusEarth} R⊕` },
                    { label: 'Mass', value: `${activePlanet.massEarth} M⊕` },
                  ].map((param) => (
                    <div key={param.label} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {param.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white" style={{ fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace' }}>
                        {param.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <p className="text-slate-400 text-sm leading-relaxed">{activePlanet.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-cyan-500/20 bg-cyan-500/5 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] uppercase tracking-[0.24em] text-cyan-300 font-semibold">Telemetry Snapshot</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(activePlanet.id);
                      }}
                      className={`rounded-2xl border px-3 py-2 text-[12px] transition ${bookmarkedIds.includes(activePlanet.id) ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200' : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-200'}`}
                    >
                      {bookmarkedIds.includes(activePlanet.id) ? 'Saved to Dossier' : 'Add to Travel Dossier'}
                    </button>
                  </div>
                  <div className="mt-5 space-y-3">
                    {['Orbit', 'Radius', 'Mass', 'Temperature', 'Habitability'].map((metric) => (
                      <div key={metric} className="flex items-center justify-between text-sm text-slate-300">
                        <span>{metric}</span>
                        <span className="text-cyan-300 font-semibold">
                          {metric === 'Orbit' ? `${activePlanet.orbitalDistanceAu ?? 'N/A'} AU` : metric === 'Radius' ? `${activePlanet.radiusEarth} R⊕` : metric === 'Mass' ? `${activePlanet.massEarth} M⊕` : metric === 'Temperature' ? `${activePlanet.equilibriumTempK} K` : `${activePlanet.habitabilityIndex}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-[12px] leading-relaxed text-slate-400">
                  Discovered by <span className="text-cyan-300 font-semibold">{activePlanet.discoveryMethod || 'Unknown Method'}</span> in <span className="text-cyan-300 font-semibold">{activePlanet.discoveryYear || 'Antiquity'}</span>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Highlight & Scientific Caveat Panel */}
      {highestSimilarityPlanet && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono-data font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Highest Earth-Similarity Candidate</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                {highestSimilarityPlanet.name} (ESI Score: {getMetric(highestSimilarityPlanet, 'esiScore', 'esi_score', highestSimilarityPlanet.habitabilityIndex)})
              </h3>
              <p className="text-slate-300 text-xs mt-1 max-w-3xl">
                Among the selected exoplanets, <strong>{highestSimilarityPlanet.name}</strong> exhibits the physical profile closest to Earth, with a radius of {highestSimilarityPlanet.radiusEarth} R⊕ and an equilibrium temperature of {highestSimilarityPlanet.equilibriumTempK} K.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs text-slate-300">
            {factHighlights.map((item) => (
              <div key={item.name} className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
                <div className="text-cyan-300 font-semibold">{item.name}</div>
                <div className="mt-1 text-slate-400">{item.fact}</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-300 mb-0.5">Scientific Caveat:</strong>
              High Earth Similarity Index (ESI) scores measure physical size, mass, and stellar flux parity, but do NOT guarantee liquid surface water, protective magnetospheres, or breathable atmospheric pressure without direct spectroscopic confirmation.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CompareWorlds;
