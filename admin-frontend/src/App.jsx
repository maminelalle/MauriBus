import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DriversPage } from './pages/DriversPage';
import { BusesPage } from './pages/BusesPage';
import { LinesPage } from './pages/LinesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminsPage } from './pages/AdminsPage';
import { CitizensPage } from './pages/CitizensPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { TripsPage } from './pages/TripsPage';
import { SystemAlertsPage } from './pages/SystemAlertsPage';
import './styles/globals.css';

function ProtectedLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

function AppRoutes() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><DriversPage /></ProtectedRoute>} />
      <Route path="/buses" element={<ProtectedRoute><BusesPage /></ProtectedRoute>} />
      <Route path="/lines" element={<ProtectedRoute><LinesPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/admins" element={<ProtectedRoute><AdminsPage /></ProtectedRoute>} />
      <Route path="/citizens" element={<ProtectedRoute><CitizensPage /></ProtectedRoute>} />
      <Route path="/live-map" element={<ProtectedRoute><LiveMapPage /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
      <Route path="/system-alerts" element={<ProtectedRoute><SystemAlertsPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
