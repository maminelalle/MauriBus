import { useEffect, useState, useRef } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiMap, FiX, FiTruck, FiNavigation } from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { lineAPI, busAPI } from '../utils/api';
import { toast } from 'react-toastify';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const NOUAKCHOTT = [18.0735, -15.9582];

const EMPTY_FORM = {
  nom: '', code: '', description: '',
  terminus_depart: '', terminus_arrivee: '',
  tarif_base: '', heure_depart: '', heure_fin: '',
  couleur_ligne: '#3B82F6', statut: 'ACTIVE',
};

// ─────────────────────────────────────────────────────────────────────────────
// Map Picker Modal — raw Leaflet (no react-leaflet), with autocomplete search
// ─────────────────────────────────────────────────────────────────────────────
function MapPickerModal({ isOpen, label, initialValue, onConfirm, onClose }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);

  // Init / destroy raw Leaflet map when modal opens / closes
  useEffect(() => {
    if (!isOpen) return;
    setAddress(initialValue || '');
    setQuery(initialValue || '');
    setSuggestions([]);
    setLoadingMap(true);

    // Wait for the DOM node to be available
    const timer = setTimeout(() => {
      if (!mapDivRef.current || mapRef.current) return;
      const map = L.map(mapDivRef.current, { center: NOUAKCHOTT, zoom: 12 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      map.on('click', ({ latlng }) => {
        placeMarker(map, latlng.lat, latlng.lng);
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`,
          { headers: { 'Accept-Language': 'fr' } }
        )
          .then((r) => r.json())
          .then((d) => {
            const addr = d.display_name?.split(',')[0] || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
            setAddress(addr);
            setQuery(addr);
          })
          .catch(() => {});
      });

      mapRef.current = map;
      setLoadingMap(false);
    }, 80);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeMarker = (map, lat, lng) => {
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 14);
  };

  // Autocomplete: debounced Nominatim suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=mr`,
          { headers: { 'Accept-Language': 'fr' } }
        );
        const data = await res.json();
        setSuggestions(
          data.map((d) => ({
            label: d.display_name,
            short: d.display_name.split(',').slice(0, 2).join(', '),
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
          }))
        );
      } catch { setSuggestions([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const selectSuggestion = (s) => {
    const short = s.label.split(',')[0];
    setAddress(short);
    setQuery(short);
    setSuggestions([]);
    if (mapRef.current) placeMarker(mapRef.current, s.lat, s.lng);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: 'rgba(0,0,0,0.7)' }}>
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <FiNavigation className="text-primary-light" size={18} />
          {label}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <FiX size={20} />
        </button>
      </div>

      {/* Search with autocomplete */}
      <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-200 relative z-10">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAddress(''); }}
            placeholder="Tapez un lieu… ex: Carrefour Madrid, Marché Capitale"
            className="input pl-9 w-full"
            autoFocus
          />
        </div>

        {/* Dropdown suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute left-4 right-4 bg-white border border-gray-200 rounded-b-lg shadow-xl overflow-y-auto max-h-56 z-20">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-medium text-gray-800">📍 {s.short}</span>
                <span className="block text-xs text-gray-400 truncate">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {address && (
          <p className="text-xs text-green-600 mt-1 font-medium">
            ✓ Sélectionné : {address}
          </p>
        )}
        {!address && (
          <p className="text-xs text-gray-400 mt-1">
            Cherchez une adresse ou cliquez directement sur la carte
          </p>
        )}
      </div>

      {/* Map — filled by raw Leaflet */}
      <div className="flex-1 relative">
        {loadingMap && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <span className="text-gray-500">Chargement de la carte…</span>
          </div>
        )}
        <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Footer */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow">
        <p className="flex-1 text-xs text-gray-500">
          Cliquez sur la carte pour placer un repère précis.
        </p>
        <button type="button" onClick={onClose} className="btn btn-outline">
          Annuler
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(address); onClose(); }}
          disabled={!address}
          className="btn btn-primary disabled:opacity-40"
        >
          Confirmer
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Terminus Autocomplete Input — inline Nominatim suggestions while typing
// ─────────────────────────────────────────────────────────────────────────────
function TerminusAutocomplete({ value, onChange, placeholder, onOpenMap }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!value.trim() || value.length < 2) { setSuggestions([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&countrycodes=mr`,
          { headers: { 'Accept-Language': 'fr' } }
        );
        const data = await res.json();
        const mapped = data.map((d) => ({
          label: d.display_name,
          short: d.display_name.split(',')[0],
        }));
        setSuggestions(mapped);
        setOpen(mapped.length > 0);
      } catch { setSuggestions([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input w-full"
        />
        {open && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[300] overflow-y-auto max-h-52">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => { onChange(s.short); setSuggestions([]); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-medium text-gray-800">📍 {s.short}</span>
                <span className="block text-xs text-gray-400 truncate">{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenMap}
        className="btn btn-outline px-3 flex items-center gap-1 whitespace-nowrap"
      >
        <FiMap size={15} /> Carte
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main LinesPage
// ─────────────────────────────────────────────────────────────────────────────
export function LinesPage() {
  const [lines, setLines] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Line form modal
  const [showModal, setShowModal] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Map picker
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapPickerField, setMapPickerField] = useState(null);

  // Bus assignment modal
  const [showBusModal, setShowBusModal] = useState(false);
  const [busAssignLine, setBusAssignLine] = useState(null);
  const [lineBuses, setLineBuses] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [lineRes, busRes] = await Promise.all([lineAPI.list(), busAPI.list()]);
      setLines(lineRes.data.results || lineRes.data);
      setBuses(busRes.data.results || busRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => { setEditingLine(null); setFormData(EMPTY_FORM); setShowModal(true); };

  const openEdit = (line) => {
    setEditingLine(line);
    setFormData({
      nom: line.nom || '', code: line.code || '', description: line.description || '',
      terminus_depart: line.terminus_depart || '', terminus_arrivee: line.terminus_arrivee || '',
      tarif_base: line.tarif_base || '', heure_depart: line.heure_depart || '',
      heure_fin: line.heure_fin || '', couleur_ligne: line.couleur_ligne || '#3B82F6',
      statut: line.statut || 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.tarif_base) delete payload.tarif_base;
      if (!payload.heure_depart) delete payload.heure_depart;
      if (!payload.heure_fin) delete payload.heure_fin;
      if (editingLine) {
        await lineAPI.update(editingLine.id, payload);
        toast.success('Ligne mise à jour');
      } else {
        await lineAPI.create(payload);
        toast.success('Ligne créée avec succès');
      }
      setShowModal(false);
      fetchAll();
    } catch (error) {
      const err = error.response?.data;
      toast.error(err?.detail || err?.code?.[0] || err?.nom?.[0] || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette ligne ?')) return;
    try { await lineAPI.delete(id); toast.success('Ligne supprimée'); fetchAll(); }
    catch { toast.error('Erreur lors de la suppression'); }
  };

  const openMapPicker = (field) => { setMapPickerField(field); setMapPickerOpen(true); };

  const handleMapConfirm = (addr) => {
    if (mapPickerField) setFormData((prev) => ({ ...prev, [mapPickerField]: addr }));
    setMapPickerOpen(false);
  };

  // Bus assignment (ManyToMany)
  const openBusAssign = (line) => {
    setBusAssignLine(line);
    setLineBuses(buses.filter((b) => b.lignes?.includes(line.id)));
    setShowBusModal(true);
  };

  const assignBus = async (busId) => {
    try {
      await lineAPI.addBus(busAssignLine.id, busId);
      toast.success('Bus assigné');
      const res = await busAPI.list();
      const all = res.data.results || res.data;
      setBuses(all);
      setLineBuses(all.filter((b) => b.lignes?.includes(busAssignLine.id)));
    } catch { toast.error("Erreur lors de l'assignation"); }
  };

  const unassignBus = async (busId) => {
    try {
      await lineAPI.removeBus(busAssignLine.id, busId);
      toast.success('Bus retiré');
      const res = await busAPI.list();
      const all = res.data.results || res.data;
      setBuses(all);
      setLineBuses(all.filter((b) => b.lignes?.includes(busAssignLine.id)));
    } catch { toast.error('Erreur lors du retrait'); }
  };

  const f = (k) => (e) => setFormData((prev) => ({ ...prev, [k]: e.target.value }));

  const filtered = lines.filter((l) =>
    l.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableBuses = busAssignLine
    ? buses.filter((b) => !b.lignes?.includes(busAssignLine.id))
    : [];

  if (isLoading) return <div className="p-8">Chargement...</div>;

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Gestion des Lignes</h1>
          <p className="text-gray-600 mt-1">{lines.length} lignes enregistrées</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus size={20} /> Ajouter Ligne
        </button>
      </div>

      {/* Recherche */}
      <div className="card">
        <div className="flex items-center gap-3">
          <FiSearch className="text-gray-400" size={20} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou code..." className="input border-0 bg-transparent placeholder-gray-500" />
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Terminus</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Horaires</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tarif</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Bus</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                <FiMap size={40} className="mx-auto mb-2 opacity-40" />
                Aucune ligne trouvée
              </td></tr>
            ) : (
              filtered.map((line) => {
                const cnt = buses.filter((b) => b.lignes?.includes(line.id)).length;
                return (
                  <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-white text-sm font-medium" style={{ backgroundColor: line.couleur_ligne }}>
                        {line.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-dark">{line.nom}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {line.terminus_depart || '—'} → {line.terminus_arrivee || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {line.heure_depart
                        ? `${line.heure_depart.slice(0, 5)} — ${line.heure_fin ? line.heure_fin.slice(0, 5) : '?'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{line.tarif_base ? `${line.tarif_base} UM` : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openBusAssign(line)}
                        className="flex items-center gap-1 text-primary-light hover:underline text-sm">
                        <FiTruck size={14} /> {cnt} bus
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${line.statut === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                        {line.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(line)} className="p-2 hover:bg-gray-200 rounded transition">
                        <FiEdit2 className="text-primary-light" size={18} />
                      </button>
                      <button onClick={() => handleDelete(line.id)} className="p-2 hover:bg-gray-200 rounded transition">
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

      {/* ── Line Form Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-4">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingLine ? 'Modifier Ligne' : 'Ajouter Ligne'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Code Ligne</label>
                  <input type="text" value={formData.code} onChange={f('code')} className="input" placeholder="Ex: L1" required />
                </div>
                <div>
                  <label className="label">Couleur</label>
                  <input type="color" value={formData.couleur_ligne} onChange={f('couleur_ligne')} className="input h-10 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="label">Nom de la Ligne</label>
                <input type="text" value={formData.nom} onChange={f('nom')} className="input" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tarif de base (UM)</label>
                  <input type="number" min={0} value={formData.tarif_base} onChange={f('tarif_base')} className="input" />
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select value={formData.statut} onChange={f('statut')} className="input">
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDUE">Suspendue</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Heure départ <span className="text-gray-400 font-normal">(opt.)</span></label>
                  <input type="time" value={formData.heure_depart} onChange={f('heure_depart')} className="input" />
                </div>
                <div>
                  <label className="label">Heure arrivée <span className="text-gray-400 font-normal">(opt.)</span></label>
                  <input type="time" value={formData.heure_fin} onChange={f('heure_fin')} className="input" />
                </div>
              </div>

              {/* Terminus Départ */}
              <div>
                <label className="label">Terminus Départ</label>
                <TerminusAutocomplete
                  value={formData.terminus_depart}
                  onChange={(v) => setFormData((prev) => ({ ...prev, terminus_depart: v }))}
                  placeholder="Ex: Marché Capitale"
                  onOpenMap={() => openMapPicker('terminus_depart')}
                />
              </div>

              {/* Terminus Arrivée */}
              <div>
                <label className="label">Terminus Arrivée</label>
                <TerminusAutocomplete
                  value={formData.terminus_arrivee}
                  onChange={(v) => setFormData((prev) => ({ ...prev, terminus_arrivee: v }))}
                  placeholder="Ex: 5ème Arrondissement"
                  onOpenMap={() => openMapPicker('terminus_arrivee')}
                />
              </div>

              <div>
                <label className="label">Description <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <textarea value={formData.description} onChange={f('description')} className="input" rows={2} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-outline">Annuler</button>
                <button type="submit" className="flex-1 btn btn-primary">{editingLine ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Map Picker (raw Leaflet, z-200, no react-leaflet) ── */}
      <MapPickerModal
        isOpen={mapPickerOpen}
        label={mapPickerField === 'terminus_depart' ? 'Choisir Terminus Départ' : 'Choisir Terminus Arrivée'}
        initialValue={mapPickerField ? formData[mapPickerField] : ''}
        onConfirm={handleMapConfirm}
        onClose={() => setMapPickerOpen(false)}
      />

      {/* ── Bus Assignment Modal ── */}
      {showBusModal && busAssignLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Bus sur la ligne</h2>
                <p className="text-sm text-gray-500">
                  <span className="font-medium" style={{ color: busAssignLine.couleur_ligne }}>{busAssignLine.code}</span> — {busAssignLine.nom}
                </p>
              </div>
              <button onClick={() => setShowBusModal(false)} className="p-2 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Bus assignés ({lineBuses.length})</h3>
                {lineBuses.length === 0 ? (
                  <p className="text-gray-400 text-sm">Aucun bus sur cette ligne</p>
                ) : (
                  <div className="space-y-2">
                    {lineBuses.map((bus) => (
                      <div key={bus.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <span className="font-medium">{bus.numero_bus}</span>
                          <span className="text-gray-500 text-sm ml-2">{bus.plaque} — {bus.marque} {bus.modele}</span>
                        </div>
                        <button onClick={() => unassignBus(bus.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {availableBuses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Disponibles à ajouter ({availableBuses.length})</h3>
                  <div className="space-y-2">
                    {availableBuses.map((bus) => (
                      <div key={bus.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{bus.numero_bus}</span>
                          <span className="text-gray-500 text-sm ml-2">{bus.plaque} — {bus.marque} {bus.modele}</span>
                        </div>
                        <button onClick={() => assignBus(bus.id)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                          + Assigner
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
