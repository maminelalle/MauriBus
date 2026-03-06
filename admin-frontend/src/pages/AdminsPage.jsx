import { useEffect, useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiShield, FiPause, FiPlay } from 'react-icons/fi';
import { adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  nni: '',
  role: 'ADMIN',
  statut: 'ACTIF',
  password: '',
};

const ROLE_INFO = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'badge-danger' },
  ADMIN: { label: 'Admin', cls: 'badge-primary' },
  MODERATOR: { label: 'Modérateur', cls: 'badge-warning' },
};

export function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await adminAPI.list();
      setAdmins(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement des administrateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setEditingAdmin(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      nom: admin.nom || '',
      prenom: admin.prenom || '',
      email: admin.email || '',
      telephone: admin.telephone || '',
      nni: admin.nni || '',
      role: admin.role || 'ADMIN',
      statut: admin.statut || 'ACTIF',
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      if (editingAdmin) {
        await adminAPI.update(editingAdmin.id, payload);
        toast.success('Administrateur mis à jour');
      } else {
        if (!payload.password) {
          toast.error('Le mot de passe est requis pour créer un admin');
          return;
        }
        await adminAPI.create(payload);
        toast.success('Administrateur créé avec succès');
      }
      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      const err = error.response?.data;
      const msg = err?.detail || err?.email?.[0] || err?.nni?.[0] || 'Erreur lors de la sauvegarde';
      toast.error(msg);
    }
  };

  const handleDelete = async (admin) => {
    if (admin.id === user?.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    if (!window.confirm(`Supprimer ${admin.prenom} ${admin.nom} ?`)) return;
    try {
      await adminAPI.delete(admin.id);
      toast.success('Administrateur supprimé');
      fetchAdmins();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (admin) => {
    if (admin.id === user?.id) {
      toast.error('Vous ne pouvez pas modifier votre propre statut');
      return;
    }
    try {
      if (admin.statut === 'ACTIF') {
        await adminAPI.suspend(admin.id);
        toast.success('Administrateur suspendu');
      } else {
        await adminAPI.activate(admin.id);
        toast.success('Administrateur activé');
      }
      fetchAdmins();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const filtered = admins.filter(
    (a) =>
      a.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Gestion des Admins</h1>
          <p className="text-gray-600 mt-1">{admins.length} administrateur(s) enregistré(s)</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={20} />
          Ajouter Admin
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
            placeholder="Rechercher par nom, matricule ou email..."
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
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Téléphone</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Rôle</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <FiShield size={40} className="mx-auto mb-2 opacity-40" />
                  Aucun administrateur trouvé
                </td>
              </tr>
            ) : (
              filtered.map((admin) => {
                const roleInfo = ROLE_INFO[admin.role] || { label: admin.role, cls: 'badge-warning' };
                const isSelf = admin.id === user?.id;
                return (
                  <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text-dark">{admin.matricule}</td>
                    <td className="px-4 py-3">
                      {admin.prenom} {admin.nom}
                      {isSelf && (
                        <span className="ml-2 text-xs text-primary-light font-medium">(vous)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                    <td className="px-4 py-3 text-gray-600">{admin.telephone}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${roleInfo.cls}`}>{roleInfo.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${admin.statut === 'ACTIF' ? 'badge-success' : 'badge-danger'}`}>
                        {admin.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(admin)}
                        title="Modifier"
                        className="p-2 hover:bg-gray-200 rounded transition"
                      >
                        <FiEdit2 className="text-primary-light" size={18} />
                      </button>
                      {!isSelf && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            title={admin.statut === 'ACTIF' ? 'Suspendre' : 'Activer'}
                            className="p-2 hover:bg-gray-200 rounded transition"
                          >
                            {admin.statut === 'ACTIF'
                              ? <FiPause className="text-warning" size={18} />
                              : <FiPlay className="text-success" size={18} />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(admin)}
                            title="Supprimer"
                            className="p-2 hover:bg-gray-200 rounded transition"
                          >
                            <FiTrash2 className="text-danger" size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">
                {editingAdmin ? 'Modifier Administrateur' : 'Ajouter Administrateur'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Téléphone</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">NNI</label>
                  <input
                    type="text"
                    value={formData.nni}
                    onChange={(e) => setFormData({ ...formData, nni: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MODERATOR">Modérateur</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="input"
                  >
                    <option value="ACTIF">Actif</option>
                    <option value="SUSPENDU">Suspendu</option>
                    <option value="INACTIF">Inactif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  Mot de passe {editingAdmin && <span className="text-gray-400 font-normal">(laisser vide pour ne pas changer)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  minLength={6}
                  required={!editingAdmin}
                  placeholder={editingAdmin ? 'Nouveau mot de passe (optionnel)' : 'Minimum 6 caractères'}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-outline">
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingAdmin ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
