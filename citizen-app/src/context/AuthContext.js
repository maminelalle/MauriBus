import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { citizenAuth, profileAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [citizen, setCitizen] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStored();
  }, []);

  const loadStored = async () => {
    try {
      const [storedToken, storedCitizen] = await Promise.all([
        AsyncStorage.getItem('citizen_token'),
        AsyncStorage.getItem('citizen_data'),
      ]);
      if (storedToken && storedCitizen) {
        setToken(storedToken);
        setCitizen(JSON.parse(storedCitizen));
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  const login = async (telephone, password) => {
    const res = await citizenAuth.login(telephone, password);
    const { access, citizen: citizenData } = res.data;
    await AsyncStorage.setItem('citizen_token', access);
    await AsyncStorage.setItem('citizen_data', JSON.stringify(citizenData));
    setToken(access);
    setCitizen(citizenData);
    return citizenData;
  };

  const logout = async () => {
    try { await citizenAuth.logout(); } catch {}
    await AsyncStorage.multiRemove(['citizen_token', 'citizen_data']);
    setToken(null);
    setCitizen(null);
  };

  const updateCitizen = (data) => {
    const updated = { ...citizen, ...data };
    setCitizen(updated);
    AsyncStorage.setItem('citizen_data', JSON.stringify(updated));
  };

  const updateBalance = (newBalance) => {
    updateCitizen({ wallet_balance: newBalance });
  };

  const refreshProfile = async () => {
    try {
      const res = await profileAPI.get();
      const updated = { ...citizen, ...res.data };
      setCitizen(updated);
      await AsyncStorage.setItem('citizen_data', JSON.stringify(updated));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ citizen, token, isLoading, login, logout, updateCitizen, updateBalance, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
