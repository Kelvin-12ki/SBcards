import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:ml-64 lg:p-8">
          <Outlet />
        </main>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Layout;
