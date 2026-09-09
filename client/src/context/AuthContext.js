import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  };

  // Aplica la sesión y espera a que el perfil cargue antes de quitar loading
  const applySession = async (session) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      await fetchProfile(session.user.id);
    } else {
      delete api.defaults.headers.common['Authorization'];
      setProfile(null);
    }
  };

  useEffect(() => {
    // Carga inicial: esperar perfil antes de quitar loading
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySession(session);
      setLoading(false);
    });

    // Cambios de sesión posteriores (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // No aplicar sesión si es recovery — ResetPassword la maneja directamente
      if (event === 'PASSWORD_RECOVERY') return;
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
