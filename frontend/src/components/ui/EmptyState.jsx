import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * EmptyState component - shows when no data available
 * Premium SaaS design with icon and call-to-action support
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center py-12 px-4"
  >
    {Icon && (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={clsx(
          'w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-lg',
          'flex items-center justify-center mb-4'
        )}
      >
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600" strokeWidth={1.5} />
      </motion.div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">
      {description}
    </p>
    {action && action}
  </motion.div>
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
export { EmptyState };
