import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkflowProvider } from './context/WorkflowContext';
import Layout from './pages/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Teacher from './pages/Teacher';
import Flow from './pages/Flow';
import SuperAdmin from './pages/SuperAdmin';
import Student from './pages/Student';
import Cursos from './pages/Cursos';
import EventPage from './pages/EventPage';
import MyEventPanel from './pages/MyEventPanel';
import TicketPage from './pages/TicketPage';
import CheckIn from './pages/CheckIn';
import ResetPassword from './pages/ResetPassword';

// Root: Landing si no hay sesión, dashboard si sí hay
const Root = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
    </div>
  );
  if (!user) return <Landing />;
  return <Navigate to="/dashboard" replace />;
};

// Dashboard por rol — primera pantalla al entrar
const Dashboard = () => {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile?.role === 'student')    return <Navigate to="/cursos"      replace />;
  if (profile?.role === 'super_admin') return <Navigate to="/super"      replace />;
  return <Navigate to="/admin" replace />;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    if (profile?.role === 'student')    return <Navigate to="/cursos"  replace />;
    if (profile?.role === 'super_admin') return <Navigate to="/super"  replace />;
    return <Navigate to="/admin" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkflowProvider>
          <Toaster position="top-right" toastOptions={{
            style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' },
          }} />
          <Routes>
            {/* ── Rutas completamente públicas (sin Layout, sin auth) ── */}
            <Route path="/e/:slug"          element={<EventPage />} />
            <Route path="/ticket/:token"    element={<TicketPage />} />
            <Route path="/checkin/:slug"    element={<CheckIn />} />
            <Route path="/login"            element={<Login />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* ── Root: Landing o dashboard según sesión ── */}
            <Route path="/" element={<Root />} />

            {/* ── App protegida con Layout ── */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>

              <Route path="dashboard"            element={<Dashboard />} />

              {/* Cursos — todos los roles ven eventos disponibles */}
              <Route path="cursos"               element={<Cursos />} />

              {/* Estudiante */}
              <Route path="estudiante" element={
                <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                  <Student />
                </ProtectedRoute>
              } />

              {/* Admin y super_admin */}
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="mi-evento" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <MyEventPanel />
                </ProtectedRoute>
              } />
              <Route path="maestros" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <Teacher />
                </ProtectedRoute>
              } />
              <Route path="flujo" element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <Flow />
                </ProtectedRoute>
              } />

              {/* Solo super_admin */}
              <Route path="super" element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdmin />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkflowProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
