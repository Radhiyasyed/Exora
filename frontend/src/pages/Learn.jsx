import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, ChevronDown, ChevronUp, Sparkles, Orbit, Compass, ArrowRight, 
  ShieldCheck, Sun, Star, Atom, GraduationCap, Telescope, Zap, Globe
} from 'lucide-react';

/* ── Import the JSON data file directly ── */
import learnJSON from '../data/exovista_learn.json';

/* Icon resolver from string name to Lucide component */
const ICON_MAP = {
  Compass,
  Sun,
  Sparkles,
  Star,
  Atom,
  Telescope,
  GraduationCap,
  Globe,
  Zap,
};

/* Tag color palette */
const TAG_COLORS = {
  Fundamentals: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  Habitability: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  'Reality Check': 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  Physics: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  Mathematics: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
};

function getTagClass(tag) {
  return TAG_COLORS[tag] || 'bg-slate-800 text-slate-300 border-slate-700';
}

export default function Learn() {
  // Track which accordion is open — keyed by "sectionIdx-accordionIdx"
  const [openAccordions, setOpenAccordions] = useState({ '0-0': true });
  const [selectedQuizIdx, setSelectedQuizIdx] = useState(0);
  const [activeStarType, setActiveStarType] = useState(Object.keys(learnJSON.starProfiles)[0]);

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = learnJSON.sections || [];
  const starProfiles = learnJSON.starProfiles || {};
  const survivalQuiz = learnJSON.survivalQuiz || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-14">
      
      {/* ══════════ Page Header ══════════ */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-data shadow-[0_0_10px_rgba(34,211,238,0.15)]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Interactive Exoplanet Academy</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white">{learnJSON.title}</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          {learnJSON.subtitle}
        </p>
        <span className="inline-block text-[12px] font-mono-data text-slate-600 mt-1">
          Last Updated: {learnJSON.lastUpdated}
        </span>
      </div>

      {/* ══════════ Structured Sections with Nested Accordions ══════════ */}
      {sections.map((section, sIdx) => {
        const SectionIcon = ICON_MAP[section.icon] || Compass;
        return (
          <section key={section.id} className="space-y-5">
            {/* Section Header Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-950">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                  <SectionIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-white">{section.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-mono-data border ${getTagClass(section.tag)}`}>
                      {section.tag}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{section.description}</p>
                </div>
              </div>
            </div>

            {/* Nested Accordions */}
            <div className="space-y-3 pl-0 sm:pl-4">
              {(section.accordions || []).map((acc, aIdx) => {
                const key = `${sIdx}-${aIdx}`;
                const isOpen = !!openAccordions[key];
                return (
                  <div
                    key={key}
                    className={`glass-panel rounded-2xl border overflow-hidden transition-all ${
                      isOpen ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.08)]' : 'border-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(key)}
                      className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className={`px-2.5 py-1 rounded-full text-[12px] font-mono-data border shrink-0 ${getTagClass(acc.tag)}`}>
                          {acc.tag}
                        </span>
                        <h3 className="font-bold text-white text-sm sm:text-base truncate">{acc.question}</h3>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-cyan-400 shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-6 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
                        {/* Key Points */}
                        <div className="space-y-2.5">
                          {acc.points.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start space-x-2">
                              <span className="text-cyan-500 text-xs mt-0.5 shrink-0">→</span>
                              <span className="font-mono-data text-xs text-cyan-200 leading-relaxed">{pt.replace(/^->\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                        {/* Summary */}
                        <div className="border-t border-slate-800/60 pt-3">
                          <p className="text-slate-300 text-xs leading-relaxed italic">
                            <span className="text-slate-500 not-italic font-mono-data mr-1">Summary:</span>
                            {acc.summary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ══════════ Star Profile Visualizer ══════════ */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sun className="w-5 h-5 text-amber-400" />
            <span>Habitable Zone Star Profile Visualizer</span>
          </h2>
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
              {type} Star
            </button>
          ))}
        </div>

        {/* Active Star Profile Card */}
        {starProfiles[activeStarType] && (
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-bold text-white text-base">{starProfiles[activeStarType].label}</h3>
              <span className="px-3 py-1 rounded-full text-xs font-mono-data font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                "{starProfiles[activeStarType].tagline}"
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {starProfiles[activeStarType].description}
            </p>
          </div>
        )}
      </section>

      {/* ══════════ Survival Quiz ══════════ */}
      <section className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono-data">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Survival Simulator</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Could YOU survive on this planet?</h2>
          <p className="text-slate-400 text-xs">
            Select an exoplanet below to evaluate your survival prospects based on real physical data.
          </p>
        </div>

        {/* Planet Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {survivalQuiz.map((planet, idx) => {
            const isSelected = selectedQuizIdx === idx;
            return (
              <button
                key={planet.id}
                onClick={() => setSelectedQuizIdx(idx)}
                className={`p-4 rounded-2xl border text-left font-mono-data text-xs transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-sm text-cyan-300 mb-1">{planet.name}</div>
                <div className="text-[12px] text-slate-500">{planet.tagline}</div>
              </button>
            );
          })}
        </div>

        {/* Survival Assessment */}
        {survivalQuiz[selectedQuizIdx] && (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2 shadow-[0_0_20px_rgba(34,211,238,0.06)]">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono-data text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Survival Assessment Verdict — {survivalQuiz[selectedQuizIdx].name}</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed font-mono-data">
              {survivalQuiz[selectedQuizIdx].assessment}
            </p>
          </div>
        )}
      </section>

      {/* ══════════ Bottom CTA ══════════ */}
      <section className="glass-panel p-10 rounded-3xl border border-slate-800 text-center space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Ready to Explore the Catalog?
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Filter through thousands of confirmed exoplanets, model habitability scores, and analyze photometric transit light curves.
        </p>
        <div className="flex justify-center pt-2">
          <Link
            to="/search"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 text-slate-950 font-bold text-sm hover:brightness-110 shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center space-x-2"
          >
            <Orbit className="w-5 h-5" />
            <span>Theory's great. 5,000 real planets are better.</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
