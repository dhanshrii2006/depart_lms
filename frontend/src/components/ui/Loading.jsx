import { motion } from 'framer-motion';

/**
 * Loading component - animated spinner indicator
 * Premium SaaS design with smooth rotation
 */
const Loading = () => (
  <div className="flex items-center justify-center py-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      className="relative w-12 h-12"
    >
      <div className="absolute inset-0 border-3 border-gray-200 dark:border-gray-800 rounded-full"></div>
      <div className="absolute inset-0 border-3 border-transparent border-t-accent-600 dark:border-t-accent-500 rounded-full"></div>
    </motion.div>
  </div>
);

Loading.displayName = 'Loading';

export default Loading;
export { Loading };
