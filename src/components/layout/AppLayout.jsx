import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav, { getActiveTab, TAB_ROOTS } from './BottomNav';

const HIDE_NAV_PATHS = ['/ShootMode'];

// Apply dark mode based on system preference
function useDarkMode() {
  useEffect(() => {
    const apply = (dark) => {
      document.documentElement.classList.toggle('dark', dark);
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const handler = (e) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

export default function AppLayout() {
  useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));
  const activeTab = getActiveTab(location.pathname);

  // Track the last visited path for each tab
  const tabHistory = useRef({
    '/Home': '/Home',
    '/Discover': '/Discover',
    '/Marketplace': '/Marketplace',
  });

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Update tab history on every navigation
  useEffect(() => {
    const tab = getActiveTab(location.pathname);
    if (tab) {
      tabHistory.current[tab] = location.pathname + location.search;
    }
  }, [location.pathname, location.search]);

  const handleTabPress = (tabPath) => {
    if (tabPath === activeTab) {
      // Tap active tab → go to root of that tab
      navigate(tabPath);
    } else {
      // Switch to last visited path within that tab
      const dest = tabHistory.current[tabPath] || tabPath;
      navigate(dest);
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <main className={hideNav ? 'flex-1' : 'flex-1 pb-20'}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!hideNav && <BottomNav onTabPress={handleTabPress} />}
    </div>
  );
}