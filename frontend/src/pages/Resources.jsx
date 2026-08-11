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
          The information below is curated to document the sources, formulas, and scientific teams behind Exora’s mission to make NASA exoplanet data accessible and educational.
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

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Research & Data Resources</h2>
            <p className="text-slate-400 text-sm mt-2">
              Explore the public archives, mission data, and educational resources behind Exora.
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono-data">
            <Globe className="w-4 h-4" />
            <span>Independent Research</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <h3 className="text-white font-semibold">NASA Exoplanet Archive</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The primary public archive of confirmed exoplanet observations, transit events, and derived planetary parameters used throughout Exora.
            </p>
            <a
              href="https://exoplanetarchive.ipac.caltech.edu/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold"
            >
              Visit Archive →
            </a>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <h3 className="text-white font-semibold">Kepler & TESS Mission Files</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Source telemetry, transit catalogs, and follow-up validation records from NASA's flagship exoplanet photometry missions.
            </p>
            <a
              href="https://exoplanetarchive.ipac.caltech.edu/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold"
            >
              Browse Mission Data →
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
            <span className="text-xs font-mono-data text-cyan-300 uppercase">01 — TRANSIT PHOTOMETRY</span>
            <h4 className="text-white font-semibold text-sm mt-2">Detecting Worlds Through Starlight</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              When a planet passes in front of its host star, it blocks a tiny fraction of the star's light. This produces a measurable dip in brightness known as a transit. Exora uses transit light-curve data to help users explore these signals and understand how exoplanets can be detected.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-mono-data text-cyan-300 uppercase">02 — PLANETARY PARAMETERS</span>
            <h4 className="text-white font-semibold text-sm mt-2">Understanding Each World</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Exora brings together key planetary and stellar properties—including radius, mass, orbital period, equilibrium temperature, and stellar characteristics—to provide a broader picture of each exoplanet.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-mono-data text-cyan-300 uppercase">03 — EARTH SIMILARITY INDEX</span>
            <h4 className="text-white font-semibold text-sm mt-2">Comparing Worlds With Earth</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              The Earth Similarity Index (ESI) provides a comparative measure of how closely selected physical properties of an exoplanet resemble Earth. Exora presents ESI as a comparative indicator, not as proof that a planet is habitable.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-mono-data text-cyan-300 uppercase">04 — HABITABILITY ASSESSMENT</span>
            <h4 className="text-white font-semibold text-sm mt-2">Exploring Potentially Favorable Conditions</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Habitability is influenced by many factors, and no single number can determine whether a planet supports life. Exora uses available planetary and stellar parameters to help users explore conditions that may be relevant to potential habitability, including temperature and other environmental indicators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
