import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/hospitals': 'Hospital Management',
  '/patients': 'Patient Records',
  '/search': 'Smart Search',
  '/map': 'Interactive City Map',
  '/ai-assistant': 'AI Assistant',
  '/alerts': 'Alerts',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const baseTitle = Object.keys(titles).find((k) => location.pathname.startsWith(k));
  const title = baseTitle ? titles[baseTitle] : 'AMR Watch';

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
