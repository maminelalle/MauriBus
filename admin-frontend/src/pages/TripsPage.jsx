import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FiPlus, FiSearch, FiRefreshCw, FiCalendar, FiNavigation,
  FiClock, FiUsers, FiTruck, FiX, FiPlay, FiCheckCircle,
} from 'react-icons/fi';
import { tripAPI, driverAPI, busAPI, lineAPI } from '../utils/api';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUT = {
  PLANIFIEE:  { label: 'Planifié',   bg: 'bg-indigo-100', text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  EN_COURS:   { label: 'En cours',   bg: 'bg-green-100',  text: 'text-green-700',   dot: 'bg-green-500' },
  COMPLETEE:  { label: 'Terminé',    bg: 'bg-blue-100',   text: 'text-blue-700',    dot: 'bg-blue-500' },
  ANNULEE:    { label: 'Annulé',     bg: 'bg-red-100',    text: 'text-red-700',     dot: 'bg-red-500' },
  PAUSE:      { label: 'En pause',   bg: 'bg-amber-100',  text: 'text-amber-700',   dot: 'bg-amber-500' },
};

const FILTER_TABS = [
  { key: 'today',     label: "Aujourd'hui" },
  { key: 'week',      label: 'Cette semaine' },
  { key: 'planned',   label: 'Planifiés' },
  { key: 'active',    label: 'En cours' },
  { key: 'all',       label: 'Tous' },
];

function StatusBadge({ statut }) {
  const cfg = STATUT[statut] || STATUT.PLANIFIEE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Plan Trip Modal ────────────────────────────────────────────────────────────
function PlanTripModal({ onClose, onSaved, drivers, buses, lines }) {
  const [form, setForm] = useState({
    driver: '',
    bus: '',
    ligne: '',
    date_planifiee: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When driver changes, auto-select their bus if assigned
  const handleDriverChange = (driverId) => {
    set('driver', driverId);
    const driver = drivers.find(d => d.id === driverId);
    if (driver?.bus_id) set('bus', driver.bus_id);
    else set('bus', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.driver || !form.bus || !form.ligne || !form.date_planifiee) {
      toast.error('Tous les champs sont requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        driver: form.driver,
        bus: form.bus,
        ligne: form.ligne,
        date_planifiee: new Date(form.date_planifiee).toISOString(),
        statut: 'PLANIFIEE',
      };
      await tripAPI.create(payload);
      toast.success('Trajet planifié avec succès');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la planification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Planifier un trajet</h2>
            <p className="text-sm text-gray-500 mt-0.5">Assignez un trajet à un chauffeur</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Chauffeur */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chauffeur *</label>
            <select
              value={form.driver}
              onChange={e => handleDriverChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un chauffeur</option>
              {drivers.filter(d => d.statut === 'ACTIF').map(d => (
                <option key={d.id} value={d.id}>
                  {d.prenom} {d.nom} — {d.matricule}
                </option>
              ))}
            </select>
          </div>

          {/* Bus */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bus *</label>
            <select
              value={form.bus}
              onChange={e => set('bus', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un bus</option>
              {buses.filter(b => b.statut === 'ACTIF').map(b => (
                <option key={b.id} value={b.id}>
                  Bus {b.numero_bus} — {b.plaque}
                </option>
              ))}
            </select>
          </div>

          {/* Ligne */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ligne *</label>
            <select
              value={form.ligne}
              onChange={e => set('ligne', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner une ligne</option>
              {lines.filter(l => l.statut === 'ACTIVE').map(l => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Heure */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date et heure prévue *</label>
            <input
              type="datetime-local"
              value={form.date_planifiee}
              onChange={e => set('date_planifiee', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Planifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('today');
  const [showModal, setShowModal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, dRes, bRes, lRes] = await Promise.all([
        tripAPI.list({ page_size: 200 }),
        driverAPI.list({ page_size: 100 }),
        busAPI.list({ page_size: 100 }),
        lineAPI.list({ page_size: 100 }),
      ]);
      setTrips(Array.isArray(tRes.data) ? tRes.data : (tRes.data.results || []));
      setDrivers(Array.isArray(dRes.data) ? dRes.data : (dRes.data.results || []));
      setBuses(Array.isArray(bRes.data) ? bRes.data : (bRes.data.results || []));
      setLines(Array.isArray(lRes.data) ? lRes.data : (lRes.data.results || []));
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCancel = async (trip) => {
    if (!window.confirm(`Annuler ce trajet ?`)) return;
    try {
      await tripAPI.update(trip.id, { statut: 'ANNULEE' });
      toast.success('Trajet annulé');
      fetchAll();
    } catch {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const applyFilter = (list) => {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now - 7 * 86400000);
    const weekAhead = new Date(now.getTime() + 7 * 86400000);

    switch (tab) {
      case 'today': return list.filter(t => {
        const ref = t.date_planifiee || t.date_debut;
        return new Date(ref).toDateString() === todayStr;
      });
      case 'week': return list.filter(t => {
        const ref = new Date(t.date_planifiee || t.date_debut);
        return ref >= weekAgo && ref <= weekAhead;
      });
      case 'planned': return list.filter(t => t.statut === 'PLANIFIEE');
      case 'active': return list.filter(t => t.statut === 'EN_COURS' || t.statut === 'PAUSE');
      default: return list;
    }
  };

  const filtered = applyFilter(trips).filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.driver_nom?.toLowerCase().includes(s) ||
      t.bus_numero?.toLowerCase().includes(s) ||
      t.ligne_nom?.toLowerCase().includes(s)
    );
  });

  const countByStatus = (s) => trips.filter(t => t.statut === s).length;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trajets</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gérez et planifiez les trajets des chauffeurs</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <FiRefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
          >
            <FiPlus size={18} />
            Planifier un trajet
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Planifiés', value: countByStatus('PLANIFIEE'), icon: FiCalendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'En cours', value: countByStatus('EN_COURS'), icon: FiPlay, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Terminés', value: countByStatus('COMPLETEE'), icon: FiCheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total semaine', value: applyFilter(trips).length, icon: FiNavigation, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon size={22} className={card.color} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher chauffeur, bus, ligne..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Chauffeur / Bus</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ligne</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date prévue</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Départ réel</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Passagers</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Durée</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <FiRefreshCw size={24} className="mx-auto mb-2 animate-spin" />
                  Chargement...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <FiCalendar size={40} className="mx-auto mb-3 opacity-30" />
                  <div className="font-medium">Aucun trajet</div>
                  <div className="text-sm mt-1">Planifiez un nouveau trajet avec le bouton ci-dessus</div>
                </td></tr>
              ) : filtered.map(trip => (
                <tr key={trip.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{trip.driver_nom || '—'}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <FiTruck size={11} />
                      {trip.bus_numero ? `Bus ${trip.bus_numero}` : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{trip.ligne_nom || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {trip.date_planifiee ? (
                      <div className="flex items-center gap-1.5 text-indigo-700 font-medium">
                        <FiCalendar size={13} />
                        {formatDate(trip.date_planifiee)}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(trip.date_debut)}</td>
                  <td className="px-4 py-3"><StatusBadge statut={trip.statut} /></td>
                  <td className="px-4 py-3">
                    {trip.nombre_passagers > 0 ? (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <FiUsers size={13} />
                        {trip.nombre_passagers}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {trip.duree_reelle_secondes > 0 ? (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <FiClock size={13} />
                        {formatDuration(trip.duree_reelle_secondes)}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trip.statut === 'PLANIFIEE' && (
                      <button
                        onClick={() => handleCancel(trip)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                    {trip.statut === 'EN_COURS' && (
                      <span className="flex items-center justify-end gap-1 text-green-600 text-xs font-semibold">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            {filtered.length} trajet{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Plan Trip Modal */}
      {showModal && (
        <PlanTripModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAll(); }}
          drivers={drivers}
          buses={buses}
          lines={lines}
        />
      )}
    </div>
  );
}
