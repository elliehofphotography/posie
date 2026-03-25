import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Store } from 'lucide-react';

export const TAB_ROOTS = [
  { path: '/Home', icon: Home, label: 'Home' },
  { path: '/Discover', icon: Compass, label: 'Discover' },
  { path: '/Marketplace', icon: Store, label: 'Market' },
];

export function getActiveTab(pathname) {
  // Find which tab root this path belongs to
  if (pathname.startsWith('/Discover')) return '/Discover';
  if (pathname.startsWith('/Marketplace') || pathname.startsWith('/GuideDetail')) return '/Marketplace';
  // Default: Home tab (covers /Home, /Template, /ShotList, /ChecklistOverview, /AllPhotos, /Settings, etc.)
  return '/Home';
}

export default function BottomNav({ onTabPress }) {
  const location = useLocation();
  const activeTab = getActiveTab(location.pathname);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
         {TAB_ROOTS.map(({ path, icon: Icon, label }) => {
           const isActive = activeTab === path;
           return (
             <button
               key={path}
               onClick={() => onTabPress(path)}
               aria-label={label}
               aria-current={isActive ? 'page' : undefined}
               className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[56px] px-2 rounded-xl transition-all duration-200 select-none ${
                 isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
               }`}
             >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] tracking-wide font-dm ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}