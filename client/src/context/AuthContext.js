import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase, { isRecoveryLink } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext(null);

// Admins pueden usar la app como alumno con su propia cuenta (se recuerda en este navegador)
const STAFF = ['admin', 'super_admin'];
const VIEW_KEY = 'yb-view-as';
const readViewAs = () => { try { return localStorage.getItem(VIEW_KEY); } catch { return null; } };

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [realProfile, setProfile] = useState(null);
  const [viewAsPref, setViewAsPref] = useState(readViewAs);
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

  // Modos a los que puede entrar cada rol real (nunca a uno mayor que el suyo)
  const realRole = realProfile?.role;
  const viewModes = realRole === 'super_admin' ? ['student', 'admin', 'super_admin']
    : realRole === 'admin' ? ['student', 'admin'] : [];
  const canSwitch = STAFF.includes(realRole);
  const viewAs = viewModes.includes(viewAsPref) ? viewAsPref : realRole;
  // El resto de la app solo mira profile.role: en modo alumno lo ve como 'student'
  const profile = canSwitch && viewAs !== realRole ? { ...realProfile, role: viewAs } : realProfile;

  const setViewAs = (mode) => {
    try { localStorage.setItem(VIEW_KEY, mode); } catch {}
    setViewAsPref(mode);
    navigate(mode === 'super_admin' ? '/super' : '/dashboard', { replace: true });
  };

  const signOut = () => supabase.auth.signOut();
  const finishRecovery = () => setRecovering(false);

  return (
    <AuthContext.Provider value={{ user, profile, realProfile, canSwitch, viewModes, viewAs, setViewAs, loading, recovering, signOut, finishRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
