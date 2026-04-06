import { useState, useEffect, useCallback } from 'react';

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
  // Convert to US Eastern Time (UTC-5) to better align with NASA API availability
  const estDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
};

export default function NasaApod() {
  const [data, setData] = useState<ApodData | null>(null);
  const [gallery, setGallery] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDate());

  const fetchApod = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    setImageError(false);
    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch NASA APOD: ${res.status} ${res.statusText} - ${errorText}`);
      }
      const data = await res.json();
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
    const estDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const endDate = `${estDate.getFullYear()}-${String(estDate.getMonth() + 1).padStart(2, '0')}-${String(estDate.getDate()).padStart(2, '0')}`;
    
    const startDateObj = new Date(estDate);
    startDateObj.setDate(startDateObj.getDate() - 10);
    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
    
    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch gallery: ${res.status} ${res.statusText} - ${errorText}`);
      }
      const data = await res.json();
      setGallery(data.reverse());
    } catch (err: any) {
      console.error('Gallery fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchApod(selectedDate);
    fetchGallery();
  }, [fetchApod, fetchGallery, selectedDate]);

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

      {loading && <div className="text-center p-10">Loading...</div>}
      {error && <div className="text-center p-10 text-red-500">Error: {error}</div>}
      
      {data && !loading && !error && (
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            {data.media_type === 'image' ? (
              imageError ? (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg shadow-lg text-gray-500">
                  Failed to load image.
                </div>
              ) : (
                <img 
                  src={data.url} 
                  alt={data.title} 
                  className="w-full rounded-lg shadow-lg" 
                  referrerPolicy="no-referrer" 
                  onError={() => setImageError(true)}
                />
              )
            ) : (
              <iframe src={data.url} title={data.title} className="w-full h-96 rounded-lg shadow-lg" />
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {gallery.map((item) => (
          <div key={item.date} className="cursor-pointer" onClick={() => setSelectedDate(item.date)}>
            <img 
              src={item.url} 
              alt={item.title} 
              className="w-full h-32 object-cover rounded shadow" 
              referrerPolicy="no-referrer" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Failed';
              }}
            />
            <p className="text-sm font-medium mt-1 truncate">{item.title}</p>
            <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
