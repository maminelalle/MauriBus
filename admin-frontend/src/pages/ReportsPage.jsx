import { useEffect, useState } from 'react';
import {
  FiSearch, FiCheck, FiX, FiEye, FiAlertTriangle,
  FiMessageSquare, FiBookOpen, FiClock,
} from 'react-icons/fi';
import { reportAPI } from '../utils/api';
import { toast } from 'react-toastify';

const STATUS_INFO = {
  NOUVEAU: { label: 'Nouveau', cls: 'badge-warning' },
  EN_COURS: { label: 'En cours', cls: 'badge-primary' },
  RESOLU: { label: 'Résolu', cls: 'badge-success' },
  REJETE: { label: 'Rejeté', cls: 'badge-danger' },
};

const PRIORITY_INFO = {
  BASSE: { label: 'Basse', cls: 'text-gray-500' },
  NORMALE: { label: 'Normale', cls: 'text-blue-500' },
  HAUTE: { label: 'Haute', cls: 'text-orange-500' },
  CRITIQUE: { label: 'Critique', cls: 'text-red-600 font-bold' },
};

const TYPE_LABELS = {
  ACCIDENT: '🚨 Accident',
  PANNE_MECANIQUE: '🔧 Panne Mécanique',
  INCIDENT_ROUTE: '⚠️ Incident Route',
  PLAINTE_PASSAGER: '👤 Plainte Passager',
  PERTE_OBJET: '📦 Perte Objet',
  AUTRE: '📋 Autre',
};

// Quick reply templates
const TEMPLATES = [
  'Nous avons bien reçu votre signalement. Une équipe est en route.',
  'Merci pour l\'information. Restez sur place, les secours arrivent.',
  'Signalement pris en compte. Veuillez contacter le centre au plus vite.',
  'Demain est un jour de congé. Aucun service ne sera assuré.',
  'Maintenance programmée. Garez le bus et attendez les instructions.',
  'Incident noté. Continuez le trajet si possible.',
];

