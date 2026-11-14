import React, { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext();

export const PrivacyProvider = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('flusso_privacy') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('flusso_privacy', String(isPrivacyMode));
  }, [isPrivacyMode]);

  const togglePrivacy = () => {
    setIsPrivacyMode(prev => !prev);
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);

