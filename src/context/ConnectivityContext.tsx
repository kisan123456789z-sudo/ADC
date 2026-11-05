import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectivityService, ConnectivityState } from '../services/connectivityService';

interface ConnectivityContextType extends ConnectivityState {
  checkConnectivity: (force?: boolean) => Promise<boolean>;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  status: 'online',
  statusMessage: 'Connected',
  hintText: 'Connected to AnuJay Dental Clinic.',
  lastChecked: Date.now(),
  checkConnectivity: async () => true
});

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConnectivityState>(() => connectivityService.getState());

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const checkConnectivity = async (force = true) => {
    return await connectivityService.verifyConnectivity(force);
  };

  return (
    <ConnectivityContext.Provider value={{ ...state, checkConnectivity }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => useContext(ConnectivityContext);
