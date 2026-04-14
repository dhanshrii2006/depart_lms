import React from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { useMarkWatched } from '../../hooks/useLectures.js';

/**
 * WatchedButton - Mark lecture as watched
 */
const WatchedButton = ({ lectureId, watched = false, onSuccess }) => {
  const { mutate: markWatched, isPending } = useMarkWatched(lectureId);

  const handleMarkWatched = async () => {
    markWatched(
      {},
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  if (watched) {
    return (
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={clsx(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg',
          'text-[14px] font-medium text-[#16A34A]',
          'disabled cursor-default'
        )}
        disabled
      >
        <CheckCircle className="w-4 h-4" strokeWidth={2} />
        <span>✓ Marked as watched</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleMarkWatched}
      disabled={isPending}
      className={clsx(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg',
        'text-[14px] font-medium',
        'border border-[#D1D5DB] text-[#6B7280]',
        'hover:bg-[#F3F4F6] hover:text-[#374151]',
        'transition-all duration-250',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Eye className="w-4 h-4" strokeWidth={2} />
      <span>{isPending ? 'Marking...' : 'Mark as watched'}</span>
    </motion.button>
  );
};

export default WatchedButton;
export { WatchedButton };
