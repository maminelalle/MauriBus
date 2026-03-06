import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FiAlertTriangle, FiRefreshCw, FiCheck, FiFilter,
  FiWifi, FiZap, FiClock, FiUser, FiTool,
} from 'react-icons/fi';
import api from '../utils/api';

const ALERT_CONFIG = {
  BUS_ARRETE_LONGTEMPS:  { label: 'Bus arrêté longtemps', icon: FiClock,         color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  VITESSE_EXCESSIVE:     { label: 'Vitesse excessive',    icon: FiZap,           color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  GPS_PERDU:             { label: 'GPS perdu',            icon: FiWifi,          color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  CHAUFFEUR_INACTIF:     { label: 'Chauffeur inactif',    icon: FiUser,          color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  MAINTENANCE_DUE:       { label: 'Maintenance due',      icon: FiTool,          color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ANOMALIE_PAIEMENT:     { label: 'Anomalie paiement',    icon: FiAlertTriangle, color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200' },
};

const DEFAULT_CFG = { label: 'Alerte', icon: FiAlertTriangle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function SystemAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [resolving, setResolving] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system-alerts/', { params: { active: !showAll } });
      setAlerts(res.data.alerts || []);
    } catch {
      toast.error('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      await api.patch(`/admin/system-alerts/${id}/resolve/`);
      toast.success('Alerte résolue');
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      toast.error('Impossible de résoudre l\'alerte');
    } finally {
      setResolving(null);
    }
  };

  const activeCount = alerts.filter(a => a.est_actif).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" />
            Alertes Système
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount > 0
              ? `${activeCount} alerte${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''}`
              : 'Aucune alerte active'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
              className="rounded"
            />
            Afficher toutes (inclus résolues)
          </label>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats row */}
      {Object.entries(ALERT_CONFIG).map(([key, cfg]) => {
        const count = alerts.filter(a => a.type_alerte === key && a.est_actif).length;
        if (!count) return null;
        const Icon = cfg.icon;
        return (
          <div key={key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mr-2 mb-4 ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
            <Icon size={12} />
            {cfg.label}: {count}
          </div>
        );
      })}

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck size={28} className="text-green-500" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Aucune alerte{showAll ? '' : ' active'}</p>
          <p className="text-sm text-gray-500 mt-1">Tout fonctionne normalement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const cfg = ALERT_CONFIG[alert.type_alerte] || DEFAULT_CFG;
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-5 flex items-start gap-4 transition-all ${
                  alert.est_actif ? `${cfg.border} shadow-sm` : 'border-gray-100 opacity-60'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <p className="text-sm text-gray-800 font-medium mt-0.5">{alert.description}</p>
                    </div>
                    {alert.est_actif && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                          Active
                        </span>
                      </div>
                    )}
                    {!alert.est_actif && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                        <FiCheck size={10} />
                        Résolue
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {alert.bus && (
                      <span className="text-xs text-gray-500">🚌 Bus {alert.bus.numero_bus}</span>
                    )}
                    {alert.chauffeur && (
                      <span className="text-xs text-gray-500">👤 {alert.chauffeur}</span>
                    )}
                    <span className="text-xs text-gray-400">Créée: {formatDate(alert.date_creation)}</span>
                    {alert.date_resolution && (
                      <span className="text-xs text-green-600">Résolue: {formatDate(alert.date_resolution)}</span>
                    )}
                  </div>
                </div>

                {/* Resolve button */}
                {alert.est_actif && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolving === alert.id}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors border border-green-200"
                  >
                    {resolving === alert.id
                      ? <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      : <FiCheck size={14} />}
                    Résoudre
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
