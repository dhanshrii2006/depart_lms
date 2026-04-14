import React from 'react';
import clsx from 'clsx';

/**
 * Input component with label, error state, and icon support
 * Uses new design tokens with dark mode support
 */
const Input = React.forwardRef(
  ({
    label,
    error,
    type = 'text',
    icon: Icon = null,
    iconPosition = 'left',
    className = '',
    containerClassName = '',
    id,
    name,
    ...props
  }, ref) => {
    // Generate id from name if not provided
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-white mb-2.5 light:text-gray-900">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={type}
            name={name}
            className={clsx(
              'w-full px-4 py-2.5 border border-gray-700 rounded-md',
              'bg-[#0f0f23] text-white placeholder-gray-400',
              'transition-all duration-250',
              'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
              'disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed',
              Icon && iconPosition === 'left' && 'pl-10',
              Icon && iconPosition === 'right' && 'pr-10',
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              'light:bg-white light:text-gray-900 light:border-gray-200',
              'light:placeholder-gray-400 light:focus:ring-accent-600',
              'light:disabled:bg-gray-50 light:disabled:text-gray-500',
              className
            )}
            {...props}
          />
          {Icon && (
            <div className={clsx(
              'absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none',
              'w-5 h-5 text-gray-400 dark:text-gray-500',
              iconPosition === 'left' ? 'left-3' : 'right-3'
            )}>
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 light:text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
export { Input };
