import React from 'react';
import clsx from 'clsx';

/**
 * Textarea component with label, error state, and character counter
 * Uses new design tokens with dark mode support
 */
const Textarea = React.forwardRef(
  ({
    label,
    error,
    maxLength,
    showCharCount = false,
    containerClassName = '',
    id,
    name,
    ...props
  }, ref) => {
    const [charCount, setCharCount] = React.useState(0);

    // Generate id from name if not provided
    const textareaId = id || name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (e) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    return (
      <div className={clsx('w-full flex flex-col gap-2.5', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-white light:text-gray-900">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          name={name}
          maxLength={maxLength}
          onChange={handleChange}
          className={clsx(
            'w-full px-4 py-2.5 rounded-md border border-gray-700',
            'bg-[#0f0f23] text-white placeholder-gray-400',
            'transition-all duration-250 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
            'disabled:bg-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            'light:bg-white light:text-gray-900 light:border-gray-200',
            'light:placeholder-gray-400 light:focus:ring-accent-600',
            'light:disabled:bg-gray-50 light:disabled:text-gray-500',
            props.className
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error && (
            <p className="text-sm text-red-400 light:text-red-600">{error}</p>
          )}
          {showCharCount && maxLength && (
            <p className="text-xs text-gray-400 light:text-gray-500 ml-auto">
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
export { Textarea };
