import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

/**
 * Select component with label, error state, and icon support
 * Premium SaaS design with dark mode support
 */
const Select = React.forwardRef(
  ({
    label,
    error,
    options = [],
    icon: Icon = ChevronDown,
    containerClassName = '',
    id,
    name,
    ...props
  }, ref) => {
    // Generate id from name if not provided
    const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
    <div className={clsx('w-full flex flex-col gap-2.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          name={name}
          className={clsx(
            'w-full px-4 py-2.5 border border-gray-200 rounded-md',
            'bg-white text-gray-900 placeholder-gray-400',
            'transition-all duration-250 appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            'dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
            'dark:focus:ring-accent-600',
            'dark:disabled:bg-gray-800 dark:disabled:text-gray-400',
            'pr-10',
            props.className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
  }
);

Select.displayName = 'Select';

export default Select;
export { Select };
