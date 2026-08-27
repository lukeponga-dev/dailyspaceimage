import React from 'react';
import Navigation from './Navigation';

export default function Layout({ children, currentView, onNavigate }: { children: React.ReactNode; currentView: string; onNavigate: (view: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <h1 className="text-lg font-bold tracking-widest uppercase text-slate-200">Cosmic Observer</h1>
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
          U
        </div>
      </header>
      <main className="pt-28 px-6 max-w-5xl mx-auto">
        {children}
      </main>
      <Navigation currentView={currentView} onNavigate={onNavigate} />
    </div>
  );
}
