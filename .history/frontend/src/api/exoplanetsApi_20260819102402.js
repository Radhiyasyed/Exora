import { EXOPLANETS } from '../data/exoplanetsData';
import exoraPlanetsRaw from '../data/exora_planets.json';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export function slugify(name) {
  if (!name) return 'unknown';
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function generatePlanetSummary(planet) {
  if (!planet) return '';
  const name = planet.name || 'This exoplanet';
  const radius = planet.radiusEarth != null ? `${Number(planet.radiusEarth).toFixed(2)} R⊕` : 'an unknown radius';
  const mass = planet.massEarth != null ? `${Number(planet.massEarth).toFixed(2)} M⊕` : 'an unknown mass';
  const temp = planet.equilibriumTempK != null ? `${Number(planet.equilibriumTempK).toFixed(0)} K` : 'an unknown equilibrium temperature';
  const orbit = planet.orbitalSemiMajorAxisAU != null ? `${Number(planet.orbitalSemiMajorAxisAU).toFixed(2)} AU` : (planet.orbitAU != null ? `${Number(planet.orbitAU).toFixed(2)} AU` : null);
  const star = planet.starType || planet.starSpectralType || 'a host star';
  const esi = planet.esiScore ?? planet.esi ?? planet.esi_score ?? planet.habitabilityIndex ?? 0;
  const inHZ = planet.inHabitableZone ?? planet.isInHabitableZone ?? (planet.zoneStatus === 'Habitable Zone' || esi >= 0.6);
  const zonePhrase = inHZ ? 'resides in a conservative habitable zone' : 'orbits outside the conservative habitable zone';

  const orbitStr = orbit ? ` at ${orbit}` : '';
  return `${name} is a ${radius}, ${mass} world orbiting ${star}. It ${zonePhrase}${orbitStr}, with an equilibrium temperature near ${temp}. Estimated Earth Similarity Index is ${Number(esi).toFixed(2)}.`;
}

function generateWhyInteresting(planet) {
  const name = planet.name || 'This world';
  const esi = planet.esiScore ?? planet.esi ?? 0;
  const zone = planet.zoneStatus || (planet.inHabitableZone ? 'Habitable Zone' : 'Extreme Orbit');
  
  if (planet.whyInteresting) return planet.whyInteresting;
  if (planet.name?.toLowerCase().includes('earth')) {
    return 'Standard unit of measurement for habitability metrics (ESI = 1.00). Serves as the calibrating anchor for cosmic biosignatures.';
  }
  if (zone === 'Habitable Zone' || esi >= 0.75) {
    return `High Earth Similarity Index (${Number(esi).toFixed(2)}) in the circumstellar habitable zone makes ${name} a high-priority candidate for spectroscopic atmospheric characterization.`;
  }
  if (planet.radiusEarth && planet.radiusEarth > 10) {
    return `An extreme gas giant with a radius of ${Number(planet.radiusEarth).toFixed(1)} R⊕, presenting an ideal laboratory for studying upper atmospheric dynamics and extreme thermal physics.`;
  }
  if (planet.equilibriumTempK && planet.equilibriumTempK > 1000) {
    return `With an equilibrium temperature exceeding ${Number(planet.equilibriumTempK).toFixed(0)} K, this ultra-hot exoplanet experiences intense stellar irradiation and extreme atmospheric evaporation.`;
  }
  return `A validated exoplanetary target with ESI ${Number(esi).toFixed(2)}, providing vital data for cataloging planetary system diversity across the galaxy.`;
}

export function normalizePlanet(planet) {
  if (!planet) return planet;
  const id = planet.id || slugify(planet.name);
  const name = planet.name || id;
  const esi = Number(planet.esi ?? planet.esiScore ?? planet.esi_score ?? planet.habitabilityIndex ?? 0);
  const inHZ = planet.inHabitableZone ?? planet.isInHabitableZone ?? (planet.zoneStatus === 'Habitable Zone' || esi >= 0.6);
  const starType = planet.starType || planet.starSpectralType || 'Unknown Host';
  const starTempK = planet.starTempK ?? planet.stellarTempK ?? null;
  const orbitAU = planet.orbitAU ?? planet.orbitalSemiMajorAxisAU ?? null;
  const hzd = planet.hzd != null ? Number(planet.hzd) : (inHZ ? 0.2 : (planet.equilibriumTempK > 350 ? -1.5 : 2.5));
  const zoneStatus = planet.zoneStatus || (inHZ ? 'Habitable Zone' : (planet.equilibriumTempK > 350 ? 'Too Hot' : 'Too Cold'));

  const system = planet.system || (name.includes(' ') ? name.split(' ').slice(0, -1).join(' ') : name);

  const description = planet.description || generatePlanetSummary({
    ...planet,
    name,
    starType,
    orbitAU,
    esiScore: esi,
    inHabitableZone: inHZ,
  });

  const whyInteresting = generateWhyInteresting({
    ...planet,
    name,
    esiScore: esi,
    zoneStatus,
    inHabitableZone: inHZ,
  });

  const rawDistLy = planet.distanceLy ?? planet.distance_ly ?? planet.dist_ly ?? planet.distance;
  let distanceLy = null;
  if (rawDistLy != null && !isNaN(Number(rawDistLy))) {
    distanceLy = Number(rawDistLy);
  } else if (planet.sy_dist != null && !isNaN(Number(planet.sy_dist))) {
    distanceLy = Number((Number(planet.sy_dist) * 3.26156).toFixed(1));
  } else if (planet.distPc != null && !isNaN(Number(planet.distPc))) {
    distanceLy = Number((Number(planet.distPc) * 3.26156).toFixed(1));
  } else if (planet.st_dist != null && !isNaN(Number(planet.st_dist))) {
    distanceLy = Number((Number(planet.st_dist) * 3.26156).toFixed(1));
  }

  return {
    ...planet,
    id,
    name,
    system,
    distanceLy,
    starType,
    starSpectralType: starType,
    starTempK,
    stellarTempK: starTempK,
    orbitAU,
    orbitalSemiMajorAxisAU: orbitAU,
    esiScore: esi,
    esi: esi,
    hzd,
    zoneStatus,
    inHabitableZone: inHZ,
    isInHabitableZone: inHZ,
    is_in_habitable_zone: inHZ,
    description,
    whyInteresting,
  };
}

export function normalizePlanets(planets) {
  return planets.map(normalizePlanet);
}

// Build merged baseline catalogue from exora_planets.json + EXOPLANETS
export function getMergedLocalDataset() {
  const curatedMap = new Map();
  EXOPLANETS.forEach(p => {
    const slug = slugify(p.name);
    curatedMap.set(slug, p);
    if (p.id) curatedMap.set(p.id, p);
  });

  const dataset = [];
  const seenIds = new Set();

  // First include exora_planets.json enriched with curated details
  if (Array.isArray(exoraPlanetsRaw)) {
    exoraPlanetsRaw.forEach(p => {
      const slug = slugify(p.name);
      const curated = curatedMap.get(slug) || curatedMap.get(p.id) || {};
      const merged = { ...p, ...curated, name: p.name || curated.name, id: slug };
      seenIds.add(slug);
      seenIds.add(slug.replace(/-/g, ''));
      dataset.push(normalizePlanet(merged));
    });
  }

  // Include any remaining curated planets (like Earth baseline)
  EXOPLANETS.forEach(p => {
    const slug = slugify(p.name);
    if (!seenIds.has(slug) && !seenIds.has(p.id)) {
      dataset.push(normalizePlanet(p));
    }
  });

  return dataset;
}

const LOCAL_PLANETS_DATASET = getMergedLocalDataset();

/**
 * Fetch planets from Flask Python backend API with automatic fallback
 * to embedded local dataset if the backend server is offline.
 */
export async function fetchPlanets(params = {}) {
  try {
    const url = new URL(`${API_BASE_URL}/planets`);
    
    if (params.search) url.searchParams.append('search', params.search);
    if (params.min_esi !== undefined && params.min_esi !== null) url.searchParams.append('min_esi', params.min_esi);
    if (params.max_esi !== undefined && params.max_esi !== null) url.searchParams.append('max_esi', params.max_esi);
    if (params.max_radius) url.searchParams.append('max_radius', params.max_radius);
    if (params.max_temp) url.searchParams.append('max_temp', params.max_temp);
    if (params.max_period) url.searchParams.append('max_period', params.max_period);
    if (params.zone_status) url.searchParams.append('zone_status', params.zone_status);
    if (params.sort_by) url.searchParams.append('sort_by', params.sort_by);
    if (params.order) url.searchParams.append('order', params.order);
    
    if (params.star_types && Array.isArray(params.star_types)) {
      params.star_types.forEach((st) => url.searchParams.append('star_type', st));
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`API response HTTP ${res.status}`);
    const data = await res.json();
    return {
      planets: normalizePlanets(data.planets || []),
      count: data.count || 0,
      totalCataloged: data.totalCataloged || 0,
      isLiveBackend: true,
    };
  } catch (err) {
    return {
      planets: LOCAL_PLANETS_DATASET,
      count: LOCAL_PLANETS_DATASET.length,
      totalCataloged: LOCAL_PLANETS_DATASET.length,
      isLiveBackend: false,
    };
  }
}

/**
 * Fetch a single planet's data by ID/slug from Python backend
 */
export async function fetchPlanetById(planetId) {
  try {
    const res = await fetch(`${API_BASE_URL}/planets/${encodeURIComponent(planetId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const planet = await res.json();
    return { planet: normalizePlanet(planet), isLiveBackend: true };
  } catch (err) {
    const cleanId = String(planetId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fallback = LOCAL_PLANETS_DATASET.find(p => 
      p.id === planetId || 
      p.name?.toLowerCase() === planetId?.toLowerCase() ||
      p.id?.replace(/[^a-z0-9]/g, '') === cleanId ||
      p.name?.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanId
    ) || LOCAL_PLANETS_DATASET[0];
    return { planet: normalizePlanet(fallback), isLiveBackend: false };
  }
}

/**
 * Fetch catalog statistics from backend API
 */
export async function fetchCatalogStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const stats = await res.json();
    return { stats, isLiveBackend: true };
  } catch (err) {
    const hzCount = LOCAL_PLANETS_DATASET.filter(p => p.zoneStatus === 'Habitable Zone' || p.inHabitableZone).length;
    const computedStats = [
      { label: "Confirmed Exoplanets", value: "5,642+", change: `${LOCAL_PLANETS_DATASET.length} targets synced`, icon: "Globe" },
      { label: "Habitable Zone Candidates", value: `${hzCount}`, change: "Terrestrial candidates", icon: "Sparkles" },
      { label: "Planetary Systems", value: "4,195", change: "Multi-planet systems", icon: "Orbit" },
      { label: "Data Archive Size", value: "14.2 TB", change: "Kepler • TESS • NASA Archive", icon: "Database" }
    ];
    return { stats: computedStats, isLiveBackend: false };
  }
}
