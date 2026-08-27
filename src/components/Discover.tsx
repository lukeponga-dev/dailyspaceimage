import { useState, useEffect, useCallback } from 'react';
import { Search, Grid, Eye, Shuffle, Star, ExternalLink, Calendar, Heart, Video, Image, ArrowUpDown, X, Download } from 'lucide-react';

interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
  hdurl?: string;
}

interface DiscoverProps {
  favorites: ApodData[];
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: (date: string) => boolean;
  onSelectImage: (date: string) => void;
}

const NASA_API_KEY = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function Discover({ favorites, onToggleFavorite, isFavorite, onSelectImage }: DiscoverProps) {
  const [gallery, setGallery] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [feedMode, setFeedMode] = useState<'recent' | 'random'>('recent');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<ApodData | null>(null);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      let url = '';
      if (feedMode === 'recent') {
        const now = new Date();
        const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const startDateObj = new Date(now);
        startDateObj.setDate(startDateObj.getDate() - 30);
        const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
        url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
      } else {
        // Fetch 24 random items for grid layout
        url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&count=24`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('API Response Error');
      const data = await res.json();
      
      // APOD returns an array for start_date/end_date and count
      let items: ApodData[] = Array.isArray(data) ? data : [data];
      
      // Filter null or duplicate dates if any
      items = items.filter((item, index, self) => 
        item && item.date && self.findIndex(t => t.date === item.date) === index
      );

      // Default sorting: Newest first
      if (feedMode === 'recent') {
        setGallery(items.reverse());
      } else {
        setGallery(items);
      }
    } catch (err) {
      console.error('Gallery fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [feedMode]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Handle image clicks in grid
  const handleItemClick = (item: ApodData) => {
    setSelectedItem(item);
  };

  // Close modal
  const closeModal = () => {
    setSelectedItem(null);
  };

  // Filter & sort list
  const filteredGallery = gallery
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMedia = mediaTypeFilter === 'all' || item.media_type === mediaTypeFilter;
      return matchesSearch && matchesMedia;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
            Explore Deep Space
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Browse NASA's extensive cosmic library, search celestial phenomena, and discover historical archives.
          </p>
        </div>

        {/* Feed Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start md:self-auto shadow-inner">
          <button
            onClick={() => setFeedMode('recent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${feedMode === 'recent' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar size={14} />
            Recent 30 Days
          </button>
          <button
            onClick={() => setFeedMode('random')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${feedMode === 'random' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Shuffle size={14} />
            Random Archive
          </button>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl backdrop-blur-md">
        {/* Search Input */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search cosmic titles & explanations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 text-white pl-11 pr-4 py-3 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          />
        </div>

        {/* Media Type Filter */}
        <div className="grid grid-cols-3 md:col-span-4 bg-slate-950/50 p-1 border border-slate-800 rounded-xl">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`py-2 px-1 rounded-lg text-xs font-medium transition ${mediaTypeFilter === 'all' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            All Media
          </button>
          <button
            onClick={() => setMediaTypeFilter('image')}
            className={`py-2 px-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition ${mediaTypeFilter === 'image' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Image size={12} />
            Images
          </button>
          <button
            onClick={() => setMediaTypeFilter('video')}
            className={`py-2 px-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition ${mediaTypeFilter === 'video' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Video size={12} />
            Videos
          </button>
        </div>

        {/* Sort By Filter */}
        <div className="relative md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="w-full bg-slate-950/80 text-white py-3 px-4 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium cursor-pointer appearance-none"
          >
            <option value="newest">Newest Date</option>
            <option value="oldest">Oldest Date</option>
          </select>
          <ArrowUpDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-slate-900/35 border border-slate-800/80 rounded-2xl p-4 space-y-4 animate-pulse">
              <div className="w-full aspect-video bg-slate-800 rounded-xl"></div>
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              <div className="h-3 bg-slate-800 rounded w-1/3"></div>
              <div className="h-12 bg-slate-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="text-center p-16 bg-slate-900/20 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">No cosmic archives match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGallery.map((item) => {
            const favorited = isFavorite(item.date);
            return (
              <div 
                key={item.date} 
                className="group bg-slate-900/30 border border-slate-800 hover:border-slate-700/60 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                {/* Media frame */}
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-2">
                      <Video size={24} className="text-slate-600" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Video archive</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                  
                  {/* Star rating / Favorite icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-slate-950/70 backdrop-blur-md rounded-full border border-slate-800 text-slate-400 hover:text-amber-400 transition"
                  >
                    <Star size={14} className={favorited ? "text-amber-400 fill-amber-400" : ""} />
                  </button>

                  <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                    {formatDate(item.date)}
                  </span>
                </div>

                {/* Meta details */}
                <div className="p-5 flex flex-col flex-grow space-y-3">
                  <h3 className="font-semibold text-slate-200 text-sm leading-snug group-hover:text-blue-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  
                  {/* Display preview of description / explanation */}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 flex-grow">
                    {item.explanation}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-auto">
                    <span className="text-[10px] text-slate-500 font-mono capitalize">
                      {item.media_type}
                    </span>
                    <button className="text-[10px] text-blue-400 group-hover:underline font-medium inline-flex items-center gap-1">
                      <Eye size={12} />
                      Read details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Overlay / Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in"
          onClick={closeModal}
        >
          <div 
            className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl space-y-6" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Dismiss */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-100">{selectedItem.title}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="font-mono">{formatDate(selectedItem.date)}</span>
                  {selectedItem.copyright && (
                    <>
                      <span>•</span>
                      <span className="italic">© {selectedItem.copyright}</span>
                    </>
                  )}
                </p>
              </div>
              <button 
                onClick={closeModal} 
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full border border-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Media content */}
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video max-h-96 flex items-center justify-center relative">
              {selectedItem.media_type === 'image' ? (
                <img 
                  src={selectedItem.url} 
                  alt={selectedItem.title} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <iframe 
                  src={selectedItem.url.includes('youtube.com/watch?v=') ? selectedItem.url.replace('watch?v=', 'embed/') : selectedItem.url} 
                  title={selectedItem.title} 
                  className="w-full h-full" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Rich details: Explanation text */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-blue-400">Cosmic Narrative</h4>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/55 font-sans">
                {selectedItem.explanation}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => {
                  onSelectImage(selectedItem.date);
                  closeModal();
                }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl shadow transition"
              >
                <ExternalLink size={16} />
                Load in Today Single-View
              </button>
              
              <button
                onClick={() => onToggleFavorite(selectedItem)}
                className={`inline-flex items-center gap-2 text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl border transition ${isFavorite(selectedItem.date) ? 'bg-amber-600/20 border-amber-500/55 text-amber-300 hover:bg-amber-600/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              >
                <Heart size={16} className={isFavorite(selectedItem.date) ? "fill-amber-400 text-amber-400" : ""} />
                {isFavorite(selectedItem.date) ? 'Favorited' : 'Add to Favorites'}
              </button>

              {selectedItem.media_type === 'image' && (
                <a
                  href={selectedItem.hdurl || selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl transition ml-auto"
                >
                  <Download size={16} />
                  Full Resolution HD
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
