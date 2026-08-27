import { Calendar, Compass, Star } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  currentView: string;
}

export default function Navigation({ onNavigate, currentView }: Props) {
  const navItems = [
    { name: 'Today', icon: Calendar, view: 'today' },
    { name: 'Discover', icon: Compass, view: 'discover' },
    { name: 'Favorites', icon: Star, view: 'favorites' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 p-4 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <button 
          key={item.view}
          onClick={() => onNavigate(item.view)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentView === item.view ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <item.icon size={22} />
          <span className="text-[10px] uppercase tracking-widest">{item.name}</span>
        </button>
      ))}
    </nav>
  );
}
