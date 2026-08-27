import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Share2, Download, ChevronLeft, ChevronRight, Shuffle, Calendar, Star, Sparkles } from 'lucide-react';

interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
  hdurl?: string;
}

interface NasaApodProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: (date: string) => boolean;
}

const NASA_API_KEY = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Date math helpers
const addDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRandomDate = () => {
  const start = new Date('1995-06-16T00:00:00').getTime();
  const end = new Date(getLocalDate() + 'T00:00:00').getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseMaxDateFromMessage = (msg: string): string | null => {
  const match = msg.match(/and\s+([A-Za-z]+)\s+(\d+),\s+(\d+)/);
  if (match) {
    const [_, monthStr, dayStr, yearStr] = match;
    const months: { [key: string]: string } = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    const month = months[monthStr.substring(0, 3)];
    if (month) {
      const day = dayStr.padStart(2, '0');
      const year = yearStr;
      return `${year}-${month}-${day}`;
    }
  }
  return null;
};

export default function NasaApod({ selectedDate, onDateChange, onToggleFavorite, isFavorite }: NasaApodProps) {
  const [data, setData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const cache = useRef<Map<string, ApodData>>(new Map());

  const fetchWithRetry = async (url: string, retries = 3, timeout = 10000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        
        if (response.ok) return response;
        
        // If it's a client-side error (4xx) we don't retry, but rather parse the message body
        if (response.status >= 400 && response.status < 500) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.msg) {
              errorMsg = errData.msg;
            } else if (errData && errData.error && errData.error.message) {
              errorMsg = errData.error.message;
            }
          } catch (_) {
            // response was not JSON or failed to parse
          }
          throw new Error(errorMsg);
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        // Do not retry 4xx errors, fail immediately
        if (err instanceof Error && !err.message.includes('HTTP error! status: 5') && !err.message.includes('Failed to fetch') && !err.message.includes('aborted')) {
          throw err;
        }
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Failed after retries');
  };

  const fetchApod = useCallback(async (date: string) => {
    // Check cache first
    if (cache.current.has(date)) {
      setData(cache.current.get(date)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setImageError(false);

    try {
      const res = await fetchWithRetry(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`);
      const responseData = await res.json();
      
      if (responseData.code && responseData.code !== 200) {
        throw new Error(responseData.msg || `Error fetching astronomy picture of the day [Code ${responseData.code}]`);
      }

      cache.current.set(date, responseData);
      setData(responseData);
    } catch (err: any) {
      console.error('Fetch error:', err);
      const errMsg = err.message || 'Failed to connect to NASA servers';
      
      // Attempt to parse maximum available date from NASA error message
      const maxDate = parseMaxDateFromMessage(errMsg);
      if (maxDate && maxDate !== date) {
        onDateChange(maxDate);
        return;
      }

      // Fallback: If no max date parsed but the error is related to date limit/future, and we requested today's local date, try yesterday
      if (date === getLocalDate() && (errMsg.toLowerCase().includes('date must be') || errMsg.toLowerCase().includes('future') || errMsg.toLowerCase().includes('400') || errMsg.toLowerCase().includes('bad request'))) {
        const yesterday = addDays(date, -1);
        onDateChange(yesterday);
        return;
      }
      
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [onDateChange]);

  useEffect(() => {
    fetchApod(selectedDate);
  }, [fetchApod, selectedDate]);

  const handleShare = async (item: ApodData) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.explanation.substring(0, 100) + '...',
          url: item.url,
        });
      } else {
        // Fallback copy to clipboard
        await navigator.clipboard.writeText(item.url);
        alert('Cosmic link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const todayStr = getLocalDate();
  const minDate = "1995-06-16";

  const handlePrevDate = () => {
    if (selectedDate > minDate) {
      onDateChange(addDays(selectedDate, -1));
    }
  };

  const handleNextDate = () => {
    if (selectedDate < todayStr) {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const handleRandomDate = () => {
    onDateChange(getRandomDate());
  };

  const handleTodayDate = () => {
    onDateChange(todayStr);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Title / Slogan */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-blue-500/15">
          <Sparkles size={12} />
          NASA Astronomy Picture
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
          Archival Cosmos Finder
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
          Explore the historical vaults of the cosmos, date by date.
        </p>
      </div>

      {/* Date Navigation Hub */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-2xl backdrop-blur-md">
        {/* Date Selector and Changers */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrevDate}
            disabled={selectedDate <= minDate}
            className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition flex-shrink-0"
            title="Yesterday"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="date"
              id="date"
              min={minDate}
              max={todayStr}
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full sm:w-48 bg-slate-950/90 text-white border border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-center font-mono text-sm cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDate}
            disabled={selectedDate >= todayStr}
            className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition flex-shrink-0"
            title="Tomorrow"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Discovery shortcuts */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleRandomDate}
            className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950/80 hover:bg-slate-800/65 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition"
            title="Random archive date"
          >
            <Shuffle size={14} />
            Random Date
          </button>
          <button
            onClick={handleTodayDate}
            disabled={selectedDate === todayStr}
            className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 rounded-xl text-xs font-semibold uppercase tracking-wider disabled:opacity-35 disabled:pointer-events-none transition"
            title="Jump to today"
          >
            <Calendar size={14} />
            Today
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-6 space-y-6 animate-pulse">
          <div className="w-full aspect-video md:h-[480px] bg-slate-800 rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4">
          <AlertCircle size={40} className="text-red-500" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">Cosmic Link Disruption</h3>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
          </div>
          <button
            onClick={() => fetchApod(selectedDate)}
            className="mt-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Retry Transmit
          </button>
        </div>
      )}
      
      {/* Detail Showcase */}
      {data && !loading && !error && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Display Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            {data.media_type === 'image' ? (
              imageError ? (
                <div className="w-full aspect-video md:h-[480px] bg-slate-900 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                  <AlertCircle className="w-12 h-12 mb-4 text-slate-600" />
                  <p className="font-semibold text-lg">Unable to load deep space picture</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">The telemetry image source could not be resolved. This is occasionally due to temporary DNS disruption at NASA servers.</p>
                </div>
              ) : (
                <div className="relative group overflow-hidden max-h-[580px] flex items-center justify-center">
                  <img 
                    src={data.url} 
                    alt={data.title} 
                    className="w-full object-cover rounded-2xl" 
                    referrerPolicy="no-referrer" 
                    onError={() => setImageError(true)}
                  />
                </div>
              )
            ) : data.media_type === 'video' && !data.url.includes('youtube') ? (
              <video src={data.url} controls preload="auto" className="w-full aspect-video max-h-[480px] rounded-2xl" />
            ) : (
              <iframe 
                src={data.url.includes('youtube.com/watch?v=') ? data.url.replace('watch?v=', 'embed/') : data.url} 
                title={data.title} 
                className="w-full aspect-video max-h-[480px] rounded-2xl" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {/* Gradient Mask Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 pointer-events-none"></div>

            {/* Float Action overlays */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Toggle Favorite button */}
              <button
                onClick={() => onToggleFavorite(data)}
                className={`p-3 backdrop-blur-md border rounded-full transition-all duration-300 ${isFavorite(data.date) ? 'bg-amber-600/35 border-amber-500/60 text-amber-300 hover:bg-amber-600/50' : 'bg-slate-950/75 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'}`}
                title={isFavorite(data.date) ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Star size={18} className={isFavorite(data.date) ? "fill-amber-400 text-amber-400" : ""} />
              </button>

              <button
                onClick={() => handleShare(data)}
                className="p-3 bg-slate-950/75 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 rounded-full transition"
                title="Share picture"
              >
                <Share2 size={18} />
              </button>
              
              {data.media_type === 'image' && (
                <a
                  href={data.hdurl || data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-950/75 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 rounded-full transition"
                  title="Download HD picture"
                >
                  <Download size={18} />
                </a>
              )}
            </div>
          </div>
          
          {/* Detailed Narrative Panel */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">{data.title}</h2>
                <p className="text-slate-400 text-sm mt-1.5 flex items-center gap-2">
                  <span className="font-mono">{formatDate(data.date)}</span>
                  {data.copyright && (
                    <>
                      <span>•</span>
                      <span className="italic font-sans">Photographer: {data.copyright}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Explanation card */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                Scientific Context
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed font-sans bg-slate-900/20 p-5 md:p-6 rounded-2xl border border-slate-800/80 shadow-inner">
                {data.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
