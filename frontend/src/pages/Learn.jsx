import React, { useState, useMemo } from 'react';
import { 
  BookOpen, ChevronDown, ChevronUp, Sparkles, Sun, ShieldCheck, 
  Orbit, Telescope, Compass, Radio, ExternalLink
} from 'lucide-react';
import { usePlanets } from '../context/PlanetContext';

export default function Learn() {
  const { planets } = usePlanets();
  
  // Track open accordion items: string keys like "0-0", "1-2"
  const [openFaqs, setOpenFaqs] = useState({ '0-0': true, '1-0': true });
  const [activeStarType, setActiveStarType] = useState('G-Type (Sun-like)');
  const [selectedPlanetId, setSelectedPlanetId] = useState('kepler-452b');

  const toggleFaq = (key) => {
    setOpenFaqs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Dynamic confirmed planets count
  const confirmedCount = useMemo(() => {
    return planets && planets.length > 0 ? (planets.length >= 100 ? `${planets.length}+` : `${planets.length}`) : "5,500+";
  }, [planets]);

  // ═══════════════════════════════════════════════════
  // FAQ CONTENT SECTIONS
  // ═══════════════════════════════════════════════════
  const faqSections = [
    {
      id: 'fundamentals',
      title: 'Fundamentals & Detection',
      icon: Compass,
      description: 'Core concepts in exoplanetary astronomy and observational techniques.',
      questions: [
        {
          q: 'What is an exoplanet?',
          a: `An exoplanet is a planet that orbits outside our solar system, usually around another star. NASA has confirmed ${confirmedCount} exoplanets so far, out of the billions thought to exist in our universe.`
        },
        {
          q: 'How do we find these exoplanets?',
          a: "Usually through a decrease in a star's brightness when it is eclipsed by an orbiting planet (transit method), or a wobble produced in a star by the gravitational pull of an orbiting planet (radial velocity method). These two methods have found the majority of exoplanets discovered so far."
        },
        {
          q: "What's the difference between a confirmed and candidate exoplanet?",
          a: "A candidate is an exoplanet that has been detected but not yet confirmed, often because a second detection method is needed to rule out false positives. Once verified, a candidate becomes confirmed."
        },
        {
          q: 'How are planets named?',
          a: 'Discovered planets are given the name of the telescope or survey that found them, plus a number for the star system, followed by a lowercase letter for the planet, starting with "b" for the first planet found in that system.'
        }
      ]
    },
    {
      id: 'transit-science',
      title: 'Transit Science',
      icon: Radio,
      description: 'Understanding light curves, ingress/egress phases, and photometric measurement.',
      questions: [
        {
          q: 'How do you get a dip in brightness?',
          a: "When a planet passes in front of its star from our point of view, it blocks a small amount of the star's light, causing a brief, measurable dip in brightness that lasts a few hours to a few days before returning to normal."
        },
        {
          q: 'What is transit data?',
          a: "A record of a star's brightness over time, graphed to create a light curve, used to detect dips in brightness caused by orbiting planets on a regular, predictable schedule."
        },
        {
          q: 'What is a transit, step by step?',
          a: "It starts at baseline light (no planet in the way), dips as the planet begins crossing the star (ingress), reaches its lowest point at mid-transit, then rises back to baseline as the planet finishes crossing (egress), repeating each orbit."
        },
        {
          q: "What's the science behind a transit?",
          a: "The amount light dips reveals the planet's size, the time between dips reveals its orbital distance, and a longer, more consistent signal makes it more likely to be a real planet rather than a false positive."
        }
      ]
    },
    {
      id: 'classification-habitability',
      title: 'Classification & Habitability',
      icon: Orbit,
      description: 'Planetary taxonomy, habitable zones, ESI scores, and HZD metrics.',
      questions: [
        {
          q: 'What are the different classifications of exoplanets?',
          a: 'The four main types are Terrestrial (rocky, Earth-sized or smaller), Super-Earths (larger and more massive than Earth but less than Neptune), Neptunian (gaseous atmosphere with a rocky core, like Neptune), and Gas Giants (the largest planets, from slightly bigger than Jupiter up to extremely hot "hot Jupiters").'
        },
        {
          q: 'What is the habitable zone?',
          a: 'The orbital region where a planet sits at just the right distance from its star for liquid water to exist, not too close that it boils away and not too far that it freezes. Often called the Goldilocks Zone, it varies by star temperature and is one of several factors used to assess habitability.'
        },
        {
          q: 'What is the Earth Similarity Index?',
          a: 'The ESI scores an exoplanet on how similar it is to Earth, on a scale from 0 to 1, based on factors like size and the amount of stellar energy it receives. A high score means similarity, not confirmed habitability.'
        },
        {
          q: 'What is the Habitable Zone Distance (HZD)?',
          a: "HZD measures how centrally a planet sits within its star's habitable zone. A value near 0 means the planet is in the optimal position for liquid water; values beyond plus or minus 1 mean it falls outside the habitable zone entirely."
        }
      ]
    },
    {
      id: 'data-missions',
      title: 'Data & Missions',
      icon: Telescope,
      description: 'Space telescopes, astronomical units, biosignatures, and cosmic exploration.',
      questions: [
        {
          q: 'What is a light year?',
          a: 'The distance light travels in one year, approximately 5.9 trillion miles. Astronomers use this unit because distances in miles or kilometers would be too large to work with easily.'
        },
        {
          q: 'What is an astronomical unit?',
          a: "The average distance between Earth and the Sun, defined exactly as 149,597,870.7 kilometers. It's used to measure distances within a solar system, while light-years are used for distances between stars."
        },
        {
          q: "What's the difference between Kepler and TESS?",
          a: 'Kepler, launched in 2009, stared at a single patch of sky for years and found roughly half of all exoplanets discovered so far. TESS, its successor launched in 2018, scans nearly the entire sky, searching for exoplanets around bright, nearby stars.'
        },
        {
          q: 'What is a biosignature?',
          a: 'A substance or phenomenon that could indicate life on an exoplanet, such as certain gases in an atmosphere. Oxygen and methane found together, for example, can be a stronger indicator than either gas alone.'
        },
        {
          q: 'What is the closest known exoplanet to Earth?',
          a: 'Proxima Centauri b, located about 4.25 light-years away, orbiting its star every 11.2 days at roughly 0.0485 AU.'
        },
        {
          q: 'Why do we search for exoplanets?',
          a: "Partly to explore whether we're alone in the universe, and partly because studying other planetary systems helps scientists understand how solar systems form and how unique Earth truly is."
        }
      ]
    }
  ];

  // ═══════════════════════════════════════════════════
  // STAR PROFILES DATA
  // ═══════════════════════════════════════════════════
  const starProfiles = {
    'M-Type (Red Dwarf)': {
      label: 'M-Dwarf (Red Dwarf)',
      tagline: 'Cool, abundant, and volatile',
      temp: '2,400 - 3,700 K',
      hzDistance: '0.03 - 0.20 AU',
      lifespan: 'Trillions of years',
      description: 'M-dwarfs make up over 70% of stars in our galaxy. Because they are cooler and dimmer, their habitable zones sit very close to the star. Planets in this zone are often tidally locked (one permanent day side, one permanent night side) and frequently exposed to powerful stellar flares and coronal mass ejections.'
    },
    'G-Type (Sun-like)': {
      label: 'G-Type (Yellow Dwarf)',
      tagline: 'Stable, long-lived, and proven',
      temp: '5,300 - 6,000 K',
      hzDistance: '0.95 - 1.40 AU',
      lifespan: '~10 billion years',
      description: 'G-type stars like our Sun offer stable luminosity, moderate radiation output, and habitable zones far enough away to avoid tidal locking. They represent the gold standard for searching for Earth analogues, though they comprise only about 7% of stars in the Milky Way.'
    },
    'F-Type (Warm/Bright)': {
      label: 'F-Type (White Dwarf / Subgiant)',
      tagline: 'Luminous, high UV, shorter lifespan',
      temp: '6,000 - 7,500 K',
      hzDistance: '1.40 - 2.20 AU',
      lifespan: '2 - 4 billion years',
      description: 'F-type stars are larger, hotter, and more luminous than the Sun. Their habitable zones are pushed much further outward, but their high ultraviolet radiation fluxes and shorter lifespans give biological evolution a narrower window of opportunity.'
    }
  };

  // Selected planet for Survival Simulator
  const activeSurvivalPlanet = useMemo(() => {
    if (!planets || !planets.length) return null;
    return planets.find(p => p.id === selectedPlanetId) || planets[0];
  }, [planets, selectedPlanetId]);

  // Dynamic Survival Assessment
  const survivalVerdict = useMemo(() => {
    if (!activeSurvivalPlanet) return { title: 'Unknown Target', verdict: 'Awaiting data selection.', survivability: 'Uncertain' };
    const temp = Number(activeSurvivalPlanet.equilibriumTempK ?? activeSurvivalPlanet.eqTempK ?? 0);
    const radius = Number(activeSurvivalPlanet.radiusEarth || 1.0);
    const esi = Number(activeSurvivalPlanet.esi ?? activeSurvivalPlanet.esiScore ?? 0);
    const inHZ = activeSurvivalPlanet.zoneStatus === 'Habitable Zone' || activeSurvivalPlanet.inHabitableZone;

    if (temp > 700 || radius > 6.0) {
      return {
        title: 'Instant Incineration or Crush Depth',
        verdict: `Survival probability: 0%. With an equilibrium temperature of ${temp} K and radius of ${radius.toFixed(1)} R⊕, atmospheric pressures or extreme stellar radiation would vaporize or crush human physiology within seconds.`,
        badge: 'Deadly Environment',
        color: 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      };
    }
    if (temp < 180) {
      return {
        title: 'Cryogenic Deep Freeze',
        verdict: `Survival probability: Extremely Low (<1%). At ${temp} K, surface gases freeze solid into cryogenic glaciers. Without active pressurized nuclear thermal habitats, unshielded humans would freeze instantly.`,
        badge: 'Cryogenic World',
        color: 'text-blue-400 border-blue-500/40 bg-blue-500/10'
      };
    }
    if (inHZ && esi >= 0.75) {
      return {
        title: 'Promising Habitable Environment',
        verdict: `Survival probability: Moderate to High (with atmospheric support). With an equilibrium temperature of ${temp} K and ESI of ${esi.toFixed(2)}, surface liquid water is physically possible. A pressurized breather mask or suit is required until local atmospheric chemistry is confirmed.`,
        badge: 'Candidate Terrestrial Refuge',
        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      };
    }
    return {
      title: 'Hostile Marginal Environment',
      verdict: `Survival probability: Low (<5%). Equilibrium temperature is ${temp} K with ESI of ${esi.toFixed(2)}. Surface conditions place this world outside the conservative comfort zone, requiring enclosed life-support installations.`,
      badge: 'Marginal Candidate',
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    };
  }, [activeSurvivalPlanet]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
      
      {/* ═══════════════════════════════════════════════════
          Page Header
          ═══════════════════════════════════════════════════ */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-data shadow-[0_0_10px_rgba(34,211,238,0.15)]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Interactive Exoplanet Academy</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white">Frequently Asked Questions & Science Guide</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Comprehensive scientific answers on exoplanet detection, transit geometry, habitability metrics, and observational astronomy.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          9. FAQ ACCORDION SECTIONS
          ═══════════════════════════════════════════════════ */}
      <div className="space-y-10">
        {faqSections.map((section, sIdx) => {
          const SectionIcon = section.icon;
          return (
            <section key={section.id} className="space-y-4">
              
              {/* Section Banner */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                  <SectionIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{section.description}</p>
                </div>
              </div>

              {/* Accordion Questions */}
              <div className="space-y-3 pl-0 sm:pl-2">
                {section.questions.map((faq, qIdx) => {
                  const key = `${sIdx}-${qIdx}`;
                  const isOpen = Boolean(openFaqs[key]);

                  return (
                    <div
                      key={key}
                      className={`glass-panel rounded-2xl border overflow-hidden transition-all duration-200 ${
                        isOpen ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.06)]' : 'border-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => toggleFaq(key)}
                        className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                      >
                        <span className="font-bold text-white text-sm sm:text-base pr-4">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-cyan-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-6 border-t border-slate-800/80 bg-slate-950/70">
                          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════
          10. INTERACTIVE WIDGET 1: Habitable Zone Star Profile Visualizer
          ═══════════════════════════════════════════════════ */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Habitable Zone Star Profile Visualizer</h2>
          </div>
          <span className="text-xs font-mono-data text-slate-400">Spectral Class Comparison</span>
        </div>

        {/* Star Type Toggle Buttons */}
        <div className="flex flex-wrap gap-3">
          {Object.keys(starProfiles).map((type) => (
            <button
              key={type}
              onClick={() => setActiveStarType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-mono-data font-bold transition-all ${
                activeStarType === type
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Active Star Profile Card */}
        {starProfiles[activeStarType] && (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-bold text-white text-base">{starProfiles[activeStarType].label}</h3>
              <span className="px-3 py-1 rounded-full text-xs font-mono-data font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {starProfiles[activeStarType].tagline}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-data text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Effective Temperature</span>
                <span className="text-white font-bold">{starProfiles[activeStarType].temp}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Habitable Zone Boundaries</span>
                <span className="text-cyan-400 font-bold">{starProfiles[activeStarType].hzDistance}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Main Sequence Lifespan</span>
                <span className="text-indigo-400 font-bold">{starProfiles[activeStarType].lifespan}</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {starProfiles[activeStarType].description}
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          10. INTERACTIVE WIDGET 2: Could YOU survive on this planet?
          Expanded to include ALL curated dataset planets
          ═══════════════════════════════════════════════════ */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono-data">
          <Sparkles className="w-4 h-4" />
          <span>Planetary Survival Assessment Simulator</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Could YOU survive on this planet?</h2>
          <p className="text-slate-400 text-xs">
            Select any planet from the complete Exora archive ({planets.length} targets) to evaluate biological survival prospects based on physical data.
          </p>
        </div>

        {/* Planet Dropdown Selector */}
        <div className="max-w-md">
          <label className="text-xs font-mono-data text-slate-400 block mb-1.5 font-semibold">
            Choose Target Planet:
          </label>
          <select
            value={selectedPlanetId}
            onChange={(e) => setSelectedPlanetId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono-data text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 shadow-inner"
          >
            {planets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.starType || 'Host Star'} • {p.radiusEarth ? `${Number(p.radiusEarth).toFixed(2)} R⊕` : 'Target'})
              </option>
            ))}
          </select>
        </div>

        {/* Survival Assessment Verdict Panel */}
        {activeSurvivalPlanet && (
          <div className="p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-4 shadow-[0_0_20px_rgba(34,211,238,0.06)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center space-x-2 text-cyan-400 font-mono-data text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Survival Assessment Verdict: {activeSurvivalPlanet.name}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono-data font-bold border ${survivalVerdict.color}`}>
                {survivalVerdict.badge}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-data text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Radius</span>
                <span className="text-white font-bold">{activeSurvivalPlanet.radiusEarth ? `${Number(activeSurvivalPlanet.radiusEarth).toFixed(2)} R⊕` : 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Temperature</span>
                <span className="text-white font-bold">{(activeSurvivalPlanet.equilibriumTempK ?? activeSurvivalPlanet.eqTempK) ? `${Number(activeSurvivalPlanet.equilibriumTempK ?? activeSurvivalPlanet.eqTempK).toFixed(0)} K` : 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ESI Score</span>
                <span className="text-cyan-400 font-bold">{Number(activeSurvivalPlanet.esi ?? activeSurvivalPlanet.esiScore ?? 0).toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Habitable Zone</span>
                <span className="text-emerald-400 font-bold">{activeSurvivalPlanet.zoneStatus || 'Habitable Zone'}</span>
              </div>
            </div>

            <p className="text-slate-200 text-xs leading-relaxed font-mono-data bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {survivalVerdict.verdict}
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          Learn More Research Links Section
          ═══════════════════════════════════════════════════ */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Learn More & Deepen Your Research</span>
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Access the original research archives, astronomical databases, and documentation behind planetary characterization.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <a
            href="https://exoplanetarchive.ipac.caltech.edu/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono-data font-semibold hover:border-cyan-500/40 hover:text-cyan-200 transition-colors flex items-center space-x-2"
          >
            <span>NASA Exoplanet Archive Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://exoplanets.nasa.gov/exoplanet-watch/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono-data hover:border-slate-700 hover:text-white transition-colors flex items-center space-x-2"
          >
            <span>NASA Exoplanet Watch Guides</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

    </div>
  );
}
