import { useState } from 'react';
import { FiUser, FiLock, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [profileForm, setProfileForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admins/${user?.id}/`, profileForm);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Le mot de passe doit comporter au moins 8 caractères');
      return;
    }
    try {
      await api.patch(`/admins/${user?.id}/`, { password: passwordForm.new_password });
      toast.success('Mot de passe modifié avec succès');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du changement de mot de passe');
    }
  };

  return (
    <main className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-text-dark">Paramètres</h1>
        <p className="text-gray-600 mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* Info compte */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-white text-2xl font-bold">
          {user?.prenom?.[0]}{user?.nom?.[0]}
        </div>
        <div>
          <p className="text-lg font-semibold text-text-dark">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-gray-500 text-sm">{user?.matricule}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
        <div className="ml-auto">
          <span className="badge badge-success">{user?.role || 'Admin'}</span>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-primary-light text-primary-light'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiUser size={16} />
          Profil
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition border-b-2 -mb-px ${
            activeTab === 'security'
              ? 'border-primary-light text-primary-light'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiLock size={16} />
          Sécurité
        </button>
      </div>

      {/* Onglet Profil */}
      {activeTab === 'profile' && (
        <div className="card max-w-lg">
          <h2 className="text-lg font-semibold mb-4">Informations personnelles</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                <input
                  type="text"
                  value={profileForm.prenom}
                  onChange={(e) => setProfileForm({ ...profileForm, prenom: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Nom</label>
                <input
                  type="text"
                  value={profileForm.nom}
                  onChange={(e) => setProfileForm({ ...profileForm, nom: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                value={profileForm.telephone}
                onChange={(e) => setProfileForm({ ...profileForm, telephone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Matricule</label>
              <input
                type="text"
                value={user?.matricule || ''}
                className="input bg-gray-50"
                disabled
              />
            </div>
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <FiSave size={18} />
              Enregistrer
            </button>
          </form>
        </div>
      )}

      {/* Onglet Sécurité */}
      {activeTab === 'security' && (
        <div className="card max-w-lg">
          <h2 className="text-lg font-semibold mb-4">Changer le mot de passe</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="label">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="input pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
            </div>
            <div>
              <label className="label">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <FiLock size={18} />
              Changer le mot de passe
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
