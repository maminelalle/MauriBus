import { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiTruck } from 'react-icons/fi';
import { busAPI, driverAPI } from '../utils/api';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  numero_bus: '',
  plaque: '',
  numero_bankily: '',
  capacite: 30,
  marque: '',
  modele: '',
  annee_fabrication: new Date().getFullYear(),
  statut: 'ACTIF',
  chauffeur: '',
  // ligne is assigned from the Lines page
};

export function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [busRes, driverRes] = await Promise.all([
        busAPI.list(),
        driverAPI.list(),
      ]);
      setBuses(busRes.data.results || busRes.data);
      setDrivers(driverRes.data.results || driverRes.data);
    } catch {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setEditingBus(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (bus) => {
    setEditingBus(bus);
    setFormData({
      numero_bus: bus.numero_bus || '',
      plaque: bus.plaque || '',
      numero_bankily: bus.numero_bankily || '',
      capacite: bus.capacite || 30,
      marque: bus.marque || '',
      modele: bus.modele || '',
      annee_fabrication: bus.annee_fabrication || new Date().getFullYear(),
      statut: bus.statut || 'ACTIF',
      chauffeur: bus.chauffeur || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.chauffeur) delete payload.chauffeur;
      if (!payload.numero_bankily) delete payload.numero_bankily;

      if (editingBus) {
        await busAPI.update(editingBus.id, payload);
        toast.success('Bus mis à jour avec succès');
      } else {
        await busAPI.create(payload);
        toast.success('Bus créé avec succès');
      }
      setShowModal(false);
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bus ?')) return;
    try {
      await busAPI.delete(id);
      toast.success('Bus supprimé');
      fetchAll();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredBuses = buses.filter(
    (b) =>
      b.numero_bus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.plaque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.marque?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor = {
    ACTIF: 'badge-success',
    INACTIF: 'badge-warning',
    MAINTENANCE: 'badge-danger',
    HORS_SERVICE: 'badge-danger',
  };

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Gestion des Bus</h1>
          <p className="text-gray-600 mt-1">{buses.length} bus enregistrés</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={20} />
          Ajouter Bus
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
            placeholder="Rechercher par numéro, plaque ou marque..."
            className="input border-0 bg-transparent placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Numéro</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Plaque</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Marque / Modèle</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Capacité</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Chauffeur</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <FiTruck size={40} className="mx-auto mb-2 opacity-40" />
                  Aucun bus trouvé
                </td>
              </tr>
            ) : (
              filteredBuses.map((bus) => (
                <tr key={bus.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-text-dark">{bus.numero_bus}</td>
                  <td className="px-4 py-3">{bus.plaque}</td>
                  <td className="px-4 py-3 text-gray-600">{bus.marque} {bus.modele}</td>
                  <td className="px-4 py-3 text-gray-600">{bus.capacite} places</td>
                  <td className="px-4 py-3 text-gray-600">{bus.chauffeur_nom || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColor[bus.statut] || 'badge-warning'}`}>
                      {bus.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openEdit(bus)} className="p-2 hover:bg-gray-200 rounded transition">
                      <FiEdit2 className="text-primary-light" size={18} />
                    </button>
                    <button onClick={() => handleDelete(bus.id)} className="p-2 hover:bg-gray-200 rounded transition">
                      <FiTrash2 className="text-danger" size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter/Éditer Bus */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">{editingBus ? 'Modifier Bus' : 'Ajouter Bus'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Numéro Bus</label>
                  <input
                    type="text"
                    value={formData.numero_bus}
                    onChange={(e) => setFormData({ ...formData, numero_bus: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Plaque</label>
                  <input
                    type="text"
                    value={formData.plaque}
                    onChange={(e) => setFormData({ ...formData, plaque: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Numéro Bankily</label>
                <input
                  type="text"
                  value={formData.numero_bankily}
                  onChange={(e) => setFormData({ ...formData, numero_bankily: e.target.value })}
                  className="input"
                  placeholder="Ex: 22XXXXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Marque</label>
                  <input
                    type="text"
                    value={formData.marque}
                    onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Modèle</label>
                  <input
                    type="text"
                    value={formData.modele}
                    onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Capacité (places)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.capacite}
                    onChange={(e) => setFormData({ ...formData, capacite: parseInt(e.target.value) })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Année de fabrication</label>
                  <input
                    type="number"
                    min={1990}
                    max={new Date().getFullYear()}
                    value={formData.annee_fabrication}
                    onChange={(e) => setFormData({ ...formData, annee_fabrication: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Statut</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  className="input"
                >
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="HORS_SERVICE">Hors Service</option>
                </select>
              </div>

              <div>
                <label className="label">Chauffeur assigné</label>
                <select
                  value={formData.chauffeur}
                  onChange={(e) => setFormData({ ...formData, chauffeur: e.target.value })}
                  className="input"
                >
                  <option value="">— Aucun chauffeur —</option>
                  {drivers
                    .filter((d) => d.statut === 'ACTIF')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.prenom} {d.nom} ({d.matricule})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Un chauffeur ne peut être assigné qu'à un seul bus.</p>
              </div>
              <p className="text-xs text-blue-500">
                💡 L'assignation d'une ligne se fait depuis la page <strong>Lignes</strong>.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingBus ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
