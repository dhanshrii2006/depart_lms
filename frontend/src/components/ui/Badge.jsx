import clsx from 'clsx';

/**
 * Badge component for status, labels, and filters
 * Premium SaaS design with semantic color variants
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-gray-800 text-gray-300 light:bg-gray-100 light:text-gray-700',
    pending: 'bg-amber-900/30 text-amber-400 light:bg-amber-100 light:text-amber-700',
    submitted: 'bg-blue-900/30 text-blue-400 light:bg-blue-100 light:text-blue-700',
    graded: 'bg-green-900/30 text-green-400 light:bg-green-100 light:text-green-700',
    'on-time': 'bg-emerald-900/30 text-emerald-400 light:bg-emerald-100 light:text-emerald-700',
    late: 'bg-orange-900/30 text-orange-400 light:bg-orange-100 light:text-orange-700',
    regraded: 'bg-indigo-900/30 text-indigo-400 light:bg-indigo-100 light:text-indigo-700',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs font-medium',
    md: 'px-3 py-1.5 text-sm font-medium',
    lg: 'px-4 py-2 text-base font-semibold',
  };

  return (
    <span className={clsx(
      'rounded-md inline-flex items-center gap-1.5',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
export { Badge };
