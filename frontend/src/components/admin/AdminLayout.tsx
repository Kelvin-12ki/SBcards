import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminNavbar onMenuToggle={toggleSidebar} />

      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:ml-64 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
