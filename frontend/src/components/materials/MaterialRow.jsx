import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon } from 'lucide-react';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '../../lib/videoUtils.js';

export default function MaterialRow({ material, onClick }) {
  const [hovered, setHovered] = useState(false);

  const url = material?.link_url || '';

  const ytInfo = useMemo(() => {
    if (!isYouTubeUrl(url)) return null;
    return getYouTubeEmbedUrl(url);
  }, [url]);

  return (
    <div
      className="relative flex items-center gap-3 px-4 h-12 border-b border-[#F3F0FF] hover:bg-[#FAFAFE] cursor-pointer transition-colors duration-150"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      <div
        className={`w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
          ytInfo ? 'bg-[#FFF1F2]' : 'bg-[#F3F0FF]'
        }`}
      >
        {ytInfo ? (
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path
              fill="#FF0000"
              d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81z"
            />
            <path fill="#fff" d="M9.75 15.5l6.25-3.5-6.25-3.5v7z" />
          </svg>
        ) : (
          <LinkIcon className="w-4 h-4 text-[#7C5CFC]" />
        )}
      </div>

      <span className="text-[13px] font-[450] text-[#1A1523] truncate flex-1">{material?.title}</span>

      <AnimatePresence>
        {ytInfo && hovered && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className="text-[11px] text-[#EF4444] font-[500] bg-[#FFF1F2] border border-[#FECDD3] rounded-full px-2 py-0.5 flex-shrink-0"
          >
            ▶ Watch
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ytInfo && hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-14 top-1/2 -translate-y-1/2 w-[120px] h-[68px] z-20 bg-[#0F0D17] rounded-[8px] overflow-hidden border border-[#E8E6F0] shadow-lg pointer-events-none"
          >
            <img
              src={ytInfo.thumbnailUrl}
              alt={material?.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = ytInfo.thumbnailUrl.replace('maxresdefault', 'hqdefault');
              }}
            />

            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5">
                  <path fill="#1A1523" d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
