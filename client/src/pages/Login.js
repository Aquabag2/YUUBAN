import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import supabase from '../lib/supabase';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const MODES = { login: 'login', register: 'register', forgot: 'forgot', sent: 'sent' };
const GOOGLE_ENABLED = process.env.REACT_APP_GOOGLE_AUTH === 'true';
const RESEND_COOLDOWN = 60;

// Solo rutas internas ("/e/festival"), nunca "//otro-sitio.com"
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/dashboard');

// 0–4 según largo y variedad de caracteres
const passwordScore = (p) => {
  if (!p) return 0;
  let s = p.length >= 8 ? 1 : 0;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const SCORE_LABEL = ['Muy corta', 'Aceptable', 'Buena', 'Fuerte', 'Excelente'];

const translateError = (msg = '') => {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed'))       return 'Aún no confirmas tu correo.';
  if (msg.includes('rate limit'))                return 'Demasiados intentos. Espera un momento.';
  if (msg.includes('Network'))                   return 'Sin conexión. Revisa tu internet.';
  return msg || 'Algo salió mal. Intenta de nuevo.';
};

const Login = () => {
  const { user, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const fromEvent = next.startsWith('/e/');
  const [mode, setMode]         = useState(params.get('modo') === 'registro' ? MODES.register : MODES.login);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [sentKind, setSentKind] = useState('signup'); // 'signup' | 'magic' | 'forgot'
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!authLoading && user) return <Navigate to={next} replace />;

  const go = (m) => { setMode(m); setError(''); setUnconfirmed(false); };

  const showSent = (kind) => { setSentKind(kind); setMode(MODES.sent); setCooldown(RESEND_COOLDOWN); };

  // Llama a /api/auth/* y devuelve true si salió bien
  const post = async (path, body) => {
    try {
      await api.post(path, { ...body, next });
      return true;
    } catch (err) {
      setError(err.response?.data?.error ?? 'No pudimos enviar el correo. Intenta de nuevo.');
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setUnconfirmed(false);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(translateError(error.message));
      setUnconfirmed(error.message.includes('Email not confirmed'));
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    setLoading(true); setError('');
    if (await post('/auth/signup', { email: email.trim(), password })) showSent('signup');
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (await post('/auth/forgot', { email: email.trim() })) showSent('forgot');
    setLoading(false);
  };

  const handleMagic = async () => {
    if (!email.trim()) return setError('Escribe tu correo y te mandamos un enlace para entrar.');
    setLoading(true); setError('');
    if (await post('/auth/magic-link', { email: email.trim() })) showSent('magic');
    setLoading(false);
  };

  const handleResend = async () => {
    if (cooldown) return;
    setError('');
    const path = sentKind === 'forgot' ? '/auth/forgot' : '/auth/magic-link';
    if (await post(path, { email: email.trim() })) setCooldown(RESEND_COOLDOWN);
  };

  const handleGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) setError(translateError(error.message));
  };

  /* ── Correo enviado ── */
  if (mode === MODES.sent) {
    const copy = {
      signup: ['Confirma tu correo', 'Te enviamos un enlace para activar tu cuenta. Ábrelo y entrarás directo.'],
      magic:  ['Revisa tu correo', 'Te enviamos un enlace para entrar sin contraseña.'],
      forgot: ['Revisa tu correo', 'Te enviamos un enlace para elegir una nueva contraseña.'],
    }[sentKind];
    return (
      <Screen>
        <div className="flex h-12 w-12 items-center justify-center border border-yb-line bg-yb-bg">
          <Mail size={20} className="text-yb-helecho" />
        </div>
        <h2 className="mt-6 font-yb-serif text-3xl text-yb-text">{copy[0]}</h2>
        <p className="mt-3 text-sm leading-relaxed text-yb-muted">
          {copy[1]} Lo mandamos a <span className="text-yb-text">{email}</span>.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-yb-muted/80">
          ¿No llega? Revisa la carpeta de spam o promociones. El enlace dura 1 hora.
        </p>
        {error && <ErrorBox>{error}</ErrorBox>}
        <button type="button" onClick={handleResend} disabled={cooldown > 0}
          className="mt-6 w-full border border-yb-line py-3 text-sm font-medium text-yb-text transition hover:border-yb-helecho/60 disabled:cursor-not-allowed disabled:opacity-50">
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar correo'}
        </button>
        <button type="button" onClick={() => go(MODES.login)}
          className="mt-4 w-full text-sm text-yb-muted transition-colors hover:text-yb-text">
          Usar otro correo
        </button>
      </Screen>
    );
  }

  const isLogin = mode === MODES.login;
  const isRegister = mode === MODES.register;
  const score = passwordScore(password);

  return (
    <Screen>
      {mode === MODES.forgot ? (
        <div className="mb-7">
          <h1 className="font-yb-serif text-3xl text-yb-text">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-yb-muted">Te mandamos un enlace para elegir una nueva.</p>
        </div>
      ) : (
        <>
          <h1 className="font-yb-serif text-3xl text-yb-text">
            {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h1>
          <p className="mt-2 text-sm text-yb-muted">
            {fromEvent
              ? 'Para ver el evento e inscribirte necesitas una cuenta. Toma un minuto.'
              : isLogin ? 'Entra para ver tus boletos y novedades.' : 'Solo tu correo y una contraseña. Toma un minuto.'}
          </p>
          <div className="mb-7 mt-6 grid grid-cols-2 border border-yb-line p-1 text-sm" role="tablist">
            {[[MODES.login, 'Entrar'], [MODES.register, 'Crear cuenta']].map(([m, label]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => go(m)}
                className={`py-2 font-medium transition ${mode === m ? 'bg-yb-helecho text-yb-bg' : 'text-yb-muted hover:text-yb-text'}`}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {GOOGLE_ENABLED && mode !== MODES.forgot && (
        <>
          <button type="button" onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 border border-yb-line bg-yb-bg py-3 text-sm font-medium text-yb-text transition hover:border-yb-helecho/60">
            <GoogleIcon /> Continuar con Google
          </button>
          <Divider />
        </>
      )}

      <form onSubmit={isLogin ? handleLogin : isRegister ? handleRegister : handleForgot} className="space-y-4">
        <Field label="Correo electrónico" icon={Mail}>
          <input type="email" required autoFocus autoComplete="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com"
            className={inputCls} />
        </Field>

        {mode !== MODES.forgot && (
          <div>
            <Field label="Contraseña" icon={Lock}
              aside={isLogin && (
                <button type="button" onClick={() => go(MODES.forgot)} className="text-xs text-yb-muted hover:text-yb-text">
                  ¿La olvidaste?
                </button>
              )}>
              <input type={showPass ? 'text' : 'password'} required minLength={isRegister ? 8 : 1} maxLength={72}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
                className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-yb-muted hover:text-yb-text">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </Field>
            {isRegister && password && (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 transition-colors ${score >= i ? (score >= 3 ? 'bg-yb-helecho' : 'bg-yb-laton') : 'bg-yb-line'}`} />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-yb-muted">{SCORE_LABEL[score]}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <ErrorBox>
            {error}
            {unconfirmed && (
              <button type="button" onClick={handleMagic} className="ml-1 underline underline-offset-2">
                Reenviarme el enlace
              </button>
            )}
          </ErrorBox>
        )}

        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 bg-yb-helecho py-3 text-sm font-semibold text-yb-bg transition hover:brightness-105 disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" />
            : isLogin    ? <>Entrar <ArrowRight size={16} /></>
            : isRegister ? <>Crear cuenta <ArrowRight size={16} /></>
            :              <>Enviar enlace <Mail size={16} /></>}
        </button>
      </form>

      {isLogin && (
        <>
          <Divider />
          <button type="button" onClick={handleMagic} disabled={loading}
            className="flex w-full items-center justify-center gap-2 border border-yb-line py-3 text-sm font-medium text-yb-text transition hover:border-yb-helecho/60 disabled:opacity-60">
            <Sparkles size={15} className="text-yb-laton" /> Entrar sin contraseña
          </button>
          <p className="mt-2 text-center text-xs text-yb-muted">Te mandamos un enlace a tu correo.</p>
        </>
      )}

      {isRegister && (
        <p className="mt-5 text-center text-xs leading-relaxed text-yb-muted">
          Te enviaremos un correo para confirmar que es tuyo.
        </p>
      )}

      {mode === MODES.forgot && (
        <button type="button" onClick={() => go(MODES.login)}
          className="mt-5 w-full text-center text-sm text-yb-muted hover:text-yb-text">
          ← Volver a iniciar sesión
        </button>
      )}
    </Screen>
  );
};

const inputCls = 'w-full border border-yb-line bg-yb-bg py-3 pl-10 pr-4 text-sm text-yb-text placeholder-yb-muted/50 outline-none transition focus:border-yb-helecho/70 focus:ring-1 focus:ring-yb-helecho/30';

const Field = ({ label, icon: Icon, aside, children }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-yb-muted">
      {label}{aside}
    </span>
    <span className="relative block">
      <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-yb-muted/70" />
      {children}
    </span>
  </label>
);

const ErrorBox = ({ children }) => (
  <div role="alert" className="mt-4 flex items-start gap-2 border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
    <AlertCircle size={15} className="mt-0.5 shrink-0" />
    <span>{children}</span>
  </div>
);

const Divider = () => (
  <div className="my-5 flex items-center gap-3 text-xs text-yb-muted">
    <div className="h-px flex-1 bg-yb-line" /> o <div className="h-px flex-1 bg-yb-line" />
  </div>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const Screen = ({ children }) => (
  <div className="flex min-h-screen flex-col bg-yb-bg px-4 py-10 font-yb-sans text-yb-text">
    <Link to="/" className="mx-auto w-full max-w-sm font-yb-serif text-2xl text-yb-helecho">Yuuban</Link>
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm animate-yb-rise border border-yb-line bg-yb-raised p-7 sm:p-8">
        {children}
      </div>
    </div>
  </div>
);

export default Login;
