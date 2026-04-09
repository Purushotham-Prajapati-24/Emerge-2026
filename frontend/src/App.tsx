import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { useAuthStore } from './store/useAuthStore';

import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import ProjectsPage from './pages/ProjectsPage';
import WorkspacePage from './pages/WorkspacePage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallback from './pages/OAuthCallback';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Recover session from refresh token on app boot
const SessionHydrator = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, accessToken, user } = useAuthStore();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // If we have an accessToken but NO user data (e.g. after page refresh)
    // Or if we have NOTHING at all - we attempt a silent refresh.
    if ((!accessToken || !user) && !hasAttempted.current) {
      hasAttempted.current = true;
      
      // Attempt silent refresh using httpOnly cookie
      fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/refresh`,
        { method: 'POST', credentials: 'include' }
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.accessToken) {
            setAuth(data.accessToken, data.user);
          }
        })
        .catch(() => null);
    }
  }, [accessToken, user, setAuth]);

  return <>{children}</>;
};

// Guard — redirects unauthenticated users to /auth
const ProtectedRoute = () => {
  const { accessToken } = useAuthStore();
  return accessToken ? <Outlet /> : <Navigate to="/auth" replace />;
};

// Guard — redirects authenticated users away from /auth
const PublicRoute = () => {
  const { accessToken } = useAuthStore();
  return !accessToken ? <Outlet /> : <Navigate to="/projects" replace />;
};

function AppRoutes() {
  return (
    <SessionHydrator>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/projects" replace />} />

        {/* Auth — only accessible when not logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/workspace/:projectId" element={<WorkspacePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionHydrator>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ClerkProvider>
  );
}
