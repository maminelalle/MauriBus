import { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiPause, FiPlay, FiUsers, FiStar, FiX } from 'react-icons/fi';
import { driverAPI, ratingAdminAPI } from '../utils/api';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  nni: '',
  adresse: '',
  numero_permis: '',
  date_expiration_permis: '',
  statut: 'ACTIF',
};

function cleanPayload(data) {
  const payload = { ...data };
  // Convert empty strings to null for optional fields
  if (!payload.date_expiration_permis) delete payload.date_expiration_permis;
  if (!payload.numero_permis) delete payload.numero_permis;
  if (!payload.adresse) delete payload.adresse;
  return payload;
}

function StarDisplay({ note }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={13}
          className={s <= Math.round(note) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          style={s <= Math.round(note) ? { fill: 'currentColor' } : {}}
        />
      ))}
    </span>
  );
}

export function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [ratingsMap, setRatingsMap] = useState({});       // driverId → { avg, count }
  const [ratingsModal, setRatingsModal] = useState(null); // driver object
  const [driverRatings, setDriverRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => { fetchDrivers(); fetchAllRatings(); }, []);

  const fetchDrivers = async () => {
    try {
      const res = await driverAPI.list();
      setDrivers(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement des chauffeurs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRatings = async () => {
    try {
      const res = await ratingAdminAPI.list();
      const list = res.data.ratings || res.data.results || res.data;
      // Group by driver
      const map = {};
      list.forEach((r) => {
        const did = r.chauffeur?.id;
        if (!did) return;
        if (!map[did]) map[did] = { total: 0, count: 0 };
        map[did].total += r.note;
        map[did].count += 1;
      });
      const avgMap = {};
      Object.entries(map).forEach(([id, v]) => {
        avgMap[id] = { avg: v.total / v.count, count: v.count };
      });
      setRatingsMap(avgMap);
    } catch {
      // non-blocking
    }
  };

  const openRatings = async (driver) => {
    setRatingsModal(driver);
    setLoadingRatings(true);
    setDriverRatings([]);
    try {
      const res = await ratingAdminAPI.list({ driver_id: driver.id });
      setDriverRatings(res.data.ratings || res.data.results || res.data);
    } catch {
      toast.error('Erreur chargement des avis');
    } finally {
      setLoadingRatings(false);
    }
  };

  const openAdd = () => {
    setEditingDriver(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      prenom: driver.prenom || '',
      nom: driver.nom || '',
      email: driver.email || '',
      telephone: driver.telephone || '',
      nni: driver.nni || '',
      adresse: driver.adresse || '',
      numero_permis: driver.numero_permis || '',
      date_expiration_permis: driver.date_expiration_permis || '',
      statut: driver.statut || 'ACTIF',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = cleanPayload(formData);
    try {
      if (editingDriver) {
        await driverAPI.update(editingDriver.id, payload);
        toast.success('Chauffeur mis à jour');
      } else {
        await driverAPI.create(payload);
        toast.success('Chauffeur créé avec succès');
      }
      setShowModal(false);
      fetchDrivers();
    } catch (error) {
      const err = error.response?.data;
      const msg = err?.detail || err?.email?.[0] || err?.nni?.[0] || err?.telephone?.[0] || 'Erreur lors de la sauvegarde';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce chauffeur ?')) return;
    try {
      await driverAPI.delete(id);
      toast.success('Chauffeur supprimé');
      fetchDrivers();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSuspend = async (driver) => {
    try {
      if (driver.statut === 'ACTIF') {
        await driverAPI.suspend(driver.id);
        toast.success('Chauffeur suspendu');
      } else {
        await driverAPI.update(driver.id, { statut: 'ACTIF' });
        toast.success('Chauffeur activé');
      }
      fetchDrivers();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const f = (k) => (e) => setFormData({ ...formData, [k]: e.target.value });

  const filtered = drivers.filter(
    (d) =>
      `${d.prenom} ${d.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.telephone?.includes(searchTerm)
  );

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Gestion Chauffeurs</h1>
          <p className="text-gray-600 mt-1">{drivers.length} chauffeur(s) enregistré(s)</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={20} /> Ajouter Chauffeur
        </button>
      </div>

      {/* Recherche */}
      <div className="card">
        <div className="flex items-center gap-3">
          <FiSearch className="text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, matricule, téléphone..."
            className="input border-0 bg-transparent placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Matricule</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom complet</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Téléphone</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">En ligne</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Note</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  <FiUsers size={40} className="mx-auto mb-2 opacity-40" />
                  Aucun chauffeur trouvé
                </td>
              </tr>
            ) : (
              filtered.map((driver) => {
                const rating = ratingsMap[driver.id];
                return (
                  <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text-dark">{driver.matricule}</td>
                    <td className="px-4 py-3">{driver.prenom} {driver.nom}</td>
                    <td className="px-4 py-3 text-gray-600">{driver.telephone}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{driver.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full ${driver.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="ml-2 text-sm text-gray-600">{driver.is_online ? 'Oui' : 'Non'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {rating ? (
                        <button
                          onClick={() => openRatings(driver)}
                          className="flex items-center gap-1 hover:opacity-70 transition"
                          title="Voir les avis"
                        >
                          <StarDisplay note={rating.avg} />
                          <span className="text-xs text-gray-500 ml-1">({rating.count})</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge badge-${driver.statut === 'ACTIF' ? 'success' : driver.statut === 'SUSPENDU' ? 'danger' : 'warning'}`}>
                        {driver.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(driver)} title="Modifier" className="p-2 hover:bg-gray-200 rounded transition">
                        <FiEdit2 className="text-primary-light" size={18} />
                      </button>
                      <button onClick={() => handleSuspend(driver)} title={driver.statut === 'ACTIF' ? 'Suspendre' : 'Activer'} className="p-2 hover:bg-gray-200 rounded transition">
                        {driver.statut === 'ACTIF'
                          ? <FiPause className="text-warning" size={18} />
                          : <FiPlay className="text-success" size={18} />}
                      </button>
                      <button onClick={() => handleDelete(driver.id)} title="Supprimer" className="p-2 hover:bg-gray-200 rounded transition">
                        <FiTrash2 className="text-danger" size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Avis Chauffeur */}
      {ratingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Avis — {ratingsModal.prenom} {ratingsModal.nom}</h2>
                {ratingsMap[ratingsModal.id] && (
                  <div className="flex items-center gap-2 mt-1">
                    <StarDisplay note={ratingsMap[ratingsModal.id].avg} />
                    <span className="text-sm text-gray-600">
                      {ratingsMap[ratingsModal.id].avg.toFixed(1)} / 5 · {ratingsMap[ratingsModal.id].count} avis
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => setRatingsModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <FiX size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {loadingRatings ? (
                <p className="text-center text-gray-400 py-8">Chargement...</p>
              ) : driverRatings.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun avis pour ce chauffeur</p>
              ) : (
                driverRatings.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <StarDisplay note={r.note} />
                      <span className="text-xs text-gray-400">
                        {new Date(r.date_creation).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Par : <span className="font-medium text-gray-700">{r.citoyen || '—'}</span>
                    </p>
                    {r.commentaire && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{r.commentaire}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter / Modifier */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">{editingDriver ? 'Modifier Chauffeur' : 'Ajouter Chauffeur'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prénom</label>
                  <input type="text" value={formData.prenom} onChange={f('prenom')} className="input" required />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input type="text" value={formData.nom} onChange={f('nom')} className="input" required />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input type="email" value={formData.email} onChange={f('email')} className="input" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Téléphone</label>
                  <input type="tel" value={formData.telephone} onChange={f('telephone')} className="input" required />
                </div>
                <div>
                  <label className="label">NNI</label>
                  <input type="text" value={formData.nni} onChange={f('nni')} className="input" required />
                </div>
              </div>

              <div>
                <label className="label">Adresse <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <input type="text" value={formData.adresse} onChange={f('adresse')} className="input" placeholder="Adresse du chauffeur" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">N° Permis <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input type="text" value={formData.numero_permis} onChange={f('numero_permis')} className="input" />
                </div>
                <div>
                  <label className="label">Expiration permis <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input type="date" value={formData.date_expiration_permis} onChange={f('date_expiration_permis')} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Statut</label>
                <select value={formData.statut} onChange={f('statut')} className="input">
                  <option value="ACTIF">Actif</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="CONGE">En Congé</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-outline">Annuler</button>
                <button type="submit" className="flex-1 btn btn-primary">{editingDriver ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
