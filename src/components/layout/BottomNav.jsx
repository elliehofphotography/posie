import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Store } from 'lucide-react';

const navItems = [
  { path: '/Home', icon: Home, label: 'Templates' },
  { path: '/Discover', icon: Compass, label: 'Discover' },
  { path: '/Marketplace', icon: Store, label: 'Market' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all duration-200 select-none ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] tracking-wide font-dm ${isActive ? 'font-semibold' : 'font-normal'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}