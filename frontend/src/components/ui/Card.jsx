import clsx from 'clsx';
import { motion } from 'framer-motion';

/**
 * Card component - container for grouped content
 * Premium SaaS design with optional hover effects
 */
const Card = ({
  children,
  className = '',
  hoverable = false,
  animated = false,
  ...props
}) => {
  const cardContent = (
    <div
      className={clsx(
        'bg-transparent rounded-md border border-gray-600 shadow-xs',
        'transition-all duration-250',
        'light:bg-white light:border-gray-200',
        hoverable && 'hover:shadow-sm hover:border-gray-500 light:hover:border-gray-300 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

Card.displayName = 'Card';

export default Card;
export { Card };
