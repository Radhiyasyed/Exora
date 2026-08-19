import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchPlanets } from '../api/exoplanetsApi';

const PlanetContext = createContext();

export const usePlanets = () => {
  const context = useContext(PlanetContext);
  if (!context) {
    throw new Error('usePlanets must be used within a PlanetProvider');
  }
  return context;
};

export const PlanetProvider = ({ children }) => {
  const [planets, setPlanets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    async function loadPlanets() {
      // Check if we have cached data in localStorage
      const cachedData = localStorage.getItem('exoplanetsCache');
      const cachedTimestamp = localStorage.getItem('exoplanetsCacheTimestamp');
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

      // Use cached data if it exists and is fresh AND from live backend
      if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp, 10);
        if (age < CACHE_DURATION) {
          try {
            const parsed = JSON.parse(cachedData);
            if (parsed && Array.isArray(parsed.planets)) {
              if (isMountedRef.current) {
                setPlanets(parsed.planets);
                setIsLiveBackend(parsed.isLiveBackend || false);
                setIsLoading(false);
                console.log('Using cached exoplanets data from local storage');
                return;
              }
            }
          } catch (e) {
            console.warn('Failed to parse cached data, fetching fresh:', e);
          }
        }
      }

      // Fetch fresh data
      console.log('Attempting to fetch fresh planet data from backend...');
      try {
        setIsLoading(true);
        const res = await fetchPlanets({});
        if (isMountedRef.current) {
          setPlanets(res.planets);
          setIsLiveBackend(res.isLiveBackend);
          setIsLoading(false);
          
          console.log('Fetch result:', {
            planetCount: res.planets.length,
            isLiveBackend: res.isLiveBackend,
            count: res.count
          });
          
          // Cache the results
          localStorage.setItem('exoplanetsCache', JSON.stringify({
            planets: res.planets,
            isLiveBackend: res.isLiveBackend
          }));
          localStorage.setItem('exoplanetsCacheTimestamp', Date.now().toString());
        }
      } catch (error) {
        console.error('Failed to fetch planets:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadPlanets();
  }, []);

  const getPlanetById = (planetId) => {
    if (!planetId || !planets || planets.length === 0) return null;
    const searchClean = String(planetId).toLowerCase().replace(/[^a-z0-9]/g, '');
    return planets.find(p => {
      if (!p) return false;
      if (p.id === planetId || p.name === planetId) return true;
      if (p.id?.toLowerCase() === planetId?.toLowerCase()) return true;
      if (p.name?.toLowerCase() === planetId?.toLowerCase()) return true;
      const pCleanId = p.id ? String(p.id).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      const pCleanName = p.name ? String(p.name).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      return pCleanId === searchClean || pCleanName === searchClean;
    }) || null;
  };

  const getPlanetByName = (planetName) => {
    return getPlanetById(planetName);
  };

  const getExoplanetsOnly = () => {
    return planets.filter(p => p.id !== 'earth' && p.name !== 'Earth');
  };

  const getExoplanetsWithEarthBaseline = () => {
    const earthPlanet = planets.find(p => p.id === 'earth' || p.name === 'Earth');
    const exoplanets = planets.filter(p => p.id !== 'earth' && p.name !== 'Earth');
    
    // If Earth exists, tag it as reference standard
    if (earthPlanet) {
      const taggedEarth = {
        ...earthPlanet,
        isReferenceStandard: true,
        displayName: 'Earth (Reference Standard)'
      };
      return [taggedEarth, ...exoplanets];
    }
    
    return exoplanets;
  };

  const isEarth = (planet) => {
    return planet && (planet.id === 'earth' || planet.name === 'Earth');
  };

  const value = {
    planets,
    isLoading,
    isLiveBackend,
    getPlanetById,
    getPlanetByName,
    getExoplanetsOnly,
    getExoplanetsWithEarthBaseline,
    isEarth,
    refetch: () => {
      localStorage.removeItem('exoplanetsCache');
      localStorage.removeItem('exoplanetsCacheTimestamp');
      window.location.reload();
    },
    forceRefresh: async () => {
      localStorage.removeItem('exoplanetsCache');
      localStorage.removeItem('exoplanetsCacheTimestamp');
      setIsLoading(true);
      try {
        const res = await fetchPlanets({});
        if (isMountedRef.current) {
          setPlanets(res.planets);
          setIsLiveBackend(res.isLiveBackend);
          setIsLoading(false);
          
          localStorage.setItem('exoplanetsCache', JSON.stringify({
            planets: res.planets,
            isLiveBackend: res.isLiveBackend
          }));
          localStorage.setItem('exoplanetsCacheTimestamp', Date.now().toString());
        }
      } catch (error) {
        console.error('Failed to force refresh planets:', error);
        setIsLoading(false);
      }
    }
  };

  return (
    <PlanetContext.Provider value={value}>
      {children}
    </PlanetContext.Provider>
  );
};
