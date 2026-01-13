/**
 * MA Session Context Provider
 * Manages MA session state (facility, specialty, shift start)
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MASession, MASessionRequest, Facility, Specialty } from '../types';
import { apiService } from '../services/api';

interface MASessionContextType {
  session: MASession | null;
  facilities: Facility[];
  specialties: Specialty[];
  isLoading: boolean;
  error: string | null;
  login: (request: MASessionRequest) => Promise<void>;
  logout: () => void;
  loadFacilitiesAndSpecialties: () => Promise<void>;
}

const MASessionContext = createContext<MASessionContextType | undefined>(undefined);

export const useMASession = () => {
  const context = useContext(MASessionContext);
  if (!context) {
    throw new Error('useMASession must be used within MASessionProvider');
  }
  return context;
};

interface MASessionProviderProps {
  children: ReactNode;
}

export const MASessionProvider: React.FC<MASessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<MASession | null>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('ma_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFacilitiesAndSpecialties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [facilitiesData, specialtiesData] = await Promise.all([
        apiService.getFacilities(),
        apiService.getSpecialties(),
      ]);

      setFacilities(facilitiesData);
      setSpecialties(specialtiesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load facilities and specialties');
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (request: MASessionRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await apiService.createMASession(request);
      setSession(sessionData);

      // Save to localStorage
      localStorage.setItem('ma_session', JSON.stringify(sessionData));
    } catch (err: any) {
      setError(err.message || 'Failed to create MA session');
      console.error('Login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem('ma_session');
  }, []);

  const value: MASessionContextType = {
    session,
    facilities,
    specialties,
    isLoading,
    error,
    login,
    logout,
    loadFacilitiesAndSpecialties,
  };

  return <MASessionContext.Provider value={value}>{children}</MASessionContext.Provider>;
};
