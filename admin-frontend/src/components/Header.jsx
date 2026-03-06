import { useState } from 'react';
import { FiBell, FiSearch, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { adminData } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Recherche */}
        <div className="hidden md:flex flex-1 items-center max-w-md">
          <FiSearch className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="input bg-gray-50 border-0 placeholder-gray-500"
          />
        </div>

        {/* Actions Droite */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 hover:bg-gray-50 border-b">
                    <p className="text-sm font-medium">Bus #5 arrêté depuis 15 min</p>
                    <p className="text-xs text-gray-500">À l'instant</p>
                  </div>
                  <div className="p-4 hover:bg-gray-50 border-b">
                    <p className="text-sm font-medium">Paiement manquant - Chauffeur DRV-0001</p>
                    <p className="text-xs text-gray-500">Il y a 5 minutes</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profil */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-white font-bold text-sm">
                {adminData?.prenom?.[0]}
              </div>
              <div className="hidden md:block text-left text-sm">
                <p className="font-medium">{adminData?.prenom} {adminData?.nom}</p>
                <p className="text-xs text-gray-500">{adminData?.role}</p>
              </div>
              <FiChevronDown size={16} />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium">{adminData?.email}</p>
                </div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                  Profil
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                  Paramètres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
