import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FiTruck, FiUsers, FiActivity, FiAlertTriangle,
  FiDollarSign, FiClock, FiRefreshCw, FiMapPin,
} from 'react-icons/fi';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { statisticsAPI, liveMapAPI, walletAdminAPI } from '../utils/api';
import { toast } from 'react-toastify';

function StatCard({ icon: Icon, title, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
    red: 'bg-red-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 ${colors[color] || 'bg-blue-500'} rounded-xl`}>
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </div>
  );
}

// ─── Live Map Component (raw Leaflet) ────────────────────────────────────────
function LiveMap({ buses }) {
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

    // Remove old markers and polylines
    Object.values(markersRef.current).forEach(m => m.remove());
    Object.values(polylinesRef.current).forEach(p => p.remove());
    markersRef.current = {};
    polylinesRef.current = {};

    buses.forEach(bus => {
      const color = bus.line_color || '#059669';

      // Draw route polyline
      if (bus.route_coords && bus.route_coords.length >= 2) {
        const latlngs = bus.route_coords.map(c => [c.latitude, c.longitude]);
        const poly = L.polyline(latlngs, {
          color,
          weight: 3,
          opacity: 0.6,
          dashArray: '6, 4',
        }).addTo(map);
        polylinesRef.current[bus.id + '_route'] = poly;
      }

      // Bus marker (GPS position)
      if (bus.gps) {
        const isOnTrip = !!bus.trip;
        const html = `
          <div style="
            background:${isOnTrip ? color : '#6b7280'};
            border:3px solid #fff;
            border-radius:50%;
            width:34px;height:34px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            font-size:16px;
          ">🚌</div>`;
        const icon = L.divIcon({ html, iconSize: [34, 34], iconAnchor: [17, 17], className: '' });
        const popupHtml = `
          <div style="font-family:sans-serif;min-width:160px;">
            <b style="font-size:14px;">Bus ${bus.numero_bus}</b><br/>
            <span style="color:#6b7280;font-size:12px;">${bus.plaque}</span><br/>
            <hr style="margin:6px 0;border-color:#e5e7eb;"/>
            ${bus.line_nom ? `<div style="font-size:12px;">🛣 ${bus.line_code} — ${bus.line_nom}</div>` : ''}
            ${bus.chauffeur ? `<div style="font-size:12px;">👤 ${bus.chauffeur}</div>` : ''}
            ${bus.gps?.vitesse_kmh ? `<div style="font-size:12px;">⚡ ${bus.gps.vitesse_kmh.toFixed(0)} km/h</div>` : ''}
            ${isOnTrip ? `<div style="color:#059669;font-size:12px;font-weight:600;margin-top:4px;">● En trajet</div>` : `<div style="color:#6b7280;font-size:12px;">○ Hors trajet</div>`}
          </div>`;
        const marker = L.marker([bus.gps.latitude, bus.gps.longitude], { icon })
          .addTo(map)
          .bindPopup(popupHtml);
        markersRef.current[bus.id] = marker;
      }
    });
  }, [buses]);

  return (
    <div
      ref={mapRef}
      style={{ height: '420px', width: '100%', borderRadius: '0 0 12px 12px', zIndex: 1 }}
    />
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [finStats, setFinStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [buses, setBuses] = useState([]);
  const [mapLastUpdate, setMapLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet CSS + JS
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

  const fetchMap = useCallback(async () => {
    try {
      const res = await liveMapAPI.data();
      setBuses(Array.isArray(res.data) ? res.data : []);
      setMapLastUpdate(new Date());
    } catch {}
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const statsRes = await statisticsAPI.dashboard();
        setStats(statsRes.data);
        setChartData(statsRes.data.daily_trips || []);
      } catch {
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setIsLoading(false);
      }
      // Financial stats loaded independently — won't block main stats
      try {
        const finRes = await walletAdminAPI.financialStats();
        setFinStats(finRes.data);
      } catch {}
    };
    fetchAll();
    fetchMap();
    const interval = setInterval(fetchMap, 15000);
    return () => clearInterval(interval);
  }, [fetchMap]);

  const incidentsData = [
    { name: 'Accidents', value: 5, fill: '#EF4444' },
    { name: 'Pannes', value: 12, fill: '#F59E0B' },
    { name: 'Normal', value: 83, fill: '#10B981' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tableau de bord MauriBus — temps réel</p>
      </div>

      {/* Stat cards — opérationnel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiTruck} title="Bus Actifs" value={stats?.active_buses || 0} color="blue" />
        <StatCard icon={FiUsers} title="Chauffeurs en ligne" value={stats?.online_drivers || 0} color="green" />
        <StatCard icon={FiActivity} title="Trajets en cours" value={stats?.active_trips || 0} color="purple" />
        <StatCard icon={FiAlertTriangle} title="Alertes" value={stats?.pending_alerts || 0} color="red" />
      </div>

      {/* Stat cards — financier */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FiDollarSign className="text-emerald-500" /> Finances & Wallet
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FiDollarSign}
            title="Recharges validées"
            value={`${(finStats?.total_recharges_valides || 0).toLocaleString('fr-FR')} MRU`}
            color="emerald"
          />
          <StatCard
            icon={FiDollarSign}
            title="Paiements trajets"
            value={`${(finStats?.total_paiements_trajets || 0).toLocaleString('fr-FR')} MRU`}
            color="blue"
          />
          <StatCard
            icon={FiDollarSign}
            title="Commission MauriBus (15%)"
            value={`${(finStats?.commission_mauribus || 0).toLocaleString('fr-FR')} MRU`}
            color="purple"
          />
          <StatCard
            icon={FiClock}
            title="Recharges en attente"
            value={`${finStats?.recharges_en_attente_count || 0}`}
            sub={`${(finStats?.recharges_en_attente_montant || 0).toFixed(0)} MRU à valider`}
            color="amber"
          />
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold mb-4">Trajets Journaliers (7j)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Area type="monotone" dataKey="trips" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTrips)" name="Trajets" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">État Incidents</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={incidentsData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                {incidentsData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1 text-sm">
            {incidentsData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-gray-600">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Alertes Importantes</h2>
          <div className="space-y-3">
            {(stats?.pending_payments || 0) > 0 && (
              <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                <FiAlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{stats.pending_payments} paiement{stats.pending_payments > 1 ? 's' : ''} en attente de validation</p>
                  <p className="text-xs text-gray-500">Aller dans Paiements → Recharges Wallet</p>
                </div>
              </div>
            )}
            {(stats?.new_reports || 0) > 0 && (
              <div className="flex gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{stats.new_reports} signalement{stats.new_reports > 1 ? 's' : ''} nouveau{stats.new_reports > 1 ? 'x' : ''}</p>
                  <p className="text-xs text-gray-500">Consulter la page Signalements</p>
                </div>
              </div>
            )}
            {!stats?.pending_payments && !stats?.new_reports && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune alerte active ✅</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Résumé Wallets</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total wallets citoyens</span>
              <span className="font-bold text-emerald-600">{(finStats?.total_wallets_citoyens || 0).toLocaleString('fr-FR')} MRU</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total wallets chauffeurs</span>
              <span className="font-bold text-blue-600">{(finStats?.total_wallets_chauffeurs || 0).toLocaleString('fr-FR')} MRU</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Revenus MauriBus (15%)</span>
              <span className="font-bold text-purple-600">{(finStats?.commission_mauribus || 0).toLocaleString('fr-FR')} MRU</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FiMapPin className="text-emerald-500" size={20} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Carte en Temps Réel</h2>
              <p className="text-xs text-gray-400">
                {buses.filter(b => b.gps).length} bus localisé{buses.filter(b => b.gps).length !== 1 ? 's' : ''} ·
                {buses.filter(b => b.trip).length} en trajet · Mise à jour auto toutes les 15s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {mapLastUpdate && (
              <span className="text-xs text-gray-400">
                {mapLastUpdate.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <button
              onClick={fetchMap}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <FiRefreshCw size={13} /> Actualiser
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">🚌</div>
            <span>Bus en trajet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs">🚌</div>
            <span>Bus hors trajet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-1 rounded" style={{ background: 'repeating-linear-gradient(90deg,#059669 0,#059669 6px,transparent 6px,transparent 10px)' }} />
            <span>Itinéraire</span>
          </div>
        </div>

        {leafletReady ? (
          <LiveMap buses={buses} />
        ) : (
          <div className="h-96 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Chargement de la carte...
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
