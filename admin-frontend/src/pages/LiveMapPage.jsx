import { useState, useEffect, useRef, useCallback } from 'react';
import { liveMapAPI } from '../utils/api';
import {
  FiWifi, FiWifiOff, FiNavigation, FiRefreshCw,
  FiUsers, FiTruck, FiClock,
} from 'react-icons/fi';

// ─── Leaflet Map Component ────────────────────────────────────────────────────
function LiveMapLeaflet({ buses, onBusSelect, selectedBus }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [18.0735, -15.9582],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;
    return () => { map.remove(); leafletMapRef.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = leafletMapRef.current;
    if (!map || !L) return;

    Object.values(markersRef.current).forEach(m => m.remove());
    Object.values(polylinesRef.current).forEach(p => p.remove());
    markersRef.current = {};
    polylinesRef.current = {};

    buses.forEach(bus => {
      const color = bus.line_color || '#3B82F6';
      const isOnline = bus.is_online;
      const isOnTrip = !!bus.trip;
      const hasGps = !!bus.gps;

      // Route polyline
      if (bus.route_coords && bus.route_coords.length >= 2) {
        const poly = window.L.polyline(
          bus.route_coords.map(c => [c.latitude, c.longitude]),
          { color, weight: 3, opacity: 0.5, dashArray: '6,4' }
        ).addTo(map);
        polylinesRef.current[bus.id + '_route'] = poly;
      }

      // Bus/driver marker
      if (hasGps) {
        const bgColor = isOnTrip ? color : (isOnline ? '#F59E0B' : '#6B7280');
        const icon = L.divIcon({
          html: `
            <div style="position:relative">
              <div style="
                background:${bgColor};border:3px solid #fff;
                border-radius:50%;width:40px;height:40px;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 3px 10px rgba(0,0,0,0.3);
                font-size:18px;cursor:pointer;
              ">🚌</div>
              ${isOnline ? `<div style="
                position:absolute;top:-2px;right:-2px;
                width:12px;height:12px;border-radius:50%;
                background:#10B981;border:2px solid #fff;
              "></div>` : ''}
            </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          className: '',
        });

        const popupHtml = `
          <div style="font-family:system-ui;min-width:180px;padding:4px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="font-size:18px;">🚌</div>
              <div>
                <div style="font-weight:700;font-size:15px;">Bus ${bus.numero_bus}</div>
                <div style="color:#6B7280;font-size:11px;">${bus.plaque}</div>
              </div>
              <div style="margin-left:auto;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;
                background:${isOnline ? '#D1FAE5' : '#F3F4F6'};color:${isOnline ? '#065F46' : '#374151'};">
                ${isOnline ? '● En ligne' : '○ Hors ligne'}
              </div>
            </div>
            <hr style="border-color:#E5E7EB;margin:6px 0;"/>
            ${bus.chauffeur ? `
              <div style="font-size:12px;margin-bottom:4px;">
                <span style="color:#6B7280;">👤 Chauffeur:</span>
                <span style="font-weight:600;margin-left:4px;">${bus.chauffeur}</span>
              </div>` : '<div style="font-size:12px;color:#9CA3AF;">Aucun chauffeur assigné</div>'}
            ${bus.line_nom ? `
              <div style="font-size:12px;margin-bottom:4px;">
                <span style="color:#6B7280;">🛣</span>
                <span style="margin-left:4px;">${bus.line_code} — ${bus.line_nom}</span>
              </div>` : ''}
            ${bus.gps?.vitesse_kmh != null ? `
              <div style="font-size:12px;margin-bottom:4px;">
                <span style="color:#6B7280;">⚡ Vitesse:</span>
                <span style="margin-left:4px;">${Math.round(bus.gps.vitesse_kmh)} km/h</span>
              </div>` : ''}
            ${isOnTrip ? `
              <div style="background:#D1FAE5;border-radius:6px;padding:4px 8px;margin-top:6px;font-size:12px;color:#065F46;font-weight:600;">
                ● Trajet en cours · ${bus.trip?.nombre_passagers || 0} passagers
              </div>` : `
              <div style="background:#F3F4F6;border-radius:6px;padding:4px 8px;margin-top:6px;font-size:12px;color:#6B7280;">
                ○ Hors trajet
              </div>`}
          </div>`;

        const marker = L.marker([bus.gps.latitude, bus.gps.longitude], { icon })
          .addTo(map)
          .bindPopup(popupHtml, { maxWidth: 240 });

        marker.on('click', () => onBusSelect && onBusSelect(bus));
        markersRef.current[bus.id] = marker;
      }
    });
  }, [buses, onBusSelect]);

  // Pan to selected bus
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !selectedBus?.gps) return;
    map.setView([selectedBus.gps.latitude, selectedBus.gps.longitude], 15, { animate: true });
    markersRef.current[selectedBus.id]?.openPopup();
  }, [selectedBus]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />;
}

