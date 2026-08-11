import React from 'react';
import { Users, Award, Globe, Sparkles } from 'lucide-react';
import crewData from '../data/exora_crew.json';

const CardTag = ({ label, icon: Icon }) => (
  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[12px] text-cyan-300 font-semibold">
    <Icon className="w-4 h-4 text-cyan-400" />
    <span>{label}</span>
  </div>
);

export default function Crew() {
  const { pageHeader, pageSubtitle, coreTeam = [], supervisors = [] } = crewData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono-data">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exora Mission Crew</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white">{pageHeader}</h1>
        <p className="text-slate-400 text-sm leading-relaxed">{pageSubtitle}</p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-cyan-400 font-semibold mb-2">Core Team</div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">A cross-disciplinary team of space science, engineering, data science, and storytelling specialists building the Exora observatory experience.</p>
          </div>
          <CardTag label="Team Roster" icon={Users} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coreTeam.map((member) => (
            <div key={member.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{member.name}</h2>
                  <p className="text-slate-400 text-xs uppercase tracking-[0.24em] font-semibold">{member.title}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs text-cyan-300 font-medium">{member.specialty}</div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{member.bio}</p>
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4 text-xs text-slate-300">
                <p className="text-cyan-300 font-semibold">Mission Impact</p>
                <p className="mt-2 text-slate-400">{member.missionImpact}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-cyan-400 font-semibold mb-2">Scientific Supervisors</div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">Guidance from experienced observatory and astrophysics mentors ensures Exora remains grounded in current scientific practice.</p>
          </div>
          <CardTag label="Research Advisors" icon={Award} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supervisors.map((supervisor) => (
            <div key={supervisor.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{supervisor.name}</h2>
                  <p className="text-slate-400 text-xs uppercase tracking-[0.24em] font-semibold">{supervisor.title}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs text-cyan-300 font-medium">{supervisor.role}</div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{supervisor.bio}</p>
              <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-4 text-xs text-slate-300">
                <p className="text-cyan-300 font-semibold">Advisory Role</p>
                <p className="mt-2 text-slate-400">{supervisor.roleText}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel p-8 rounded-3xl border border-slate-800 bg-slate-950/80 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs uppercase tracking-[0.24em] font-semibold">
          <Globe className="w-4 h-4" />
          <span>Operational Mission Support</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">The Exora crew works together to maintain a polished data pipeline, intuitive user experience, and scientifically informed interface for exploring exoplanet habitability at scale.</p>
      </section>
    </div>
  );
}
