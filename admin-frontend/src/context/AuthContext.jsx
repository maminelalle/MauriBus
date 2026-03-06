import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

const USER_KEY = 'mauribus_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(() => Cookies.get('access_token') || null);

  useEffect(() => {
    const storedToken = Cookies.get('access_token');
    if (!storedToken) {
      setUser(null);
      localStorage.removeItem(USER_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = (adminData, accessToken) => {
    setUser(adminData);
    setToken(accessToken);
    Cookies.set('access_token', accessToken, { expires: 7 });
    localStorage.setItem(USER_KEY, JSON.stringify(adminData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('access_token');
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
