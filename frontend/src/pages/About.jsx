import React, { useState } from 'react';
import { Info, Users, Award, Globe, ChevronDown, X } from 'lucide-react';
import CREW_DATA from '../data/exora_crew.json';

export default function About() {
  const [activeProfile, setActiveProfile] = useState(null);

  const closeProfile = () => setActiveProfile(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-data">
          <Info className="w-3.5 h-3.5" />
          <span>Exora Crew</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white">{CREW_DATA.pageHeader}</h1>
        <p className="text-slate-400 text-sm sm:text-base">
          {CREW_DATA.pageSubtitle}
        </p>
      </div>

      {/* Core Team Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Core Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREW_DATA.coreTeam.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setActiveProfile(member)}
              className="glass-panel p-6 rounded-3xl border border-slate-800 text-left group hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.3em] text-cyan-400 font-semibold">{member.title}</p>
                  <h2 className="mt-3 text-xl font-bold text-white">{member.name}</h2>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-5 text-slate-400 text-sm leading-relaxed line-clamp-4">
                {member.bio}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.3em] text-cyan-300 font-semibold">
                <span>VIEW PROFILE ⌄</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Supervisors Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Supervisors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CREW_DATA.supervisors.map((supervisor) => (
            <button
              key={supervisor.id}
              type="button"
              onClick={() => setActiveProfile(supervisor)}
              className="glass-panel p-6 rounded-3xl border border-slate-800 text-left group hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.3em] text-cyan-400 font-semibold">{supervisor.title}</p>
                  <h2 className="mt-3 text-xl font-bold text-white">{supervisor.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{supervisor.role}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-300">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-5 text-slate-400 text-sm leading-relaxed line-clamp-4">
                {supervisor.bio}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.3em] text-cyan-300 font-semibold">
                <span>VIEW PROFILE ⌄</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Modal */}
      {activeProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="relative w-full max-w-2xl rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-[0_0_60px_rgba(8,15,38,0.65)]">
            <button
              type="button"
              onClick={closeProfile}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:bg-cyan-500/20 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[12px] uppercase tracking-[0.24em] text-cyan-300">
                Team Profile Dossier
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.24em] text-slate-500">{activeProfile.title}</p>
                  <h2 className="text-3xl font-extrabold text-white">{activeProfile.name}</h2>
                  {activeProfile.role && <p className="mt-1 text-sm text-slate-400">{activeProfile.role}</p>}
                </div>
                <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 px-4 py-3 text-cyan-300 text-xs font-semibold">
                  {activeProfile.specialty}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-slate-300 space-y-4">
                <p className="text-sm leading-relaxed">{activeProfile.bio}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-[12px] uppercase tracking-[0.24em] text-slate-500">Specialty</p>
                    <p className="mt-2 text-sm text-white">{activeProfile.specialty}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-[12px] uppercase tracking-[0.24em] text-slate-500">Mission Impact</p>
                    <p className="mt-2 text-sm text-white">{activeProfile.missionImpact}</p>
                  </div>
                </div>
                {activeProfile.roleText && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-[12px] uppercase tracking-[0.24em] text-slate-500">Role</p>
                    <p className="mt-2 text-sm text-white">{activeProfile.roleText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}