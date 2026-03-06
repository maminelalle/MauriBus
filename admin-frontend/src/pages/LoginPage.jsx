import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiMail, FiLock, FiLoader } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login(matricule, password);
      const { admin, access } = response.data;
      
      login(admin, access);
      toast.success('Connexion réussie!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-800 to-primary-light flex items-center justify-center p-4">
      {/* Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mb-48"></div>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <FiTruck className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-dark">MauriBus</h1>
                <p className="text-xs text-gray-500">Manager Dashboard</p>
              </div>
            </div>
            <p className="text-gray-600">Bienvenue manager</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Matricule */}
            <div>
              <label className="label">Matricule</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="ADMN-001"
                  className="input pl-12"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-12"
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-gray-700">Se souvenir de moi</span>
              </label>
              <a href="#" className="text-primary-light hover:underline">
                Mot de passe oublié?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <FiLoader className="animate-spin" size={20} />
                  Connexion en cours...
                </>
              ) : (
                'Connexion'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 MauriBus. Tous droits réservés.</p>
          </div>
        </div>

        {/* Illustration */}
        <div className="mt-8 text-center text-white opacity-80">
          <p className="text-sm">Plateforme de gestion et géolocalisation des bus</p>
        </div>
      </div>
    </div>
  );
}
