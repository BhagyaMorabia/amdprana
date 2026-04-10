/** Nearby Healthy Eats — Google Maps + Places API integration */

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Star, ExternalLink, Filter, Navigation } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const MAPS_KEY = import.meta.env.VITE_MAPS_API_KEY;

const DIET_FILTERS = [
  { id: 'all', label: 'All Healthy', emoji: '🥗' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'organic', label: 'Organic', emoji: '🌿' },
  { id: 'salad', label: 'Salads', emoji: '🥙' },
];

interface Place {
  name: string;
  vicinity: string;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  placeId: string;
  lat: number;
  lng: number;
  types?: string[];
}

function PlaceCard({ place }: { place: Place }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`;
  const healthTags = (place.types ?? [])
    .filter((t) => ['meal_takeaway', 'cafe', 'restaurant', 'food', 'grocery_or_supermarket'].includes(t))
    .slice(0, 2)
    .map((t) => t.replace(/_/g, ' '));

  return (
    <article className="card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight">{place.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{place.vicinity}</p>
        </div>
        {place.openNow !== undefined && (
          <span className={`badge shrink-0 text-xs ${place.openNow ? 'bg-brand-500/15 text-brand-400' : 'bg-red-500/15 text-red-400'}`}>
            {place.openNow ? 'Open' : 'Closed'}
          </span>
        )}
      </div>

      {place.rating && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-semibold text-white text-sm">{place.rating}</span>
          </div>
          {place.userRatingsTotal && (
            <span className="text-xs text-zinc-500">({place.userRatingsTotal.toLocaleString()} reviews)</span>
          )}
        </div>
      )}

      {healthTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {healthTags.map((t) => (
            <span key={t} className="badge bg-surface-border text-zinc-500 text-xs capitalize">{t}</span>
          ))}
        </div>
      )}

      <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
        className="btn-ghost text-xs w-full justify-center mt-auto"
        aria-label={`Get directions to ${place.name} on Google Maps`}>
        <Navigation className="w-3.5 h-3.5" aria-hidden="true" /> Get Directions
        <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
      </a>
    </article>
  );
}

export default function Nearby() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [locationGranted, setLocationGranted] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  const loadGoogleMaps = () => {
    if (window.google?.maps) { initializeMap(); return; }
    if (!MAPS_KEY || MAPS_KEY === 'PASTE_YOUR_MAPS_KEY_HERE') {
      setError('Google Maps API key not configured. Please add VITE_MAPS_API_KEY to .env.local');
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    window.initMap = initializeMap;
    document.head.appendChild(script);
  };

  const initializeMap = () => setMapLoaded(true);

  useEffect(() => { loadGoogleMaps(); }, []);

  const searchNearby = (lat: number, lng: number, keyword = 'healthy food') => {
    if (!mapRef.current || !window.google?.maps) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 14,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0a0f0d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8ba89e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#111916' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2420' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1f1a' }] },
      ],
    });
    mapInstanceRef.current = mapInstance;

    const service = new window.google.maps.places.PlacesService(mapInstance);
    service.nearbySearch({
      location: { lat, lng },
      radius: 2000,
      keyword,
      type: 'restaurant',
    }, (results: any[], status: any) => {
      setLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const mapped: Place[] = results.slice(0, 20).map((p: any) => ({
          name: p.name ?? 'Unknown',
          vicinity: p.vicinity ?? '',
          rating: p.rating,
          userRatingsTotal: p.user_ratings_total,
          openNow: p.opening_hours?.isOpen?.(),
          placeId: p.place_id ?? '',
          lat: p.geometry?.location?.lat() ?? lat,
          lng: p.geometry?.location?.lng() ?? lng,
          types: p.types,
        }));
        setPlaces(mapped);

        // Add markers
        mapped.forEach((place) => {
          const marker = new window.google.maps.Marker({
            position: { lat: place.lat, lng: place.lng },
            map: mapInstance,
            title: place.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          const info = new window.google.maps.InfoWindow({
            content: `<div style="color:#000;font-family:Inter,sans-serif;padding:4px">
              <strong>${place.name}</strong><br/>
              ${place.rating ? `⭐ ${place.rating}` : ''}</div>`,
          });
          marker.addListener('click', () => info.open(mapInstance, marker));
        });
      } else {
        setError('No healthy restaurants found in this area. Try a different location.');
      }
    });
  };

  const getLocation = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationGranted(true);
        const keyword = filter === 'all' ? 'healthy food organic' : `${filter} food restaurant`;
        searchNearby(coords.latitude, coords.longitude, keyword);
      },
      () => {
        setLoading(false);
        setError('Location access denied. Please allow location access to find nearby restaurants.');
      },
      { timeout: 10000 }
    );
  };

  // Re-search when filter changes and location already granted
  const handleFilterChange = (f: string) => {
    setFilter(f);
    if (locationGranted && mapLoaded) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const keyword = f === 'all' ? 'healthy food organic' : `${f} food restaurant`;
        searchNearby(coords.latitude, coords.longitude, keyword);
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <MapPin className="w-8 h-8 text-coral" aria-hidden="true" />
          Nearby Healthy Eats
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Google Maps finds healthy restaurants and grocery stores near you.
        </p>
      </header>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by dietary type">
          {DIET_FILTERS.map(({ id, label, emoji }) => (
            <button key={id} onClick={() => handleFilterChange(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all
                ${filter === id ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                  : 'bg-surface-card border-surface-border text-zinc-400 hover:border-zinc-600'}`}
              aria-pressed={filter === id}
            >
              <span aria-hidden="true">{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <section aria-labelledby="map-heading">
        <h2 id="map-heading" className="sr-only">Restaurant map</h2>
        <div ref={mapRef} className="w-full h-80 rounded-2xl bg-surface-card border border-surface-border
          overflow-hidden" aria-label="Google Map showing nearby healthy restaurants"
          role="application">
          {!locationGranted && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <MapPin className="w-12 h-12 text-zinc-600" aria-hidden="true" />
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Find Healthy Food Near You</p>
                <p className="text-zinc-500 text-sm mb-4">
                  {!MAPS_KEY || MAPS_KEY === 'PASTE_YOUR_MAPS_KEY_HERE'
                    ? 'Add VITE_MAPS_API_KEY to your .env.local to enable this feature'
                    : 'Allow location access to discover nearby healthy restaurants'}
                </p>
              </div>
              {(!MAPS_KEY || MAPS_KEY === 'PASTE_YOUR_MAPS_KEY_HERE') ? (
                <div className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 px-4 py-2">
                  Maps API key required → Add to .env.local
                </div>
              ) : (
                <button onClick={getLocation} className="btn-primary">
                  <Navigation className="w-4 h-4" aria-hidden="true" /> Enable Location
                </button>
              )}
            </div>
          )}
          {loading && (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" aria-label="Finding restaurants" />
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Place cards */}
      {places.length > 0 && (
        <section aria-labelledby="places-heading">
          <h2 id="places-heading" className="section-title mb-4">
            {places.length} Healthy Spots Found
            <span className="text-zinc-600 font-normal text-base ml-2">within 2km</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((place) => <PlaceCard key={place.placeId} place={place} />)}
          </div>
        </section>
      )}

      {locationGranted && places.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-zinc-700 mx-auto mb-3" aria-hidden="true" />
          <p className="text-zinc-500">No places found. Try a different filter.</p>
        </div>
      )}
    </div>
  );
}