// ─── Driver Status Card ────────────────────────────────────────────────────────
function DriverCard({ bus, onClick, isSelected }) {
  const isOnline = bus.is_online;
  const isOnTrip = !!bus.trip;
  const hasGps = !!bus.gps;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white hover:border-gray-200'
      }`}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            isOnTrip ? 'bg-green-500' : isOnline ? 'bg-amber-400' : 'bg-gray-300'
          }`}>
            {bus.chauffeur ? bus.chauffeur.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </div>
          {isOnline && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-sm truncate">
            {bus.chauffeur || 'Chauffeur inconnu'}
          </div>
          <div className="text-xs text-gray-500">Bus {bus.numero_bus}</div>
          {bus.line_nom && (
            <div className="text-xs mt-0.5 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bus.line_color || '#3B82F6' }} />
              <span className="truncate text-gray-600">{bus.line_code} · {bus.line_nom}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            isOnTrip ? 'bg-green-100 text-green-700' :
            isOnline ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {isOnTrip ? 'En trajet' : isOnline ? 'Connecté' : 'Hors ligne'}
          </span>
          {hasGps ? (
            <span className="text-xs text-green-600 flex items-center gap-0.5">
              <FiNavigation size={10} /> GPS
            </span>
          ) : (
            <span className="text-xs text-gray-400">Pas de GPS</span>
          )}
        </div>
      </div>

      {isOnTrip && bus.trip && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1">
          <FiNavigation size={11} />
          <span>{bus.trip.nombre_passagers} passager{bus.trip.nombre_passagers !== 1 ? 's' : ''}</span>
          {bus.gps?.vitesse_kmh > 0 && <span>· {Math.round(bus.gps.vitesse_kmh)} km/h</span>}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function LiveMapPage() {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [filter, setFilter] = useState('all'); // all | online | trip

  // Load Leaflet
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await liveMapAPI.data();
      setBuses(Array.isArray(res.data) ? res.data : []);
      setLastUpdate(new Date());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredBuses = buses.filter(b => {
    if (filter === 'online') return b.is_online;
    if (filter === 'trip') return !!b.trip;
    return true;
  });

  const onlineCount = buses.filter(b => b.is_online).length;
  const onTripCount = buses.filter(b => !!b.trip).length;
  const withGpsCount = buses.filter(b => !!b.gps).length;

  const formatTime = (d) => d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Left panel: driver list ── */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">Carte Live</h2>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Actualiser"
            >
              <FiRefreshCw size={16} />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{onlineCount}</div>
              <div className="text-xs text-green-700">En ligne</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{onTripCount}</div>
              <div className="text-xs text-blue-700">En trajet</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-purple-600">{withGpsCount}</div>
              <div className="text-xs text-purple-700">GPS actif</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {[
              { key: 'all', label: `Tous (${buses.length})` },
              { key: 'online', label: `En ligne (${onlineCount})` },
              { key: 'trip', label: `Trajet (${onTripCount})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {lastUpdate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <FiClock size={10} />
              <span>Mis à jour: {formatTime(lastUpdate)}</span>
            </div>
          )}
        </div>

        {/* Driver list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-gray-400">
                <FiRefreshCw size={24} className="mx-auto mb-2 animate-spin" />
                <div className="text-sm">Chargement...</div>
              </div>
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiUsers size={40} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm font-medium">Aucun chauffeur</div>
              <div className="text-xs mt-1">
                {filter === 'online' ? 'Aucun chauffeur connecté' :
                 filter === 'trip' ? 'Aucun trajet en cours' :
                 'Aucun bus actif'}
              </div>
            </div>
          ) : (
            filteredBuses.map(bus => (
              <DriverCard
                key={bus.id}
                bus={bus}
                isSelected={selectedBus?.id === bus.id}
                onClick={() => {
                  setSelectedBus(bus.id === selectedBus?.id ? null : bus);
                }}
              />
            ))
          )}
        </div>

        {/* Legend */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="text-xs text-gray-500 font-semibold mb-2">Légende</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>En trajet actif</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Connecté, hors trajet</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span>Hors ligne</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {!leafletReady ? (
          <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
            <div className="text-center">
              <FiTruck size={48} className="mx-auto mb-3 opacity-30" />
              <div>Chargement de la carte...</div>
            </div>
          </div>
        ) : (
          <LiveMapLeaflet buses={buses} onBusSelect={setSelectedBus} selectedBus={selectedBus} />
        )}

        {/* Floating status bar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white rounded-full px-4 py-2 shadow-md flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold">{onlineCount} connecté{onlineCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-blue-600">
              <FiNavigation size={12} />
              <span className="font-semibold">{onTripCount} en trajet</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="text-gray-400 flex items-center gap-1">
              <FiClock size={11} />
              <span className="text-xs">{formatTime(lastUpdate)}</span>
            </div>
          </div>
        </div>

        {/* No GPS hint */}
        {!loading && withGpsCount === 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 text-sm text-center shadow">
              <div className="font-semibold">Aucun bus visible sur la carte</div>
              <div className="text-xs mt-0.5">Les chauffeurs doivent se connecter et activer leur GPS</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
