import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

/**
 * Tabs component with animated underline indicator
 * Premium SaaS design with smooth transitions
 */
const Tabs = ({ tabs, defaultTab = 0, onChange, variant = 'underline' }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  return (
    <div>
      <div className={clsx(
        'flex border-b border-gray-200 dark:border-gray-800',
        variant === 'underline' && 'gap-8'
      )}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            className={clsx(
              'pb-3.5 font-medium transition-colors relative text-sm',
              'focus:outline-none focus-ring',
              activeTab === index
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {tab.label}
            {activeTab === index && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600 dark:bg-accent-500"
                transition={{ duration: 0.3, type: 'spring', bounce: 0.15 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="mt-6 animate-fade-in">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tabs[activeTab]?.content}
        </motion.div>
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs';

export default Tabs;
export { Tabs };
