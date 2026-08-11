export const learnAccordion = [
  {
    id: 1,
    question: "Tired of Earth? Here's your exit list.",
    tag: "Fundamentals",
    points: [
      "-> Exoplanets are worlds orbiting stars outside our Solar System.",
      "-> Over 5,600 exoplanets have been confirmed by space missions like Kepler and TESS.",
      "-> Detection techniques include transit photometry (brightness dips) and radial velocity (wobble)."
    ],
    summary: "Understanding the planetary catalog begins by observing how planets influence their host star's light and motion.",
    readMore: "https://exoplanetarchive.ipac.caltech.edu/"
  },
  {
    id: 2,
    question: "Goldilocks Zone — unlocked.",
    tag: "Habitability",
    points: [
      "-> The Circumstellar Habitable Zone (HZ) is the orbital band where liquid surface water could exist.",
      "-> Hotter stars push the HZ outward; cooler M-dwarfs pull the HZ extremely close.",
      "-> Being in the HZ doesn't guarantee habitability—atmosphere and magnetic fields matter immensely."
    ],
    summary: "Liquid water requires a balance between stellar irradiance and atmospheric thermal trapping.",
    readMore: "https://exoplanetarchive.ipac.caltech.edu/docs/intro.html"
  },
  {
    id: 3,
    question: "Okay but can we ACTUALLY know if a planet supports life?",
    tag: "Reality Check",
    points: [
      "-> Transmission spectroscopy measures atmospheric light absorption during transits.",
      "-> Biosignatures include atmospheric disequilibrium—like simultaneous O2 and CH4.",
      "-> JWST is currently probing targets like TRAPPIST-1e for atmospheric signatures."
    ],
    summary: "Direct imaging and spectroscopic atmospheric analysis are our primary pathways to detecting alien life.",
    readMore: "https://www.jwst.nasa.gov/"
  }
];

export const survivalPlanets = {
  'kepler-452b': {
    name: 'Kepler-452b',
    tagline: "Earth's Older Cousin",
    odds: 78,
    gravity: '1.9x Earth Gravity',
    radiation: 'Moderate Solar Flux',
    temperature: 'Warm Temperate',
    gear: [
      '⚠️ Skeletal Bracing Required - 1.9x Earth Gravity',
      '🧊 Advanced Thermal Regulation Suit',
      '🛡 Radiation Shielding Layer'
    ],
    verdict: 'Survival Odds: 78%. You pack heavy jackets and extra oxygen. Gravity is 1.9x Earth so your legs get a brutal workout, but you enjoy a 385-day year under a Sun-like G2 star.'
  },
  'trappist-1e': {
    name: 'TRAPPIST-1e',
    tagline: 'The Tidally Locked Neighbor',
    odds: 82,
    gravity: '0.82x Earth Gravity',
    radiation: 'High Flare Exposure',
    temperature: 'Cool Twilight Band',
    gear: [
      '🛡 Radiation Shielding Required due to active M-dwarf host stellar flares',
      '🌑 Twilight Habitat Dome',
      '💧 Water Recycling Systems'
    ],
    verdict: 'Survival Odds: 82%. Excellent choice! You land in the twilight ribbon between eternal day and night. Gravity is comfortable 0.82g, but watch out for cosmic radiation bursts from the red dwarf.'
  },
  'kepler-438b': {
    name: 'Kepler-438b',
    tagline: 'The Flare-Battered World',
    odds: 12,
    gravity: '1.04x Earth Gravity',
    radiation: 'Extreme Flares',
    temperature: 'Warm, Hostile',
    gear: [
      '⚠️ Full Radiation Bunker Required',
      '🧠 Autonomous Shield Generators',
      '🏠 Underground Habitat Modules'
    ],
    verdict: 'Survival Odds: 12%. Yikes! Host star Kepler-438 unleashes coronal super-flares every 100 days. Unless you live deep underground in lead bunker suites, your atmosphere got toasted long ago.'
  },
  'kepler-22b': {
    name: 'Kepler-22b',
    tagline: 'The Global Ocean Realm',
    odds: 65,
    gravity: '1.58x Earth Gravity',
    radiation: 'Moderate Solar Flux',
    temperature: 'Oceanic Temperate',
    gear: [
      '🧜‍♂️ Submersible Pressure Suit Required',
      '🌊 Floodproof Habitat System',
      '🔋 High-Capacity Energy Grids'
    ],
    verdict: 'Survival Odds: 65%. Hope you brought scuba gear! With a 2.4x Earth radius, this world is likely a mini-Neptune or a shoreless global ocean with hundreds of kilometers of water above a high-pressure ice mantle.'
  }
};

export const starProfiles = {
  'M-type': {
    label: 'M-Type Red Dwarf',
    effectiveTemp: '2,600 K',
    stellarMass: '0.2 M☉',
    luminosity: '0.007 L☉',
    description: 'Ultra-cool, long-lived stars (trillions of years). Habitable zone is super tight (0.01 - 0.2 AU), subjecting planets to intense tidal locking and magnetic flares.'
  },
  'K-type': {
    label: 'K-Type Orange Dwarf',
    effectiveTemp: '4,300 K',
    stellarMass: '0.8 M☉',
    luminosity: '0.4 L☉',
    description: 'Stable, orange dwarf stars offer long-lived habitable zones with lower flare activity than M dwarfs and better energy budgets for temperate planets.'
  },
  'G-type': {
    label: 'G-Type Yellow Dwarf',
    effectiveTemp: '5,800 K',
    stellarMass: '1.0 M☉',
    luminosity: '1.0 L☉',
    description: 'Balanced lifetime (~10 billion years). Habitable zone sits comfortably around 1.0 AU with low stellar activity during main sequence maturity.'
  },
  'F-type': {
    label: 'F-Type Blue-White Star',
    effectiveTemp: '7,200 K',
    stellarMass: '1.4 M☉',
    luminosity: '4.0 L☉',
    description: 'Brighter and hotter than the Sun. Wider habitable zone (1.5 - 2.5 AU) but shorter lifetime and stronger ultraviolet flux.'
  }
};
