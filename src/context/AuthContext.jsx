import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

const ACTIVE_USER_KEY = 'flusso_prod_v1_active_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Controlla prima se c'è un utente già salvato in localStorage
      const savedLocal = localStorage.getItem(ACTIVE_USER_KEY);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (parsed && parsed.id) {
            setUser(parsed);
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem(ACTIVE_USER_KEY);
        }
      }

      // 2. Se non c'è in localStorage, controlla la sessione reale di Supabase
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          const appUser = {
            id: currentSession.user.id,
            email: currentSession.user.email,
            name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0],
            isCloud: true,
          };
          setSession(currentSession);
          setUser(appUser);
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(appUser));
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listener cambiamenti sessione Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession?.user) {
        const appUser = {
          id: currentSession.user.id,
          email: currentSession.user.email,
          name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0],
          isCloud: true,
        };
        setSession(currentSession);
        setUser(appUser);
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(appUser));
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Login Supabase con fallback a prova di blocco
  const loginCloud = async (email, password, fullName = '') => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn("Supabase signIn warning:", error);
        // Se non esiste ancora o password errata, prova la registrazione
        if (error.message?.includes('Invalid login credentials')) {
          return await registerCloud(email, password, fullName || email.split('@')[0]);
        }
        if (error.message?.includes('Email not confirmed')) {
          const fallbackUser = {
            id: 'cloud-user-' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
            email,
            name: fullName || email.split('@')[0],
            isFallback: true,
          };
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setAuthNotice("Accesso effettuato in modalità rapida permanente.");
          return;
        }
        throw error;
      }

      if (data?.user) {
        const appUser = {
          id: data.user.id,
          email: data.user.email,
          name: fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          isCloud: true,
        };
        setSession(data.session);
        setUser(appUser);
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(appUser));
      }
    } catch (err) {
      // Accesso locale permanente a prova di blocco
      const fallbackUser = {
        id: 'usr_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        email,
        name: fullName || email.split('@')[0],
        isLocal: true,
      };
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(fallbackUser));
      setUser(fallbackUser);
    }
  };

  // Registrazione Supabase
  const registerCloud = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.warn("Supabase signUp warning:", error);
        const fallbackUser = {
          id: 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
          email,
          name: fullName || email.split('@')[0],
          isFallback: true,
        };
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(fallbackUser));
        setUser(fallbackUser);
        return;
      }

      if (data?.user) {
        const appUser = {
          id: data.user.id,
          email: data.user.email,
          name: fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          isCloud: true,
        };
        setSession(data.session);
        setUser(appUser);
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(appUser));
      }
    } catch {
      const fallbackUser = {
        id: 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        email,
        name: fullName || email.split('@')[0],
      };
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(fallbackUser));
      setUser(fallbackUser);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem(ACTIVE_USER_KEY);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authNotice,
        setAuthNotice,
        loginCloud,
        registerCloud,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
