import { useEffect, useState } from 'react';
import { FiSend, FiUsers, FiUser, FiTrash2, FiBell, FiPlus, FiX, FiSmartphone } from 'react-icons/fi';
import { notificationAPI, driverAPI, notifExtAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const QUICK_MESSAGES = [
  { label: 'Congé demain', msg: 'Attention : demain est un jour de congé. Aucun service ne sera assuré.' },
  { label: 'Aide en route', msg: 'Votre signalement a bien été reçu. Une équipe d\'assistance est en route vers vous.' },
  { label: 'Réunion obligatoire', msg: 'Convocation obligatoire au dépôt ce soir à 18h. Présence requise.' },
  { label: 'Maintenance dépôt', msg: 'Le dépôt sera en maintenance demain matin. Garez vos bus avant 20h ce soir.' },
  { label: 'Bonne fête', msg: 'L\'équipe MauriBus vous souhaite une excellente fête. Soyez prudents sur les routes.' },
  { label: 'Urgence météo', msg: 'Alerte météo : pluies importantes prévues. Réduisez la vitesse et soyez vigilants.' },
];

const CIBLE_OPTIONS = [
  { value: 'CHAUFFEURS', label: 'Tous les chauffeurs', color: 'blue' },
  { value: 'CITOYENS', label: 'Tous les citoyens', color: 'emerald' },
  { value: 'TOUS', label: 'Tout le monde (chauffeurs + citoyens)', color: 'purple' },
  { value: 'INDIVIDUEL_CHAUFFEUR', label: 'Chauffeur spécifique', color: 'orange' },
];

const EMPTY_FORM = {
  titre: '',
  message: '',
  cible: 'CHAUFFEURS',
  destinataire_id: '',
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [notifRes, drvRes] = await Promise.all([
        notificationAPI.list(),
        driverAPI.list(),
      ]);
      setNotifications(notifRes.data.results || notifRes.data);
      setDrivers(drvRes.data.results || drvRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const payload = {
        titre: formData.titre,
        message: formData.message,
        cible: formData.cible,
      };
      if (formData.cible === 'INDIVIDUEL_CHAUFFEUR') {
        if (!formData.destinataire_id) {
          toast.error('Veuillez choisir un chauffeur');
          setSending(false);
          return;
        }
        payload.destinataire_id = formData.destinataire_id;
      }
      await notifExtAPI.send(payload);
      toast.success('Message envoyé avec succès');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await notificationAPI.delete(id);
      toast.success('Message supprimé');
      fetchAll();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const useQuickMessage = (qm) => {
    setFormData((prev) => ({ ...prev, titre: qm.label, message: qm.msg }));
  };

  const f = (k) => (e) => setFormData((prev) => ({ ...prev, [k]: e.target.value }));

  if (isLoading) return <div className="p-8">Chargement...</div>;

  const broadcastCount = notifications.filter((n) => n.type_notification === 'BROADCAST' && !n.envoye_par?.endsWith('_CITOYENS')).length;
  const citizenCount = notifications.filter((n) => n.envoye_par?.endsWith('_CITOYENS')).length;
  const indivCount = notifications.filter((n) => n.type_notification === 'INDIVIDUEL').length;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Messages &amp; Notifications</h1>
          <p className="text-gray-600 mt-1">
            {notifications.length} messages — {broadcastCount} chauffeurs, {citizenCount} citoyens, {indivCount} individuels
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={20} /> Nouveau message
        </button>
      </div>

      {/* Quick Send Shortcuts */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <FiBell size={16} /> Envoi rapide (diffusion à tous les chauffeurs)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {QUICK_MESSAGES.map((qm, i) => (
            <button
              key={i}
              onClick={() => { setFormData({ titre: qm.label, message: qm.msg, cible: 'CHAUFFEURS', destinataire_id: '' }); setShowModal(true); }}
              className="text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm transition"
            >
              <span className="font-medium text-blue-700">{qm.label}</span>
              <span className="block text-xs text-gray-500 truncate mt-0.5">{qm.msg.slice(0, 50)}…</span>
            </button>
          ))}
        </div>
      </div>

      {/* Historique */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          Historique des messages
        </h2>
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiBell size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aucun message envoyé pour l&apos;instant</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  n.type_notification === 'INDIVIDUEL'
                    ? 'border-orange-200 bg-orange-50'
                    : n.envoye_par?.endsWith('_CITOYENS')
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className={`mt-1 p-2 rounded-full ${
                  n.type_notification === 'INDIVIDUEL'
                    ? 'bg-orange-100 text-orange-600'
                    : n.envoye_par?.endsWith('_CITOYENS')
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {n.type_notification === 'INDIVIDUEL'
                    ? <FiUser size={16} />
                    : n.envoye_par?.endsWith('_CITOYENS')
                    ? <FiSmartphone size={16} />
                    : <FiUsers size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{n.titre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      n.type_notification === 'INDIVIDUEL'
                        ? 'bg-orange-200 text-orange-700'
                        : n.envoye_par?.endsWith('_CITOYENS')
                        ? 'bg-emerald-200 text-emerald-700'
                        : 'bg-blue-200 text-blue-700'
                    }`}>
                      {n.type_notification === 'INDIVIDUEL'
                        ? `→ ${n.destinataire_nom || 'Chauffeur'}`
                        : n.envoye_par?.endsWith('_CITOYENS')
                        ? 'Tous les citoyens'
                        : 'Tous les chauffeurs'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Envoyé par {n.envoye_par || 'Admin'} — {new Date(n.date_creation).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 hover:bg-red-100 rounded text-red-400 hover:text-red-600 transition"
                  title="Supprimer"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Nouveau message ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiSend size={20} className="text-primary-light" /> Nouveau message
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Suggestions rapides */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Choisir un modèle :</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_MESSAGES.map((qm, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => useQuickMessage(qm)}
                      className="text-left text-xs px-2 py-1.5 bg-gray-100 hover:bg-blue-100 rounded border border-gray-200 transition truncate"
                    >
                      {qm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Titre du message</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={f('titre')}
                  className="input"
                  placeholder="Ex: Congé demain, Urgence, Réunion..."
                  required
                />
              </div>

              <div>
                <label className="label">Destinataires</label>
                <select value={formData.cible} onChange={f('cible')} className="input">
                  {CIBLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {formData.cible === 'INDIVIDUEL_CHAUFFEUR' && (
                <div>
                  <label className="label">Choisir le chauffeur</label>
                  <select value={formData.destinataire_id} onChange={f('destinataire_id')} className="input" required>
                    <option value="">— Choisir un chauffeur —</option>
                    {drivers
                      .filter((d) => d.statut === 'ACTIF')
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.prenom} {d.nom} ({d.matricule})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Message</label>
                <textarea
                  value={formData.message}
                  onChange={f('message')}
                  className="input"
                  rows={4}
                  placeholder="Rédigez votre message ici..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-outline">
                  Annuler
                </button>
                <button type="submit" disabled={sending} className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                  <FiSend size={16} />
                  {sending ? 'Envoi...' : formData.cible === 'TOUS' ? 'Diffuser à tous' : formData.cible === 'INDIVIDUEL_CHAUFFEUR' ? 'Envoyer au chauffeur' : 'Diffuser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
