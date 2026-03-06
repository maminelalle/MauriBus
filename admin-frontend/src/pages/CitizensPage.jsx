import { useEffect, useState } from 'react';
import {
  FiSearch, FiUsers, FiPause, FiPlay, FiPhone, FiMail,
  FiUser, FiCreditCard, FiAlertCircle,
} from 'react-icons/fi';
import { citizenAdminAPI } from '../utils/api';
import { toast } from 'react-toastify';

const STATUT_BADGE = {
  ACTIF: 'bg-green-100 text-green-700',
  SUSPENDU: 'bg-red-100 text-red-700',
  INACTIF: 'bg-gray-100 text-gray-600',
};

export function CitizensPage() {
  const [citizens, setCitizens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchCitizens(); }, []);

  const fetchCitizens = async () => {
    setIsLoading(true);
    try {
      const res = await citizenAdminAPI.list();
      setCitizens(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Erreur lors du chargement des citoyens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (id, nom) => {
    if (!window.confirm(`Suspendre le compte de ${nom} ?`)) return;
    setActionLoading(id);
    try {
      await citizenAdminAPI.suspend(id);
      toast.success(`Compte de ${nom} suspendu`);
      fetchCitizens();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la suspension');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (id, nom) => {
    setActionLoading(id);
    try {
      await citizenAdminAPI.activate(id);
      toast.success(`Compte de ${nom} activé`);
      fetchCitizens();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'activation');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = citizens.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      `${c.prenom} ${c.nom}`.toLowerCase().includes(q) ||
      c.telephone.includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.nni || '').includes(q);
    const matchStatut = !filterStatut || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalActif = citizens.filter((c) => c.statut === 'ACTIF').length;
  const totalSuspendu = citizens.filter((c) => c.statut === 'SUSPENDU').length;
  const totalWallet = citizens.reduce((s, c) => s + (c.wallet_balance || 0), 0);

  if (isLoading) return <div className="p-8 text-gray-500">Chargement...</div>;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Citoyens</h1>
          <p className="text-gray-600 mt-1">{citizens.length} comptes enregistrés</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <FiUsers size={24} className="mx-auto text-primary-light mb-1" />
          <p className="text-2xl font-bold text-text-dark">{citizens.length}</p>
          <p className="text-xs text-gray-500">Total citoyens</p>
        </div>
        <div className="card text-center">
          <FiPlay size={24} className="mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold text-text-dark">{totalActif}</p>
          <p className="text-xs text-gray-500">Comptes actifs</p>
        </div>
        <div className="card text-center">
          <FiAlertCircle size={24} className="mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-text-dark">{totalSuspendu}</p>
          <p className="text-xs text-gray-500">Comptes suspendus</p>
        </div>
        <div className="card text-center">
          <FiCreditCard size={24} className="mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-text-dark">{totalWallet.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500">Total wallets (MRU)</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, email, NNI..."
              className="input pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input md:w-48"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="SUSPENDU">Suspendus</option>
            <option value="INACTIF">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiUsers size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aucun citoyen trouvé</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Citoyen</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Contact</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">NNI</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Wallet</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Statut</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Inscription</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  {/* Citoyen */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-sm flex-shrink-0">
                        {(c.prenom?.[0] || '').toUpperCase()}{(c.nom?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{c.prenom} {c.nom}</p>
                        <p className="text-xs text-gray-400">ID: {c.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-700">
                      <FiPhone size={12} className="text-gray-400" />
                      <span>{c.telephone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                        <FiMail size={11} className="text-gray-400" />
                        <span className="truncate max-w-[140px]">{c.email}</span>
                      </div>
                    )}
                  </td>

                  {/* NNI */}
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                    {c.nni || <span className="text-gray-300">—</span>}
                  </td>

                  {/* Wallet */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-blue-600">
                      {(c.wallet_balance || 0).toLocaleString('fr-FR')} MRU
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_BADGE[c.statut] || 'bg-gray-100 text-gray-600'}`}>
                      {c.statut}
                    </span>
                  </td>

                  {/* Date inscription */}
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {c.date_creation ? new Date(c.date_creation).toLocaleDateString('fr-FR') : '—'}
                    {c.derniere_connexion && (
                      <p className="text-gray-400 mt-0.5">
                        Cnx: {new Date(c.derniere_connexion).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    {c.statut === 'ACTIF' ? (
                      <button
                        onClick={() => handleSuspend(c.id, `${c.prenom} ${c.nom}`)}
                        disabled={actionLoading === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition disabled:opacity-50"
                        title="Suspendre le compte"
                      >
                        <FiPause size={13} />
                        {actionLoading === c.id ? '...' : 'Suspendre'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(c.id, `${c.prenom} ${c.nom}`)}
                        disabled={actionLoading === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition disabled:opacity-50"
                        title="Activer le compte"
                      >
                        <FiPlay size={13} />
                        {actionLoading === c.id ? '...' : 'Activer'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-4 text-right">
            {filtered.length} citoyen{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </main>
  );
}
