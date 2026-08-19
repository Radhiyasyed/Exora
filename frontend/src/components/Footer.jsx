import React from 'react';
import { Orbit, Database, Compass, BarChart3, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="glass-panel border-t border-slate-800/80 mt-20 bg-slate-950/90 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Column 1: Branding */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <Orbit className="w-5 h-5 text-cyan-400" />
              <span className="font-display font-bold text-lg text-white">Exora</span>
            </div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">OPEN DATA EXPLORER</p>
            <p className="text-slate-500 text-xs italic leading-relaxed">
              Explore worlds beyond our solar system.
            </p>
            <a
              href="https://exoplanetarchive.ipac.caltech.edu/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[12px] font-mono-data text-cyan-400/90 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
            >
              <Database className="w-3 h-3" />
              <span>NASA Exoplanet Archive • Public Data</span>
            </a>
          </div>

          {/* Column 2: EXPLORE */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h4 className="font-display font-semibold text-white text-sm">EXPLORE</h4>
            </div>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link></li>
              <li><Link to="/search" className="hover:text-cyan-400 transition-colors">Search & Explore</Link></li>
              <li><Link to="/planet/kepler-452b" className="hover:text-cyan-400 transition-colors">Planet Detail</Link></li>
              <li><Link to="/compare" className="hover:text-cyan-400 transition-colors">Compare Worlds</Link></li>
              <li><Link to="/esi" className="hover:text-cyan-400 transition-colors">ExoCalc</Link></li>
            </ul>
          </div>

          {/* Column 3: ANALYZE */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h4 className="font-display font-semibold text-white text-sm">ANALYZE</h4>
            </div>
            <ul className="space-y-2">
              <li><Link to="/lightcurve" className="hover:text-cyan-400 transition-colors">Light Curve Lab</Link></li>
              <li><Link to="/learn" className="hover:text-cyan-400 transition-colors">Learn</Link></li>
            </ul>
          </div>

          {/* Column 4: MORE */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-purple-400" />
              <h4 className="font-display font-semibold text-white text-sm">MORE</h4>
            </div>
            <ul className="space-y-2">
              <li><Link to="/resources" className="hover:text-cyan-400 transition-colors">Research Archive</Link></li>
              <li><Link to="/about" className="hover:text-cyan-400 transition-colors">Crew</Link></li>
            </ul>
          </div>

          {/* Column 5: DATA SOURCE Card */}
          <div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Database className="w-4 h-4" />
                <span className="font-semibold text-xs uppercase tracking-wider">DATA SOURCE</span>
              </div>
              <div>
                <a
                  href="https://exoplanetarchive.ipac.caltech.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-semibold text-sm hover:text-cyan-400 transition-colors inline-block"
                >
                  NASA Exoplanet Archive ↗
                </a>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Publicly available exoplanet data used throughout Exora.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/60 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px]">
          <p className="text-slate-500">© 2026 Exora Observatory. An independent educational and research project.</p>
          <div className="flex items-center">
            <div className="border-l border-slate-700 h-4 mx-4"></div>
            <p className="text-slate-500">Exora is not affiliated with NASA. Data sourced from public archives.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
