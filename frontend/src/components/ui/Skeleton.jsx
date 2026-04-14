import clsx from 'clsx';
import { motion } from 'framer-motion';

/**
 * Skeleton component - animated loading placeholder
 * Premium SaaS design matching Card and content structures
 */
const Skeleton = ({ className = '', count = 1, animated = true, ...props }) => {
  const items = Array.from({ length: count });

  return (
    <div {...props}>
      {items.map((_, i) => (
        <motion.div
          key={i}
          className={clsx(
            'bg-gray-200 dark:bg-gray-800 rounded',
            'shimmer',
            className
          )}
          animate={animated ? { opacity: [0.6, 1, 0.6] } : {}}
          transition={animated ? { duration: 2, repeat: Infinity } : {}}
        />
      ))}
    </div>
  );
};

Skeleton.displayName = 'Skeleton';

/**
 * SkeletonCard - animated card skeleton for loading states
 */
const SkeletonCard = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        className="bg-white dark:bg-gray-950 rounded-md border border-gray-200 dark:border-gray-800 p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.1 }}
      >
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-3 w-full mb-2" count={2} />
        <Skeleton className="h-3 w-2/3 mt-4" />
      </motion.div>
    ))}
  </>
);

SkeletonCard.displayName = 'SkeletonCard';

export default Skeleton;
export { Skeleton, SkeletonCard };
