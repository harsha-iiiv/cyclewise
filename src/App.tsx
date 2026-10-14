import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from '@/store';
import BottomNav from '@/components/BottomNav';
import Today from '@/pages/Today';
import Calendar from '@/pages/Calendar';
import Log from '@/pages/Log';
import LeakLog from '@/pages/LeakLog';
import PbacLog from '@/pages/PbacLog';
import Insights from '@/pages/Insights';
import You from '@/pages/You';
import Onboarding from '@/pages/Onboarding';
import Started from '@/pages/Started';
import Prepare from '@/pages/Prepare';
import Care from '@/pages/Care';
import PSST from '@/pages/PSST';
import Report from '@/pages/Report';
import LearnCardView from '@/pages/LearnCardView';
import Privacy from '@/pages/Privacy';
import Modes from '@/pages/Modes';
import Settings from '@/pages/Settings';
import Reminders from '@/pages/Reminders';
import PlanAhead from '@/pages/PlanAhead';

function ThemeManager() {
  const user = useStore((s) => s.user);
  useEffect(() => {
    const theme = user?.theme ?? 'system';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) root.classList.add('dark');
      else root.classList.remove('dark');
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [user?.theme]);
  return null;
}

function NavWrapper() {
  const location = useLocation();
  const hideNav = ['/onboarding', '/started'].some((p) => location.pathname.startsWith(p));
  if (hideNav) return null;
  return <BottomNav />;
}

function AppRoutes() {
  const user = useStore((s) => s.user);
  const hasHydrated = useStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="font-serif text-primary text-xl">Cyclewise</p>
      </div>
    );
  }

  if (!user || !user.onboarded) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <>
      <ThemeManager />
      <div className="min-h-screen bg-bg max-w-app mx-auto pb-24">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/log" element={<Log />} />
          <Route path="/log/leak" element={<LeakLog />} />
          <Route path="/log/pbac" element={<PbacLog />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/you" element={<You />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/started" element={<Started />} />
          <Route path="/prepare" element={<Prepare />} />
          <Route path="/care" element={<Care />} />
          <Route path="/screening/psst" element={<PSST />} />
          <Route path="/report" element={<Report />} />
          <Route path="/learn/:id" element={<LearnCardView />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/modes" element={<Modes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/plan-ahead" element={<PlanAhead />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <NavWrapper />
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;