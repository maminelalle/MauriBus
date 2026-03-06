import { useEffect, useState } from 'react';
import {
  FiSearch, FiCheck, FiX, FiEye, FiDollarSign,
  FiSend, FiRefreshCw, FiCreditCard, FiArrowUpCircle,
  FiArrowDownCircle, FiTrendingUp, FiClock, FiPlus,
} from 'react-icons/fi';
import { paymentAPI, walletAdminAPI, appWalletAPI } from '../utils/api';
import { toast } from 'react-toastify';

const STATUS_LABELS = {
  EN_ATTENTE: { label: 'En attente', cls: 'badge-warning' },
  VALIDE: { label: 'Validé', cls: 'badge-success' },
  REFUSE: { label: 'Refusé', cls: 'badge-danger' },
};

const TX_TYPE_CONFIG = {
  COMMISSION: { label: 'Commission trajet', icon: FiArrowUpCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', sign: '+' },
  PAIEMENT_CHAUFFEUR: { label: 'Paiement chauffeur', icon: FiArrowDownCircle, color: 'text-red-600', bg: 'bg-red-50', sign: '−' },
  RECHARGE_BANQUE: { label: 'Recharge banque', icon: FiArrowUpCircle, color: 'text-blue-600', bg: 'bg-blue-50', sign: '+' },
};

// ─── Tab: Recharges Wallet Citoyens ──────────────────────────────────────────
function WalletRechargesTab() {
  const [data, setData] = useState({ transactions: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchRecharges(); }, [filterStatut]);

  const fetchRecharges = async () => {
    setLoading(true);
    try {
      const params = filterStatut ? { statut: filterStatut } : {};
      const res = await walletAdminAPI.recharges(params);
      setData(res.data);
    } catch { toast.error('Erreur chargement recharges'); }
    finally { setLoading(false); }
  };

  const handleValidate = async (id) => {
    setProcessing(true);
    try {
      await walletAdminAPI.validate(id);
      toast.success('✅ Recharge validée — wallet citoyen crédité !');
      fetchRecharges();
      setSelected(null);
    } catch (e) { toast.error(e.response?.data?.detail || 'Erreur'); }
    finally { setProcessing(false); }
  };

  const handleRefuse = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await walletAdminAPI.refuse(selected.id, rejectNote);
      toast.success('Recharge refusée');
      setShowReject(false);
      setSelected(null);
      fetchRecharges();
    } catch (e) { toast.error(e.response?.data?.detail || 'Erreur'); }
    finally { setProcessing(false); }
  };

  const txs = data.transactions || [];
  const stats = data.stats || {};

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-500">{stats.en_attente || 0}</p>
          <p className="text-xs text-gray-500">En attente</p>
          <p className="text-sm font-semibold text-gray-700">{(stats.montant_en_attente || 0).toLocaleString('fr-FR')} MRU</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-500">{stats.valide || 0}</p>
          <p className="text-xs text-gray-500">Validées</p>
          <p className="text-sm font-semibold text-gray-700">{(stats.montant_valide || 0).toLocaleString('fr-FR')} MRU</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{stats.refuse || 0}</p>
          <p className="text-xs text-gray-500">Refusées</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="input w-auto">
          <option value="">Toutes</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="VALIDE">Validées</option>
          <option value="REFUSE">Refusées</option>
        </select>
        <button onClick={fetchRecharges} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
          <FiRefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Citoyen', 'Téléphone', 'Montant', 'Référence Bankily', 'Date', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucune recharge</td></tr>
            ) : txs.map(t => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{t.citoyen_nom}</td>
                <td className="px-4 py-3 text-gray-600">{t.citoyen_telephone}</td>
                <td className="px-4 py-3 font-bold text-emerald-600">{t.montant.toLocaleString('fr-FR')} MRU</td>
                <td className="px-4 py-3 font-mono text-sm">{t.reference_bankily || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{new Date(t.date_creation).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS_LABELS[t.statut]?.cls || 'badge-warning'}`}>{STATUS_LABELS[t.statut]?.label || t.statut}</span></td>
                <td className="px-4 py-3 flex items-center gap-1">
                  <button onClick={() => setSelected(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Voir détails"><FiEye size={16} /></button>
                  {t.statut === 'EN_ATTENTE' && (
                    <>
                      <button onClick={() => handleValidate(t.id)} disabled={processing} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Valider"><FiCheck size={16} /></button>
                      <button onClick={() => { setSelected(t); setRejectNote(''); setShowReject(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Refuser"><FiX size={16} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && !showReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-bold">Demande de Recharge Wallet</h3>
              <button onClick={() => setSelected(null)}><FiX /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 mb-1">Citoyen</p><p className="font-semibold">{selected.citoyen_nom}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 mb-1">Téléphone</p><p className="font-semibold">{selected.citoyen_telephone}</p></div>
                <div className="bg-emerald-50 rounded-lg p-3"><p className="text-gray-500 mb-1">Montant</p><p className="text-xl font-bold text-emerald-600">{selected.montant.toLocaleString('fr-FR')} MRU</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500 mb-1">Référence Bankily</p><p className="font-mono font-semibold">{selected.reference_bankily || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2"><p className="text-gray-500 mb-1">Date</p><p className="font-semibold">{new Date(selected.date_creation).toLocaleString('fr-FR')}</p></div>
              </div>
              {selected.photo_bankily && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">📸 Capture Bankily :</p>
                  <img src={selected.photo_bankily} alt="Capture" className="w-full rounded-lg border border-gray-200 max-h-64 object-contain bg-gray-50" onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
              {selected.statut === 'EN_ATTENTE' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleValidate(selected.id)} disabled={processing} className="flex-1 btn btn-success flex items-center justify-center gap-2">
                    <FiCheck /> {processing ? 'Traitement...' : 'Valider et créditer'}
                  </button>
                  <button onClick={() => { setRejectNote(''); setShowReject(true); }} className="flex-1 btn bg-red-500 text-white hover:bg-red-600 flex items-center justify-center gap-2">
                    <FiX /> Refuser
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReject && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-5 border-b"><h3 className="font-bold text-red-600">Refuser la recharge</h3><p className="text-sm text-gray-500">{selected.citoyen_nom} — {selected.montant.toLocaleString('fr-FR')} MRU</p></div>
            <form onSubmit={handleRefuse} className="p-5 space-y-4">
              <div><label className="label">Motif du refus</label><textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} className="input" rows={3} required /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReject(false)} className="flex-1 btn btn-outline">Annuler</button>
                <button type="submit" disabled={processing} className="flex-1 btn bg-red-500 text-white hover:bg-red-600">Refuser</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Wallet MauriBus App ─────────────────────────────────────────────────
function AppWalletTab() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeDesc, setRechargeDesc] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchInfo(); }, []);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await appWalletAPI.info();
      setInfo(res.data);
    } catch { toast.error('Erreur chargement wallet MauriBus'); }
    finally { setLoading(false); }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await appWalletAPI.recharge({ montant: parseFloat(rechargeAmount), description: rechargeDesc || undefined });
      toast.success(res.data.detail);
      setShowRecharge(false);
      setRechargeAmount('');
      setRechargeDesc('');
      fetchInfo();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const stats = info?.stats || {};
  const txs = info?.transactions || [];

  return (
    <div className="space-y-6">
      {/* Wallet Card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiCreditCard size={20} />
            <span className="text-blue-200 font-medium text-sm">Wallet MauriBus</span>
          </div>
          <p className="text-4xl font-extrabold tracking-tight">
            {(info?.balance || 0).toLocaleString('fr-FR')} <span className="text-xl font-semibold text-blue-200">MRU</span>
          </p>
          <p className="text-blue-300 text-xs mt-1">Solde disponible pour payer les chauffeurs</p>
          <p className="text-blue-200 text-xs mt-0.5 italic">Connecté au compte bancaire MauriBus</p>
        </div>
        <button
          onClick={() => setShowRecharge(true)}
          className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shrink-0"
        >
          <FiPlus size={16} /> Recharger depuis banque
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <FiArrowUpCircle size={22} className="mx-auto text-emerald-500 mb-1" />
          <p className="text-xl font-bold text-gray-800">{(stats.total_commissions || 0).toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500">MRU commissions reçues</p>
        </div>
        <div className="card text-center">
          <FiArrowDownCircle size={22} className="mx-auto text-red-500 mb-1" />
          <p className="text-xl font-bold text-gray-800">{(stats.total_paiements_chauffeurs || 0).toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500">MRU payés aux chauffeurs</p>
        </div>
        <div className="card text-center">
          <FiTrendingUp size={22} className="mx-auto text-blue-500 mb-1" />
          <p className="text-xl font-bold text-gray-800">{(stats.total_recharges_banque || 0).toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500">MRU rechargés depuis banque</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FiClock size={16} /> Historique des mouvements
        </h3>
        {txs.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun mouvement enregistré</p>
        ) : (
          <div className="space-y-2">
            {txs.map(t => {
              const cfg = TX_TYPE_CONFIG[t.type_transaction] || TX_TYPE_CONFIG.COMMISSION;
              const Icon = cfg.icon;
              const isDebit = t.type_transaction === 'PAIEMENT_CHAUFFEUR';
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${cfg.bg} shrink-0`}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
                    <p className="text-xs text-gray-500 truncate">{t.description || '—'}</p>
                    {t.chauffeur_nom && <p className="text-xs text-blue-600 font-medium">{t.chauffeur_nom}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold ${isDebit ? 'text-red-600' : 'text-emerald-600'}`}>
                      {cfg.sign} {t.montant.toLocaleString('fr-FR')} MRU
                    </p>
                    <p className="text-xs text-gray-400">{new Date(t.date_creation).toLocaleDateString('fr-FR')}</p>
                    <p className="text-xs text-gray-300">Solde: {t.solde_apres.toLocaleString('fr-FR')} MRU</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Recharge */}
      {showRecharge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Recharger le Wallet MauriBus</h3>
                <p className="text-sm text-gray-500">Depuis le compte bancaire de la société</p>
              </div>
              <button onClick={() => setShowRecharge(false)}><FiX /></button>
            </div>
            <form onSubmit={handleRecharge} className="p-5 space-y-4">
              <div>
                <label className="label">Montant (MRU)</label>
                <input type="number" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} className="input" placeholder="Ex: 50000" min="1" required />
              </div>
              <div>
                <label className="label">Description (optionnel)</label>
                <input value={rechargeDesc} onChange={e => setRechargeDesc(e.target.value)} className="input" placeholder="Ex: Virement compte BCI mars 2025" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRecharge(false)} className="flex-1 btn btn-outline">Annuler</button>
                <button type="submit" disabled={processing} className="flex-1 btn btn-primary flex items-center justify-center gap-2">
                  <FiPlus size={14} /> {processing ? 'Traitement...' : 'Créditer le wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Payer les Chauffeurs ────────────────────────────────────────────────
function PayDriversTab() {
  const [drivers, setDrivers] = useState([]);
  const [appBalance, setAppBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [driversRes, walletRes] = await Promise.all([
        walletAdminAPI.driverWallets(),
        appWalletAPI.info(),
      ]);
      setDrivers(driversRes.data);
      setAppBalance(walletRes.data.balance);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await walletAdminAPI.payDriver(payModal.id, { montant: parseFloat(montant), description });
      toast.success(res.data.detail);
      setAppBalance(res.data.nouveau_solde_app);
      setPayModal(null);
      setMontant('');
      setDescription('');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
    finally { setProcessing(false); }
  };

  const filtered = drivers.filter(d =>
    d.nom.toLowerCase().includes(search.toLowerCase()) ||
    d.matricule.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-4">
      {/* App Wallet Balance Banner */}
      <div className={`rounded-xl p-4 flex items-center gap-4 ${appBalance !== null && appBalance <= 0 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
        <FiCreditCard size={24} className={appBalance !== null && appBalance <= 0 ? 'text-red-500' : 'text-blue-500'} />
        <div>
          <p className="text-sm text-gray-600 font-medium">Solde Wallet MauriBus disponible</p>
          <p className={`text-2xl font-extrabold ${appBalance !== null && appBalance <= 0 ? 'text-red-600' : 'text-blue-700'}`}>
            {appBalance !== null ? appBalance.toLocaleString('fr-FR') : '—'} MRU
          </p>
          {appBalance !== null && appBalance <= 0 && (
            <p className="text-xs text-red-500 mt-0.5">⚠ Solde insuffisant — rechargez le wallet avant de payer</p>
          )}
        </div>
      </div>

      <div className="card flex items-center gap-3">
        <FiSearch className="text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un chauffeur..." className="input border-0 bg-transparent flex-1" />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Matricule', 'Nom', 'Téléphone', 'Statut', 'Solde Wallet', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Aucun chauffeur</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm font-medium">{d.matricule}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{d.nom}</td>
                <td className="px-4 py-3 text-gray-600">{d.telephone}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${d.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${d.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {d.is_online ? 'En ligne' : 'Hors ligne'}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-blue-600">{d.wallet_balance.toLocaleString('fr-FR')} MRU</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { setPayModal(d); setMontant(''); setDescription(''); }}
                    className="flex items-center gap-1 btn btn-primary text-sm px-3 py-1.5"
                    disabled={appBalance !== null && appBalance <= 0}
                  >
                    <FiSend size={13} /> Payer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-5 border-b flex justify-between">
              <div>
                <h3 className="font-bold text-lg">Payer {payModal.nom}</h3>
                <p className="text-sm text-gray-500">{payModal.matricule} · Solde wallet: {payModal.wallet_balance.toLocaleString('fr-FR')} MRU</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">Wallet MauriBus disponible: {appBalance?.toLocaleString('fr-FR')} MRU</p>
              </div>
              <button onClick={() => setPayModal(null)}><FiX /></button>
            </div>
            <form onSubmit={handlePay} className="p-5 space-y-4">
              <div>
                <label className="label">Montant (MRU)</label>
                <input type="number" value={montant} onChange={e => setMontant(e.target.value)} className="input" placeholder="Ex: 5000" min="1" max={appBalance || undefined} required />
                {montant && appBalance !== null && parseFloat(montant) > appBalance && (
                  <p className="text-xs text-red-500 mt-1">⚠ Montant supérieur au solde disponible</p>
                )}
              </div>
              <div>
                <label className="label">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input" placeholder="Ex: Salaire mars 2025, prime trajet..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 btn btn-outline">Annuler</button>
                <button
                  type="submit"
                  disabled={processing || (montant && appBalance !== null && parseFloat(montant) > appBalance)}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  <FiSend size={14} /> {processing ? 'Envoi...' : `Envoyer ${montant ? parseFloat(montant).toLocaleString('fr-FR') : '—'} MRU`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Historique Paiements Chauffeurs ─────────────────────────────────────
function DriverPaymentsHistoryTab() {
  const [data, setData] = useState({ transactions: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await appWalletAPI.driverPaymentsHistory();
      setData(res.data);
    } catch { toast.error('Erreur chargement historique'); }
    finally { setLoading(false); }
  };

  const txs = (data.transactions || []).filter(t =>
    !search ||
    t.chauffeur_nom.toLowerCase().includes(search.toLowerCase()) ||
    t.chauffeur_matricule.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{data.count || 0}</p>
          <p className="text-xs text-gray-500">Paiements effectués</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{(data.total || 0).toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500">MRU total versés aux chauffeurs</p>
        </div>
      </div>

      <div className="card flex items-center gap-3">
        <FiSearch className="text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher chauffeur, matricule..." className="input border-0 bg-transparent flex-1" />
        <button onClick={fetchHistory} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 shrink-0">
          <FiRefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Chauffeur', 'Matricule', 'Montant', 'Description', 'Effectué par', 'Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Aucun paiement enregistré</td></tr>
            ) : txs.map(t => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{t.chauffeur_nom}</td>
                <td className="px-4 py-3 font-mono text-sm text-gray-600">{t.chauffeur_matricule}</td>
                <td className="px-4 py-3 font-bold text-red-600">−{t.montant.toLocaleString('fr-FR')} MRU</td>
                <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">{t.description || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{t.effectue_par || 'Admin'}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{new Date(t.date_creation).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PaymentsPage() {
  const [tab, setTab] = useState('recharges');

  const TABS = [
    { id: 'recharges', label: '💳 Recharges Wallet' },
    { id: 'app-wallet', label: '🏦 Wallet MauriBus' },
    { id: 'drivers', label: '💸 Payer Chauffeurs' },
    { id: 'history', label: '📋 Historique Paiements' },
  ];

  return (
    <main className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
        <p className="text-gray-500 mt-1">Wallet MauriBus, paiements chauffeurs et recharges citoyens</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recharges' && <WalletRechargesTab />}
      {tab === 'app-wallet' && <AppWalletTab />}
      {tab === 'drivers' && <PayDriversTab />}
      {tab === 'history' && <DriverPaymentsHistoryTab />}
    </main>
  );
}
