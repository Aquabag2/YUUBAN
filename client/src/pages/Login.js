import { useState } from 'react';
import { Music2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import supabase from '../lib/supabase';

const MODES = { login: 'login', register: 'register', forgot: 'forgot', confirm: 'confirm' };

const Login = () => {
  const [mode, setMode]               = useState(MODES.login);
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [confirmType, setConfirmType] = useState('register'); // 'register' | 'forgot'

  const clearError = () => setError('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); clearError();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(translateError(error.message));
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    setLoading(true); clearError();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(translateError(error.message));
    } else {
      setConfirmType('register');
      setMode(MODES.confirm);
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); clearError();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(translateError(error.message));
    } else {
      setConfirmType('forgot');
      setMode(MODES.confirm);
    }
    setLoading(false);
  };

  const translateError = (msg) => {
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg.includes('Email not confirmed'))       return 'Confirma tu correo antes de iniciar sesión.';
    if (msg.includes('User already registered'))   return 'Este correo ya está registrado.';
    if (msg.includes('Password should be'))        return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('rate limit'))                return 'Demasiados intentos. Espera un momento.';
    return msg;
  };

  /* ── Pantalla de confirmación ── */
  if (mode === MODES.confirm) {
    return (
      <Screen>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">
            {confirmType === 'register' ? '¡Revisa tu correo!' : 'Enlace enviado'}
          </h2>
          <p className="mt-2 text-sm text-white/50 leading-relaxed">
            {confirmType === 'register'
              ? `Enviamos un enlace de confirmación a ${email}. Haz clic en él para activar tu cuenta.`
              : `Enviamos instrucciones para restablecer tu contraseña a ${email}.`}
          </p>
          <button
            type="button"
            onClick={() => { setMode(MODES.login); clearError(); }}
            className="mt-6 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/30">
          <Music2 size={26} className="text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Yuuban</h1>
        <p className="mt-1 text-sm text-white/40">Plataforma de gestión de festivales</p>
      </div>

      {/* Tabs login / register */}
      {mode !== MODES.forgot && (
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => { setMode(MODES.login); clearError(); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === MODES.login
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode(MODES.register); clearError(); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === MODES.register
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Crear cuenta
          </button>
        </div>
      )}

      {/* Título forgot */}
      {mode === MODES.forgot && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Recuperar contraseña</h2>
          <p className="mt-1 text-sm text-white/40">
            Te enviamos un enlace a tu correo para restablecerla.
          </p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={mode === MODES.login ? handleLogin : mode === MODES.register ? handleRegister : handleForgot}
            className="space-y-4">

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Correo electrónico</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        {mode !== MODES.forgot && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={mode === MODES.register ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === MODES.register ? 'Mínimo 8 caracteres' : '••••••••'}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {mode === MODES.register && (
              <p className="mt-1.5 text-xs text-white/30">
                Usa letras, números y símbolos para mayor seguridad.
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 transition-all"
        >
          {loading
            ? <Loader2 size={16} className="animate-spin" />
            : mode === MODES.login    ? <><ArrowRight size={16} /> Iniciar sesión</>
            : mode === MODES.register ? <><ArrowRight size={16} /> Crear cuenta</>
            :                           <><Mail size={16} /> Enviar enlace</>
          }
        </button>
      </form>

      {/* Links secundarios */}
      <div className="mt-5 text-center text-sm">
        {mode === MODES.login && (
          <button
            type="button"
            onClick={() => { setMode(MODES.forgot); clearError(); }}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
        {mode === MODES.forgot && (
          <button
            type="button"
            onClick={() => { setMode(MODES.login); clearError(); }}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            ← Volver al inicio de sesión
          </button>
        )}
      </div>
    </Screen>
  );
};

const Screen = ({ children }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
    {/* Blobs decorativos */}
    <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
    <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/5 blur-2xl" />

    <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
      {children}
    </div>
  </div>
);

export default Login;
