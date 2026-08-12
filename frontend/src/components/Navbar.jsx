import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Orbit, Globe, Search, Scale, Gauge, Activity, BookOpen, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Globe },
  { path: '/search', label: 'Search & Explore', icon: Search },
  { path: '/planet/kepler-452b', label: 'Planet Detail', icon: Orbit },
  { path: '/compare', label: 'Compare Worlds', icon: Scale },
  { path: '/esi', label: 'Planetary Metrics Calculator', icon: Gauge }, // Section 1 & 6: Path mapped cleanly to /esi
  { path: '/lightcurve', label: 'Light Curve Lab', icon: Activity },
  { path: '/learn', label: 'Learn', icon: BookOpen }, // Isolated left neighbor of the More dropdown
];

export default function Navbar() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isApiLive, setIsApiLive] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    let canceled = false;

    fetch('/api/health', { cache: 'no-store' })
      .then((res) => {
        if (!canceled && res.ok) {
          setIsApiLive(true);
        }
      })
      .catch(() => {
        if (!canceled) {
          setIsApiLive(false);
        }
      });

    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => {
      canceled = true;
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#030714]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand - Global Rebrand: Exora */}
          <NavLink to="/" className="flex items-center space-x-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all">
              <Orbit className="w-5 h-5 text-cyan-400" />
              <div className="absolute w-2 h-2 bg-indigo-400 rounded-full top-1 right-1 animate-ping opacity-75" />
            </div>
            <div className="flex flex-col">
              <span aria-label="Exora wordmark" className="font-display font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300">
                Exora
              </span>
              <span className="text-[9px] font-mono-data text-cyan-400/90 tracking-widest uppercase">
                OPEN DATA EXPLORER • DIGITAL OBSERVATORY
              </span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1.5 mr-3">
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const isLearnTab = item.path === '/learn';
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)] font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700/60 border border-transparent'
                    } ${isLearnTab ? 'mx-2 gap-3' : ''}` 
                    /* Section 1: mx-2 and gap-3 isolated layout margins added to Learn tab to eliminate text crowding */
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Badges & More Dropdown */}
          <div className="hidden sm:flex items-center space-x-4">
            {/* Section 1 Dropdown Menu - Cleaned up to feature exactly TWO items: Crew and Research Archive */}
            <div ref={moreRef} className="relative ml-4 pl-3 border-l border-slate-800">
              <button
                type="button"
                onClick={() => setIsMoreOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold hover:border-cyan-500/40 hover:text-cyan-300 transition-all shadow-sm"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>
              
              {isMoreOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1">
                  <NavLink
                    to="/crew"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors font-medium"
                    onClick={() => setIsMoreOpen(false)}
                  >
                    Crew
                  </NavLink>
                  <NavLink
                    to="/resources"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors font-medium"
                    onClick={() => setIsMoreOpen(false)}
                  >
                    Research Archive
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2 space-x-2 no-scrollbar border-t border-slate-800/50">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}
