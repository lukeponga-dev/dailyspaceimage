import { Trash2, ExternalLink, Star } from 'lucide-react';

interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
  hdurl?: string;
}

interface FavoritesProps {
  favorites: ApodData[];
  onRemoveFavorite: (date: string) => void;
  onSelectImage: (date: string) => void;
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function Favorites({ favorites, onRemoveFavorite, onSelectImage }: FavoritesProps) {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
            Saved Cosmic Wonders
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Your curated collection of deep space discoveries and celestial imagery.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-full text-slate-300 self-start md:self-auto">
          <Star className="text-amber-400 fill-amber-400" size={16} />
          <span className="text-sm font-mono">{favorites.length} saved</span>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 md:p-20 bg-slate-900/30 border border-dashed border-slate-800/80 rounded-2xl max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 animate-pulse">
            <Star size={28} className="text-slate-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-200">No celestial archives saved yet</h3>
            <p className="text-slate-400 max-w-sm text-sm">
              Discover the deep secrets of the universe. Star your favorite Astronomy Pictures of the Day to save them here for offline cataloging.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <div 
              key={item.date} 
              className="group bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700/60 transition-all duration-300 flex flex-col h-full"
            >
              {/* Image / Video thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                {item.media_type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Video Content</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300">
                  {formatDate(item.date)}
                </span>
              </div>

              {/* Text Info */}
              <div className="p-5 flex flex-col flex-grow space-y-3">
                <h3 className="font-semibold text-slate-200 text-base leading-snug group-hover:text-blue-400 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 flex-grow">
                  {item.explanation}
                </p>

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                  <button
                    onClick={() => onSelectImage(item.date)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
                  >
                    <ExternalLink size={14} />
                    View APOD
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(item.date)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/40 rounded-full transition"
                    title="Remove from favorites"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
