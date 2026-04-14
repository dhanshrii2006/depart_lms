import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';

/**
 * AppShell component - main layout wrapper
 * Manages sidebar/navbar layout with responsive design
 */
const AppShell = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f0f23] light:bg-white flex">
      {/* Sidebar */}
      <Sidebar 
        isMobile={true}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="flex-1 mt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

AppShell.displayName = 'AppShell';

export default AppShell;
export { AppShell };
