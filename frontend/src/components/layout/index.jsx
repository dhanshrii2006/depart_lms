import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

/**
 * AppShell - main application layout wrapper
 * Combines Sidebar, Navbar, and content area
 * Premium SaaS design with responsive layout
 */
const AppShell = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex">
      {/* Sidebar - Desktop & Mobile */}
      <Sidebar isMobile isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <Sidebar />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* Navbar */}
        <Navbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Main Content */}
        <main className="flex-1 mt-16 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 md:px-6 py-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

AppShell.displayName = 'AppShell';

export default AppShell;
export { AppShell, Sidebar, Navbar };
