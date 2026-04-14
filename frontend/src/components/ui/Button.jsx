import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Button component with multiple variants, sizes, and states
 * Premium SaaS design with smooth animations
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} isLoading - Shows loading spinner when true
 * @param {boolean} disabled - Disables the button
 * @param {React.ReactNode} icon - Optional icon element
 * @param {string} className - Additional classes
 * @param {React.ReactNode} children - Button label/content
 * @param {React.ComponentType} as - Component to render as (default: 'button')
 */
const Button = React.forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon = null,
      className,
      children,
      as: Component = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    // Base styles with new design tokens
    const baseStyles =
      'relative inline-flex items-center justify-center font-inter font-medium transition-all duration-250 rounded-md focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    // Size variants
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-2',
      md: 'px-4 py-2.5 text-base gap-2.5',
      lg: 'px-6 py-3 text-lg gap-3',
    };

    // Variant styles using new design tokens (Dark mode by default)
    const variantStyles = {
      primary: `
        bg-gradient-to-r from-accent-500 to-accent-600 text-white
        hover:from-accent-600 hover:to-accent-700
        active:from-accent-700 active:to-accent-800
        shadow-sm hover:shadow-md
        disabled:from-gray-600 disabled:to-gray-700
      `,
      secondary: `
        bg-gray-800 text-gray-100
        hover:bg-gray-700
        active:bg-gray-600
        shadow-xs
        light:bg-gray-100 light:text-gray-900
        light:hover:bg-gray-200
        light:active:bg-gray-300
      `,
      ghost: `
        text-gray-300 bg-transparent
        hover:bg-gray-900
        active:bg-gray-800
        light:text-gray-700
        light:hover:bg-gray-100
        light:active:bg-gray-200
      `,
      danger: `
        bg-red-600 text-white
        hover:bg-red-700
        active:bg-red-800
        shadow-sm hover:shadow-md
        disabled:bg-gray-300
      `,
    };

    return (
      <Component
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <motion.span
          initial={false}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center gap-inherit"
        >
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </motion.span>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-fast" />
          </motion.div>
        )}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export default Button;
export { Button };
