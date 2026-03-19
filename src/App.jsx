import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Template from './pages/Template';
import ShootMode from './pages/ShootMode';
import ChecklistOverview from './pages/ChecklistOverview';
import ShotList from './pages/ShotList';
import Discover from './pages/Discover.jsx';
import Marketplace from './pages/Marketplace';
import AllPhotos from './pages/AllPhotos';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import GuideDetail from './pages/GuideDetail';
import DiscoverFavorites from './pages/DiscoverFavorites';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Template" element={<Template />} />
        <Route path="/ChecklistOverview" element={<ChecklistOverview />} />
        <Route path="/ShotList" element={<ShotList />} />
        <Route path="/Discover" element={<Discover />} />
        <Route path="/Marketplace" element={<Marketplace />} />
        <Route path="/AllPhotos" element={<AllPhotos />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/GuideDetail" element={<GuideDetail />} />
        <Route path="/DiscoverFavorites" element={<DiscoverFavorites />} />
      </Route>
      <Route path="/ShootMode" element={<ShootMode />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App