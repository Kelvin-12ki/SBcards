import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';
import OfflineBanner from '@/components/ui/OfflineBanner';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar onMenuToggle={toggleSidebar} />

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:ml-64 lg:p-8">
          <OfflineBanner />
          <Outlet />
        </main>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Layout;
