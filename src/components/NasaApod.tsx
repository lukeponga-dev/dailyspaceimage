import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, X, Share2, Download } from 'lucide-react';

interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
  thumbnail_url?: string;
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
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function NasaApod() {
  const [data, setData] = useState<ApodData | null>(null);
  const [gallery, setGallery] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDate());
  const [selectedImage, setSelectedImage] = useState<ApodData | null>(null);

  const cache = useRef<Map<string, ApodData>>(new Map());

  const fetchWithRetry = async (url: string, retries = 3, timeout = 10000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (response.ok) return response;
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Failed after retries');
  };

  const fetchApod = useCallback(async (date: string) => {
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
      const data = await res.json();
      cache.current.set(date, data);
      setData(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGallery = useCallback(async () => {
    const now = new Date();
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const startDateObj = new Date(now);
    startDateObj.setDate(startDateObj.getDate() - 10);
    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
    
    setGalleryError(null);
    try {
      const res = await fetchWithRetry(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`);
      const data = await res.json();
      setGallery(data.reverse());
    } catch (err: any) {
      console.error('Gallery fetch error:', err);
      setGalleryError('Failed to load recent images. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchApod(selectedDate);
    fetchGallery();
  }, [fetchApod, fetchGallery, selectedDate]);

  const handleShare = async (item: ApodData) => {
    try {
      await navigator.share({
        title: item.title,
        url: item.url,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">NASA Astronomy Picture of the Day</h1>
      
      <div className="mb-8 flex justify-center items-center gap-4">
        <label htmlFor="date" className="font-medium">Select Date:</label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {loading && (
        <div className="grid md:grid-cols-3 gap-8 mb-12 animate-pulse">
          <div className="md:col-span-2 w-full h-96 bg-gray-200 rounded-lg shadow-lg"></div>
          <div className="md:col-span-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      )}
      {error && <div className="text-center p-10 text-red-500">Error: {error}</div>}
      {galleryError && <div className="text-center p-4 text-red-500">{galleryError}</div>}
      
      {data && !loading && !error && (
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            {data.media_type === 'image' ? (
              imageError ? (
                <div className="w-full h-96 bg-gray-100 flex flex-col items-center justify-center rounded-lg shadow-lg text-gray-500 p-6 text-center">
                  <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
                  <p className="font-semibold text-lg">Unable to load image</p>
                  <p className="text-sm">The image could not be retrieved at this time.</p>
                </div>
              ) : (
                <>
                  <img 
                    src={data.url} 
                    alt={data.title} 
                    className="w-full rounded-lg shadow-lg" 
                    referrerPolicy="no-referrer" 
                    onError={() => setImageError(true)}
                  />
                  <div className="mt-4 flex gap-2">
                    <a
                      href={data.url}
                      download={`${data.title}.jpg`}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                    >
                      <Download size={18} />
                      Download
                    </a>
                    <button
                      onClick={() => handleShare(data)}
                      className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300"
                    >
                      <Share2 size={18} />
                      Share
                    </button>
                  </div>
                </>
              )
            ) : data.media_type === 'video' && !data.url.includes('youtube') ? (
              <video src={data.url} controls preload="auto" className="w-full h-96 rounded-lg shadow-lg" />
            ) : (
              <iframe 
                src={data.url.includes('youtube.com/watch?v=') ? data.url.replace('watch?v=', 'embed/') : data.url} 
                title={data.title} 
                className="w-full h-96 rounded-lg shadow-lg" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
            <p className="text-gray-600 mb-4">{formatDate(data.date)}</p>
            <p className="text-lg leading-relaxed">{data.explanation}</p>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Recent Images</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {gallery.map((item) => (
          <div key={item.date} className="cursor-pointer group" onClick={() => setSelectedImage(item)}>
            <div className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
              <img 
                src={item.url} 
                alt={item.title} 
                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110" 
                referrerPolicy="no-referrer" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Failed';
                }}
              />
            </div>
            <p className="text-sm font-medium mt-2 truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
            <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedImage(null)}>
          <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-2 bg-gray-200 rounded-full hover:bg-gray-300">
              <X size={20} />
            </button>
            <img src={selectedImage.url} alt={selectedImage.title} className="w-full rounded-lg mb-4" referrerPolicy="no-referrer" />
            <h3 className="text-xl font-bold mb-2">{selectedImage.title}</h3>
            <div className="flex gap-2">
              <a
                href={selectedImage.url}
                download={`${selectedImage.title}.jpg`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              >
                <Download size={18} />
                Download
              </a>
              <button
                onClick={() => handleShare(selectedImage)}
                className="inline-flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
