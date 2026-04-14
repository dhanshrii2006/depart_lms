import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

/**
 * PlatformChip - Shows YouTube or Google Drive badge
 */
const PlatformChip = ({ platform, className = '' }) => {
  if (platform === 'youtube') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, type: 'spring' }}
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
          'bg-[#FFF1F2] border border-[#FECDD3]',
          'text-[12px] font-medium text-[#991B1B]',
          className
        )}
      >
        {/* YouTube Icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#FF0000]">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        <span>YouTube</span>
      </motion.div>
    );
  }

  if (platform === 'gdrive') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, type: 'spring' }}
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
          'bg-[#EFF6FF] border border-[#BFDBFE]',
          'text-[12px] font-medium text-[#1E40AF]',
          className
        )}
      >
        {/* Google Drive Icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#4285F4]">
          <path d="M8.5 2h7l6.5 11-6.5 11h-7l6.5-11z" opacity="0.7" />
          <path d="M1 14l5.5-9.5L12 2v20z" />
          <path d="M12 2l5.5 9.5L12 22z" opacity="0.7" />
        </svg>
        <span>Google Drive</span>
      </motion.div>
    );
  }

  return null;
};

export default PlatformChip;
export { PlatformChip };
