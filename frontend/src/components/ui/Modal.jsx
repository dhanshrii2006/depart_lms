import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import clsx from 'clsx';

/**
 * Modal component with animated overlay and content
 * Premium SaaS design with blur backdrop
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  position = 'center',
  closeOnBackdropClick = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  const positions = {
    center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    topLeft: 'left-6 top-6 translate-x-0 translate-y-0',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className={clsx(
              'fixed',
              positions[position] || positions.center,
              'bg-[#1a1828] light:bg-white rounded-lg shadow-xl z-50',
              sizes[size],
              'w-full mx-4 max-h-[90vh] flex flex-col'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-600 light:border-gray-200 flex items-center justify-between flex-shrink-0">
              {title && (
                <h2 className="text-lg font-semibold text-white light:text-gray-900 font-cabinet-grotesk">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-700 light:hover:bg-gray-100 rounded-md transition-colors text-gray-300 light:text-gray-500"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-600 light:border-gray-200 flex gap-3 justify-end flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

Modal.displayName = 'Modal';

export default Modal;
export { Modal };
