import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiTruck,
  FiMap,
  FiRadio,
  FiNavigation,
  FiDollarSign,
  FiAlertCircle,
  FiAlertTriangle,
  FiMessageSquare,
  FiBarChart2,
  FiSettings,
  FiShield,
  FiLogOut,
  FiMenu,
  FiX,
  FiSmartphone,
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiRadio, label: 'Carte Live', path: '/live-map' },
    { icon: FiNavigation, label: 'Trajets', path: '/trips' },
    { icon: FiUsers, label: 'Chauffeurs', path: '/drivers' },
    { icon: FiTruck, label: 'Bus', path: '/buses' },
    { icon: FiMap, label: 'Lignes', path: '/lines' },
    { icon: FiDollarSign, label: 'Paiements', path: '/payments' },
    { icon: FiSmartphone, label: 'Citoyens', path: '/citizens' },
    { icon: FiAlertCircle, label: 'Signalements', path: '/reports' },
    { icon: FiAlertTriangle, label: 'Alertes Système', path: '/system-alerts' },
    { icon: FiMessageSquare, label: 'Messages', path: '/notifications' },
    { icon: FiBarChart2, label: 'Statistiques', path: '/statistics' },
    { icon: FiShield, label: 'Admins', path: '/admins' },
    { icon: FiSettings, label: 'Paramètres', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-primary rounded-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar backdrop mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-primary text-white transition-transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center font-bold">
              MB
            </div>
            <div>
              <h1 className="text-xl font-bold">MauriBus</h1>
              <p className="text-xs text-blue-300">Manager</p>
            </div>
          </Link>

          {/* Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-light text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-900">
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <FiLogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
