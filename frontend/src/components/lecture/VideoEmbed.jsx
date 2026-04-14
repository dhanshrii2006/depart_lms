import React from 'react';
import clsx from 'clsx';

/**
 * VideoEmbed - Renders YouTube or Google Drive video in iframe
 */
const VideoEmbed = ({ embedUrl, platform, title = 'Video player' }) => {
  if (!embedUrl) return null;

  if (platform === 'youtube') {
    return (
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-[14px]"
      />
    );
  }

  if (platform === 'gdrive') {
    return (
      <iframe
        src={embedUrl}
        title={title}
        allow="autoplay"
        allowFullScreen
        className="w-full h-full rounded-[14px]"
      />
    );
  }

  return null;
};

export default VideoEmbed;
export { VideoEmbed };