export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterPriorite, setFilterPriorite] = useState('');

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [resolveNote, setResolveNote] = useState('');

  useEffect(() => { fetchReports(); }, [filterStatut, filterPriorite]); // eslint-disable-line

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterPriorite) params.priorite = filterPriorite;
      const res = await reportAPI.list(params);
      setReports(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement des signalements');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
    // mark as read if not already
    if (!report.lu) {
      try {
        await reportAPI.markRead(report.id);
        setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, lu: true } : r));
      } catch { /* non-blocking */ }
    }
  };

  const openReply = (report) => {
    setSelectedReport(report);
    setReplyText(report.reponse_admin || '');
    setShowReplyModal(true);
  };

  const openResolve = (report) => {
    setSelectedReport(report);
    setResolveNote('');
    setShowResolveModal(true);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    try {
      await reportAPI.reply(selectedReport.id, { reponse: replyText });
      toast.success('Réponse envoyée au chauffeur');
      setShowReplyModal(false);
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'envoi');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await reportAPI.resolve(selectedReport.id, { notes_resolution: resolveNote });
      toast.success('Signalement marqué comme résolu');
      setShowResolveModal(false);
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleReject = async (report) => {
    if (!window.confirm('Rejeter ce signalement ?')) return;
    try {
      await reportAPI.reject(report.id);
      toast.success('Signalement rejeté');
      fetchReports();
    } catch {
      toast.error('Erreur lors du rejet');
    }
  };

  const filtered = reports.filter(
    (r) =>
      r.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.chauffeur_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type_signalement?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8">Chargement...</div>;

  const criticalCount = reports.filter((r) => r.priorite === 'CRITIQUE' && r.statut !== 'RESOLU').length;
  const newCount = reports.filter((r) => r.statut === 'NOUVEAU').length;
  const unreadCount = reports.filter((r) => !r.lu).length;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Signalements</h1>
          <p className="text-gray-600 mt-1">
            {newCount} nouveaux &mdash; {criticalCount} critiques &mdash;
            {unreadCount > 0 && (
              <span className="ml-1 text-orange-500 font-medium">{unreadCount} non lus</span>
            )}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-3 flex-1">
            <FiSearch className="text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, chauffeur ou type..."
              className="input border-0 bg-transparent placeholder-gray-500 flex-1"
            />
          </div>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="input w-auto">
            <option value="">Tous les statuts</option>
            <option value="NOUVEAU">Nouveau</option>
            <option value="EN_COURS">En cours</option>
            <option value="RESOLU">Résolu</option>
            <option value="REJETE">Rejeté</option>
          </select>
          <select value={filterPriorite} onChange={(e) => setFilterPriorite(e.target.value)} className="input w-auto">
            <option value="">Toutes priorités</option>
            <option value="CRITIQUE">Critique</option>
            <option value="HAUTE">Haute</option>
            <option value="NORMALE">Normale</option>
            <option value="BASSE">Basse</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Titre</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Chauffeur</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Priorité</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <FiAlertTriangle size={40} className="mx-auto mb-2 opacity-40" />
                  Aucun signalement trouvé
                </td>
              </tr>
            ) : (
              filtered.map((report) => {
                const statusInfo = STATUS_INFO[report.statut] || { label: report.statut, cls: 'badge-warning' };
                const priorityInfo = PRIORITY_INFO[report.priorite] || { label: report.priorite, cls: '' };
                const isUnread = !report.lu;
                return (
                  <tr
                    key={report.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${isUnread ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {TYPE_LABELS[report.type_signalement] || report.type_signalement}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className={`font-medium text-text-dark ${isUnread ? 'font-bold' : ''}`}>
                        {isUnread && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 align-middle" />}
                        {report.titre}
                      </span>
                      {report.reponse_admin && (
                        <span className="block text-xs text-green-600 mt-0.5">Répondu</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{report.chauffeur_nom || '—'}</td>
                    <td className={`px-4 py-3 text-sm ${priorityInfo.cls}`}>{priorityInfo.label}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {new Date(report.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(report)}
                          title="Voir détails"
                          className="p-2 hover:bg-gray-200 rounded transition text-gray-600"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => openReply(report)}
                          title="Répondre"
                          className="p-2 hover:bg-blue-100 rounded transition text-blue-600"
                        >
                          <FiMessageSquare size={16} />
                        </button>
                        {(report.statut === 'NOUVEAU' || report.statut === 'EN_COURS') && (
                          <button
                            onClick={() => openResolve(report)}
                            title="Marquer résolu"
                            className="p-2 hover:bg-green-100 rounded transition text-green-600"
                          >
                            <FiCheck size={16} />
                          </button>
                        )}
                        {report.statut === 'NOUVEAU' && (
                          <button
                            onClick={() => handleReject(report)}
                            title="Rejeter"
                            className="p-2 hover:bg-red-100 rounded transition text-red-500"
                          >
                            <FiX size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Détails ── */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Détails Signalement</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span>{TYPE_LABELS[selectedReport.type_signalement] || selectedReport.type_signalement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Titre:</span>
                <span className="font-medium">{selectedReport.titre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chauffeur:</span>
                <span>{selectedReport.chauffeur_nom || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Priorité:</span>
                <span className={PRIORITY_INFO[selectedReport.priorite]?.cls || ''}>
                  {PRIORITY_INFO[selectedReport.priorite]?.label || selectedReport.priorite}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut:</span>
                <span className={`badge ${STATUS_INFO[selectedReport.statut]?.cls || 'badge-warning'}`}>
                  {STATUS_INFO[selectedReport.statut]?.label || selectedReport.statut}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{new Date(selectedReport.date_creation).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lu:</span>
                <span>{selectedReport.lu ? '✅ Oui' : '🔵 Non'}</span>
              </div>
              {selectedReport.description && (
                <div className="pt-2 border-t">
                  <p className="text-gray-500 text-sm mb-1">Description:</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedReport.description}</p>
                </div>
              )}
              {selectedReport.reponse_admin && (
                <div className="pt-2 border-t">
                  <p className="text-gray-500 text-sm mb-1">Réponse admin:</p>
                  <p className="text-sm bg-green-50 border border-green-200 p-3 rounded text-green-800">
                    {selectedReport.reponse_admin}
                  </p>
                </div>
              )}
              {selectedReport.notes_resolution && (
                <div className="pt-2 border-t">
                  <p className="text-gray-500 text-sm mb-1">Notes de résolution:</p>
                  <p className="text-sm">{selectedReport.notes_resolution}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setShowDetailModal(false); openReply(selectedReport); }}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              >
                <FiMessageSquare size={16} /> Répondre
              </button>
              {(selectedReport.statut === 'NOUVEAU' || selectedReport.statut === 'EN_COURS') && (
                <button
                  onClick={() => { setShowDetailModal(false); openResolve(selectedReport); }}
                  className="flex-1 btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FiCheck size={16} /> Résoudre
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Répondre ── */}
      {showReplyModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                  <FiMessageSquare size={20} /> Répondre au signalement
                </h2>
                <p className="text-sm text-gray-500 mt-1 truncate">{selectedReport.titre}</p>
                <p className="text-xs text-gray-400">Chauffeur : {selectedReport.chauffeur_nom || '—'}</p>
              </div>
              <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleReply} className="p-6 space-y-4">
              {/* Quick templates */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Réponses rapides :</p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReplyText(t)}
                      className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Message personnalisé</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Tapez votre message au chauffeur..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReplyModal(false)} className="flex-1 btn btn-outline">
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                  <FiMessageSquare size={16} /> Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Résolution ── */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-green-600 flex items-center gap-2">
                <FiCheck size={20} /> Résoudre le signalement
              </h2>
              <p className="text-sm text-gray-600 mt-1 truncate">{selectedReport.titre}</p>
            </div>
            <form onSubmit={handleResolve} className="p-6 space-y-4">
              <div>
                <label className="label">Notes de résolution</label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Décrivez les actions prises..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowResolveModal(false)} className="flex-1 btn btn-outline">
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn bg-green-600 text-white hover:bg-green-700">
                  Marquer Résolu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
