import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Plus, BarChart3, User } from 'lucide-react';
import { useStore } from '@/store';

export default function BottomNav() {
  const navigate = useNavigate();
  const painDay = useStore((s) => s.painDayMode);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 px-2 py-1 transition-colors min-h-[44px] justify-center ${
      isActive ? 'text-primary' : 'text-ink-2 hover:text-ink'
    }`;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-50 ${
        painDay ? 'py-3' : 'py-2'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-app mx-auto flex items-center justify-around px-2">
        <NavLink to="/" className={navItemClass} aria-label="Today">
          <Home size={painDay ? 26 : 22} />
          <span className={`text-[11px] ${painDay ? 'text-base' : ''}`}>Today</span>
        </NavLink>

        <NavLink to="/calendar" className={navItemClass} aria-label="Calendar">
          <Calendar size={painDay ? 26 : 22} />
          <span className={`text-[11px] ${painDay ? 'text-base' : ''}`}>Calendar</span>
        </NavLink>

        <button
          onClick={() => navigate('/log')}
          className="flex items-center justify-center bg-primary text-white rounded-full shadow-lg hover:scale-105 transition-transform -mt-6"
          style={{ width: painDay ? 64 : 56, height: painDay ? 64 : 56, minWidth: painDay ? 64 : 56 }}
          aria-label="Log"
        >
          <Plus size={painDay ? 32 : 28} />
        </button>

        <NavLink to="/insights" className={navItemClass} aria-label="Insights">
          <BarChart3 size={painDay ? 26 : 22} />
          <span className={`text-[11px] ${painDay ? 'text-base' : ''}`}>Insights</span>
        </NavLink>

        <NavLink to="/you" className={navItemClass} aria-label="You">
          <User size={painDay ? 26 : 22} />
          <span className={`text-[11px] ${painDay ? 'text-base' : ''}`}>You</span>
        </NavLink>
      </div>
    </nav>
  );
}