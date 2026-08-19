import React from 'react';
import { Database, Award, Globe, Sparkles } from 'lucide-react';

export default function Resources() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-data">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exora Technical Archive</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white">Resources & Acknowledgements</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          The information below is curated to document the sources, formulas, and scientific teams behind Exora's mission to make NASA exoplanet data accessible and educational.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center space-x-3 text-cyan-400 text-sm font-bold font-mono-data">
            <Database className="w-5 h-5" />
            <span>Data Sources</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Exora is built on publicly available astronomical data from NASA and its space-science missions. The platform uses records from the NASA Exoplanet Archive, including confirmed exoplanet parameters and observational data. Exora also draws on data associated with missions such as Kepler and TESS, alongside relevant stellar and planetary measurements. Habitability analysis uses established planetary parameters and the Earth Similarity Index (ESI) framework to compare selected exoplanet properties with Earth-based reference values.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center space-x-3 text-cyan-400 text-sm font-bold font-mono-data">
            <Award className="w-5 h-5" />
            <span>Acknowledgements</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Exora acknowledges the scientists, mission teams, and research communities whose work has made modern exoplanet exploration possible. We are especially grateful to the teams behind Kepler, TESS, Spitzer, and the James Webb Space Telescope, whose observations and scientific contributions have significantly expanded our understanding of planets beyond our Solar System. Their work and publicly available datasets provide an important foundation for exploration, education, and research through Exora.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RESEARCH & DATA RESOURCES
          ═══════════════════════════════════════════════════ */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Research & Data Resources</h2>
            <p className="text-slate-400 text-sm mt-2">
              Explore the public archives, mission data, and foundation research papers behind Exora.
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono-data">
            <Globe className="w-4 h-4" />
            <span>Independent Research</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Public Data Archives */}
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono-data text-cyan-400 uppercase tracking-wider font-semibold">Public Archive</span>
              <h3 className="text-white font-semibold text-base">NASA Exoplanet Archive</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                The primary public archive of confirmed exoplanet observations, transit events, and derived planetary parameters used throughout Exora.
              </p>
            </div>
            <a
              href="https://exoplanetarchive.ipac.caltech.edu/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold hover:text-cyan-200 transition-colors pt-2"
            >
              Visit Archive →
            </a>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono-data text-indigo-400 uppercase tracking-wider font-semibold">Photometry Telemetry</span>
              <h3 className="text-white font-semibold text-base">Kepler & TESS Mission Files</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Source telemetry, transit catalogs, and follow-up validation records from NASA's flagship exoplanet photometry missions.
              </p>
            </div>
            <a
              href="https://exoplanetarchive.ipac.caltech.edu/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold hover:text-cyan-200 transition-colors pt-2"
            >
              Browse Mission Data →
            </a>
          </div>

          {/* Paper 1: Schulze-Makuch et al. (2011) */}
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono-data text-emerald-400 uppercase tracking-wider font-semibold">Research Paper</span>
              <h3 className="text-white font-semibold text-base">A Two-Tiered Approach to Assessing the Habitability of Exoplanets</h3>
              <p className="text-slate-400 text-[11px] font-mono-data text-slate-500">
                Schulze-Makuch et al. (2011), Astrobiology Journal
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                The pioneer paper that formally introduced the Earth Similarity Index (ESI) framework used throughout Exora.
              </p>
            </div>
            <a
              href="https://doi.org/10.1089/ast.2010.0592"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold hover:text-cyan-200 transition-colors pt-2"
            >
              Read via Astrobiology (DOI) →
            </a>
          </div>

          {/* Paper 2: Kopparapu et al. (2013) */}
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono-data text-emerald-400 uppercase tracking-wider font-semibold">Research Paper</span>
              <h3 className="text-white font-semibold text-base">Habitable Zones around Main-Sequence Stars: New Estimates</h3>
              <p className="text-slate-400 text-[11px] font-mono-data text-slate-500">
                Kopparapu et al. (2013), The Astrophysical Journal
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Reference paper defining habitable zone boundary calculations used in Exora's HZD model.
              </p>
            </div>
            <a
              href="https://doi.org/10.1088/0004-637X/765/2/131"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold hover:text-cyan-200 transition-colors pt-2"
            >
              Read via ApJ (DOI) →
            </a>
          </div>

          {/* Resource 3: NASA Exoplanet Watch Tutorial Series */}
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono-data text-purple-400 uppercase tracking-wider font-semibold">Tutorial Series</span>
              <h3 className="text-white font-semibold text-base">Understanding Exoplanet Transit Light Curves</h3>
              <p className="text-slate-400 text-[11px] font-mono-data text-slate-500">
                NASA Exoplanet Watch Tutorial Series
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Beginner-friendly guide to reading transit light curves, referenced in Exora's Light Curve Lab.
              </p>
            </div>
            <a
              href="https://exoplanets.nasa.gov/exoplanet-watch/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold hover:text-cyan-200 transition-colors pt-2"
            >
              Explore NASA Tutorial →
            </a>
          </div>

          {/* Reference 4: Transiting Exoplanets Textbook */}
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono-data text-amber-400 uppercase tracking-wider font-semibold">Academic Textbook</span>
              <h3 className="text-white font-semibold text-base">Transiting Exoplanets</h3>
              <p className="text-slate-400 text-[11px] font-mono-data text-slate-500">
                Carole A. Haswell, Cambridge University Press, ISBN 978-0521139380
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Undergraduate-level textbook covering transit geometry and light-curve analysis in detail.
              </p>
            </div>
            <a
              href="https://doi.org/10.1017/CBO9780511777486"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold hover:text-cyan-200 transition-colors pt-2"
            >
              View Publisher Record (DOI) →
            </a>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white">Scientific Methods</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Exora combines established astronomical measurements with transparent comparison methods to help users explore how exoplanets are detected, characterized, and assessed for potential habitability.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-mono-data text-cyan-300 uppercase">01. TRANSIT PHOTOMETRY</span>
            <h4 className="text-white font-semibold text-sm mt-2">Detecting Worlds Through Starlight</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              When a planet passes in front of its host star, it blocks a tiny fraction of the star's light. This produces a measurable dip in brightness known as a transit. Exora uses transit light-curve data to help users explore these signals and understand how exoplanets can be detected.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-mono-data text-cyan-300 uppercase">02. HABITABILITY MODELING</span>
            <h4 className="text-white font-semibold text-sm mt-2">Earth Similarity Index (ESI)</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              The Earth Similarity Index compares planetary parameters such as radius, density, and equilibrium temperature to Earth reference values. This provides an exploratory score ranging from 0 to 1, indicating physical resemblance to our home planet.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-mono-data text-cyan-300 uppercase">03. STELLAR ENVIRONMENT</span>
            <h4 className="text-white font-semibold text-sm mt-2">Host Star Influences</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              A planet's conditions depend heavily on the type, temperature, and activity of its host star. Red dwarfs, for instance, have closer habitable zones and can produce intense flares, affecting potential planetary atmospheres.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-mono-data text-cyan-300 uppercase">04. PUBLIC DATA ACCESSIBILITY</span>
            <h4 className="text-white font-semibold text-sm mt-2">Connecting People to Science</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Exora makes observational data from NASA missions accessible through interactive exploration tools. Users can examine real measurements, compare systems, and understand the science of discovery beyond our solar system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
