import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Play } from 'lucide-react';

/**
 * VideoPreview - Shows thumbnail preview with play button
 */
const VideoPreview = ({ platform, thumbnailUrl, videoId, onPreviewClick }) => {
  const [imageError, setImageError] = useState(false);

  if (!thumbnailUrl && platform === 'youtube') {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="mt-3"
    >
      {platform === 'youtube' && !imageError ? (
        <div className="relative aspect-video w-full rounded-[10px] overflow-hidden bg-[#0F0D17]">
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group hover:bg-black/40 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
              <Play className="w-5 h-5 text-[#1A1523] ml-0.5 fill-current" />
            </div>
          </div>
          <button
            onClick={onPreviewClick}
            className="absolute bottom-2 right-2 text-[12px] text-white underline opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 px-2 py-1 rounded"
          >
            Preview in player →
          </button>
        </div>
      ) : platform === 'gdrive' ? (
        <div className="flex items-center gap-3 bg-[#F8F7FF] border border-[#E8E6F0] rounded-[10px] p-3">
          {/* Drive icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#4285F4]">
            <path
              d="M8.5 2h7l6.5 11-6.5 11h-7l6.5-11z"
              fill="currentColor"
              opacity="0.7"
            />
            <path d="M1 14l5.5-9.5L12 2v20z" fill="currentColor" />
            <path d="M12 2l5.5 9.5L12 22z" fill="currentColor" opacity="0.7" />
          </svg>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-[#1A1523]">Google Drive Video</p>
            <p className="text-[11px] text-[#A89FBC] truncate">{videoId}</p>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default VideoPreview;
export { VideoPreview };
