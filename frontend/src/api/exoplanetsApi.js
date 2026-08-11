import { EXOPLANETS, STATS } from '../data/exoplanetsData';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

function generatePlanetSummary(planet) {
  if (!planet) return '';
  const name = planet.name || 'This exoplanet';
  const radius = planet.radiusEarth != null ? `${planet.radiusEarth.toFixed(2)} R⊕` : 'an unknown radius';
  const mass = planet.massEarth != null ? `${planet.massEarth.toFixed(2)} M⊕` : 'an unknown mass';
  const temp = planet.equilibriumTempK != null ? `${planet.equilibriumTempK.toFixed(0)} K` : 'an unknown equilibrium temperature';
  const orbit = planet.orbitAU != null ? `${planet.orbitAU.toFixed(2)} AU` : 'an uncertain orbital distance';
  const star = planet.starType || 'a host star';
  const esi = planet.esiScore ?? planet.esi_score ?? planet.habitabilityIndex ?? 0;
  const phi = planet.phiScore ?? planet.phi_score ?? 0;
  const inHZ = planet.inHabitableZone ?? planet.isInHabitableZone ?? planet.is_in_habitable_zone ?? esi >= 0.6;
  const zonePhrase = inHZ ? 'resides in a conservative habitable zone' : 'orbits outside the conservative habitable zone';

  return `${name} is a ${radius}, ${mass} world orbiting ${star}. It ${zonePhrase} at ${orbit}, with an equilibrium temperature near ${temp}. Estimated habitability metrics are ESI ${esi.toFixed(2)} and PHI ${phi.toFixed(2)}.`;
}

function normalizePlanet(planet) {
  if (!planet) return planet;
  const esi = planet.esiScore ?? planet.esi_score ?? planet.habitabilityIndex ?? 0;
  const phi = planet.phiScore ?? planet.phi_score ?? planet.habitabilityIndex ?? 0;
  const inHZ = planet.inHabitableZone ?? planet.isInHabitableZone ?? planet.is_in_habitable_zone ?? false;
  const starLuminosity = planet.starLuminosity ?? planet.star_luminosity;
  const description = planet.description || generatePlanetSummary({
    ...planet,
    esiScore: esi,
    esi_score: esi,
    phiScore: phi,
    phi_score: phi,
    inHabitableZone: inHZ,
    isInHabitableZone: inHZ,
    is_in_habitable_zone: inHZ,
    starLuminosity,
  });
  const whyInteresting = planet.whyInteresting || `A compelling candidate with ESI ${esi.toFixed(2)} and PHI ${phi.toFixed(2)}, ${inHZ ? 'inside' : 'outside'} the conservative habitable zone estimate.`;

  return {
    ...planet,
    esiScore: esi,
    esi_score: esi,
    phiScore: phi,
    phi_score: phi,
    inHabitableZone: inHZ,
    isInHabitableZone: inHZ,
    is_in_habitable_zone: inHZ,
    starLuminosity,
    star_luminosity: starLuminosity,
    description,
    whyInteresting,
  };
}

function normalizePlanets(planets) {
  return planets.map(normalizePlanet);
}

/**
 * Fetch planets from Flask Python backend API with automatic fallback
 * to embedded local dataset if the backend server is offline.
 */
export async function fetchPlanets(params = {}) {
  try {
    const url = new URL(`${API_BASE_URL}/planets`);
    
    if (params.search) url.searchParams.append('search', params.search);
    if (params.min_hi !== undefined && params.min_hi !== null) url.searchParams.append('min_hi', params.min_hi);
    if (params.max_hi !== undefined && params.max_hi !== null) url.searchParams.append('max_hi', params.max_hi);
    if (params.max_radius) url.searchParams.append('max_radius', params.max_radius);
    if (params.max_temp) url.searchParams.append('max_temp', params.max_temp);
    if (params.max_period) url.searchParams.append('max_period', params.max_period);
    if (params.hz_only) url.searchParams.append('hz_only', 'true');
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
    console.warn('Exora API offline or unreachable, using local fallback:', err.message);
    return {
      planets: normalizePlanets(EXOPLANETS),
      count: EXOPLANETS.length,
      totalCataloged: EXOPLANETS.length,
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
    return { planet, isLiveBackend: true };
  } catch (err) {
    const fallback = EXOPLANETS.find(p => p.id === planetId) || EXOPLANETS.find(p => p.id === 'kepler-452b');
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
    return { stats: STATS, isLiveBackend: false };
  }
}
