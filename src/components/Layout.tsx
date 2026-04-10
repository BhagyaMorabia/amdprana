/** App navigation layout — sidebar for desktop, bottom bar for mobile */

import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, BookOpen, Search, Calculator,
  CalendarDays, Timer, MapPin, LogOut, Loader2, Leaf,
  Menu, X
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/diary',     icon: BookOpen,         label: 'Diary' },
  { path: '/foods',     icon: Search,           label: 'Foods' },
  { path: '/calculators', icon: Calculator,     label: 'Calculators' },
  { path: '/meal-planner', icon: CalendarDays,  label: 'Meal Plan' },
  { path: '/fasting',   icon: Timer,            label: 'Fasting' },
  { path: '/nearby',    icon: MapPin,           label: 'Nearby' },
];

interface LayoutProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
}

export default function Layout({ children, requiresAuth = false }: LayoutProps) {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center animate-pulse">
            <Leaf className="w-6 h-6 text-brand-400" aria-hidden="true" />
          </div>
          <Loader2 className="w-5 h-5 text-brand-400 animate-spin" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (requiresAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  // Public layout (no sidebar)
  if (!user || !requiresAuth) {
    return (
      <div className="min-h-screen bg-surface">
        <a href="#main-content" className="skip-link">Skip to main content</a>

        {/* Top nav for public pages */}
        <header className="sticky top-0 z-40 glass border-b border-surface-border">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
            aria-label="Main navigation">
            <Link to="/" className="flex items-center gap-2 group" aria-label="Prana home">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center
                group-hover:bg-brand-500/30 transition-colors">
                <Leaf className="w-4 h-4 text-brand-400" aria-hidden="true" />
              </div>
              <span className="font-display font-bold text-lg text-white">Prana</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/calculators" className="btn-ghost text-sm">Calculators</Link>
              <Link to="/foods" className="btn-ghost text-sm">Food Database</Link>
              {user
                ? <Link to="/dashboard" className="btn-primary text-sm ml-2">Go to App</Link>
                : <Link to="/auth" className="btn-primary text-sm ml-2">Get Started Free</Link>
              }
            </div>

            {!user && (
              <Link to="/auth" className="md:hidden btn-primary text-sm py-2 px-4">Sign In</Link>
            )}
          </nav>
        </header>

        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer className="border-t border-surface-border mt-20 py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-brand-400" aria-hidden="true" />
                  <span className="font-display font-bold text-white">Prana</span>
                </div>
                <p className="text-zinc-500 text-sm max-w-xs">
                  AI-powered food intelligence. Track, plan, and build habits that last.
                </p>
              </div>
              <nav className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm" aria-label="Footer navigation">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.path} to={item.path}
                    className="text-zinc-500 hover:text-brand-400 transition-colors">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="border-t border-surface-border mt-8 pt-8 flex flex-col md:flex-row
              justify-between items-center gap-4 text-xs text-zinc-600">
              <p>© 2024 Prana. Built for the AMDI Promptathon.</p>
              <p>Powered by Gemini AI · Firebase · USDA FoodData</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated layout with sidebar
  return (
    <div className="min-h-screen bg-surface flex">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-card border-r border-surface-border
          flex flex-col z-40 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        aria-label="Sidebar navigation"
        role="navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-border">
          <Link to="/dashboard" className="flex items-center gap-2" aria-label="Go to dashboard">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-brand-400" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-white">Prana</span>
          </Link>
          <button
            className="md:hidden p-1 rounded-lg hover:bg-surface-elevated"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1" aria-label="App navigation">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-400
                  ${active
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-surface-elevated'
                  }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="p-3 border-t border-surface-border">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" aria-hidden="true" />
              : (
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-brand-400" aria-hidden="true">
                    {(profile?.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </span>
                </div>
              )
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.displayName ?? user.displayName ?? 'User'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full btn-ghost text-sm text-zinc-400 justify-start"
            aria-label="Sign out of Prana"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-surface-card border-b border-surface-border
        flex items-center justify-between px-4 z-20 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-elevated"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="w-5 h-5 text-zinc-400" aria-hidden="true" />
        </button>
        <span className="font-display font-bold text-white">Prana</span>
        <div className="w-9" />
      </div>

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 md:ml-64 min-h-screen mt-14 md:mt-0 p-4 md:p-8"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
