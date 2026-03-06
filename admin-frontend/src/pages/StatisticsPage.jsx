import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { statisticsAPI } from '../utils/api';
import { toast } from 'react-toastify';

export function StatisticsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState('7d');
  const [revenueData, setRevenueData] = useState({ data: [], total: 0 });
  const [driverData, setDriverData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isLoadingLines, setIsLoadingLines] = useState(true);

  useEffect(() => {
    fetchDrivers();
    fetchLines();
  }, []);

  useEffect(() => {
    fetchRevenue();
  }, [revenuePeriod]);

  const fetchRevenue = async () => {
    setIsLoadingRevenue(true);
    try {
      const res = await statisticsAPI.revenue({ period: revenuePeriod });
      setRevenueData(res.data);
    } catch {
      toast.error('Erreur lors du chargement des revenus');
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await statisticsAPI.drivers();
      setDriverData(res.data.drivers || []);
    } catch {
      toast.error('Erreur lors du chargement des statistiques chauffeurs');
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const fetchLines = async () => {
    try {
      const res = await statisticsAPI.lines();
      setLineData(res.data.lines || []);
    } catch {
      toast.error('Erreur lors du chargement des statistiques lignes');
    } finally {
      setIsLoadingLines(false);
    }
  };

  return (
    <main className="p-6 md:p-8 space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-text-dark">Statistiques</h1>
        <p className="text-gray-600 mt-1">Analyse des performances et revenus</p>
      </div>

      {/* Revenus */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Revenus</h2>
            <p className="text-2xl font-bold text-primary-light mt-1">
              {isLoadingRevenue ? '...' : `${revenueData.total.toLocaleString()} UM`}
            </p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setRevenuePeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  revenuePeriod === period
                    ? 'bg-primary-light text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : '90 jours'}
              </button>
            ))}
          </div>
        </div>

        {isLoadingRevenue ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Chargement...</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData.data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value.toLocaleString()} UM`, 'Revenus']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chauffeurs et Lignes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top chauffeurs */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top 10 Chauffeurs</h2>
          {isLoadingDrivers ? (
            <div className="h-48 flex items-center justify-center text-gray-400">Chargement...</div>
          ) : driverData.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-3">
              {driverData.map((driver, idx) => (
                <div key={driver.matricule} className="flex items-center gap-3">
                  <span className="w-6 text-gray-400 text-sm text-right">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{driver.nom}</span>
                      <span className="text-gray-500">{driver.total_trips} trajets</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-light h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (driver.total_trips / (driverData[0]?.total_trips || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-24 text-right">
                    {driver.total_revenue.toLocaleString()} UM
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lignes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Activité par Ligne</h2>
          {isLoadingLines ? (
            <div className="h-48 flex items-center justify-center text-gray-400">Chargement...</div>
          ) : lineData.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune donnée disponible</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lineData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="code"
                  stroke="#9ca3af"
                  tick={{ fontSize: 11 }}
                  width={40}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'total_trips'
                      ? [value, 'Trajets']
                      : [value, 'Bus']
                  }
                />
                <Legend formatter={(value) => (value === 'total_trips' ? 'Trajets' : 'Bus')} />
                <Bar dataKey="total_trips" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="nombre_bus" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </main>
  );
}
