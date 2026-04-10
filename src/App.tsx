/** App router — wires all pages together with auth guards */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Diary from './pages/Diary';
import Foods from './pages/Foods';
import Calculators from './pages/Calculators';
import MealPlanner from './pages/MealPlanner';
import Fasting from './pages/Fasting';
import Nearby from './pages/Nearby';

/** Redirect authenticated users who haven't completed onboarding */
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile && !profile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/calculators" element={<Layout><Calculators /></Layout>} />
      <Route path="/foods" element={<Layout><Foods /></Layout>} />

      {/* Protected app routes */}
      <Route path="/dashboard" element={
        <Layout requiresAuth>
          <OnboardingGuard><Dashboard /></OnboardingGuard>
        </Layout>
      } />
      <Route path="/diary" element={
        <Layout requiresAuth>
          <OnboardingGuard><Diary /></OnboardingGuard>
        </Layout>
      } />
      <Route path="/meal-planner" element={
        <Layout requiresAuth>
          <OnboardingGuard><MealPlanner /></OnboardingGuard>
        </Layout>
      } />
      <Route path="/fasting" element={
        <Layout requiresAuth>
          <OnboardingGuard><Fasting /></OnboardingGuard>
        </Layout>
      } />
      <Route path="/nearby" element={
        <Layout requiresAuth>
          <Nearby />
        </Layout>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
