import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase, { isRecoveryLink } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // true mientras el usuario entró con un link de recuperación y aún no cambia su contraseña
  const [recovering, setRecovering] = useState(isRecoveryLink);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const fetchProfile = async (token) => {
    try {
      const { data } = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data ?? null);
    } catch {
      setProfile(null);
    }
  };

  // Aplica la sesión y espera a que el perfil cargue antes de quitar loading
  const applySession = async (session) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      await fetchProfile(session.access_token);
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

    // Cambios de sesión posteriores (login/logout/recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Con sesión de recuperación, cualquier ruta lleva a cambiar la contraseña
  useEffect(() => {
    if (recovering && pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true });
    }
  }, [recovering, pathname, navigate]);

  const signOut = () => supabase.auth.signOut();
  const finishRecovery = () => setRecovering(false);

  return (
    <AuthContext.Provider value={{ user, profile, loading, recovering, signOut, finishRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
