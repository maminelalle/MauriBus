import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverAuth } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStored();
  }, []);

  const loadStored = async () => {
    try {
      const [storedToken, storedDriver] = await Promise.all([
        AsyncStorage.getItem('driver_token'),
        AsyncStorage.getItem('driver_data'),
      ]);
      if (storedToken && storedDriver) {
        setToken(storedToken);
        setDriver(JSON.parse(storedDriver));
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  const login = async (matricule, password) => {
    const res = await driverAuth.login(matricule, password);
    const { access, driver: driverData } = res.data;
    await AsyncStorage.setItem('driver_token', access);
    await AsyncStorage.setItem('driver_data', JSON.stringify(driverData));
    setToken(access);
    setDriver(driverData);
    return driverData;
  };

  const logout = async () => {
    try { await driverAuth.logout(); } catch { /* ignore */ }
    await AsyncStorage.multiRemove(['driver_token', 'driver_data']);
    setToken(null);
    setDriver(null);
  };

  const updateDriver = (data) => {
    const updated = { ...driver, ...data };
    setDriver(updated);
    AsyncStorage.setItem('driver_data', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ driver, token, isLoading, login, logout, updateDriver }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
