import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function YouTubeModal({ embedUrl, title, onClose, platform = 'youtube' }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[4px]" />

      <motion.div
        className="fixed left-4 top-6 w-[90vw] max-w-[900px] z-10"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#18162A] px-4 py-3 rounded-t-[16px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {platform === 'youtube' ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path
                  fill="#FF0000"
                  d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81z"
                />
                <path fill="#fff" d="M9.75 15.5l6.25-3.5-6.25-3.5v7z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#4285F4] flex-shrink-0">
                <path
                  d="M8.5 2h7l6.5 11-6.5 11h-7l6.5-11z"
                  fill="currentColor"
                  opacity="0.7"
                />
                <path d="M1 14l5.5-9.5L12 2v20z" fill="currentColor" />
                <path d="M12 2l5.5 9.5L12 22z" fill="currentColor" opacity="0.7" />
              </svg>
            )}
            <span className="text-[14px] text-white font-[450] truncate">{title}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-150 flex-shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="aspect-video w-full bg-[#000000] rounded-b-[16px] overflow-hidden">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
