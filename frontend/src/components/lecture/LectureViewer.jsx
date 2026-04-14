import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import VideoEmbed from './VideoEmbed.jsx';
import LectureSidebar from './LectureSidebar.jsx';
import WatchedButton from './WatchedButton.jsx';
import PlatformChip from './PlatformChip.jsx';
import { useLectures } from '../../hooks/useLectures.js';
import { mockLectures } from '../../mock/lectures.js';

/**
 * LectureViewer - Full lecture viewer page
 */
const LectureViewer = () => {
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const [expandedDescription, setExpandedDescription] = useState(false);

  // Fetch course lectures (using mock for now)
  const courseLectures = mockLectures.filter((l) => l.courseId === courseId);

  // Get current lecture
  const lecture = courseLectures.find((l) => l.id === lectureId);

  const handleBackClick = () => {
    navigate(-1);
  };

  if (!lecture) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] text-[#6E6A7C]">Lecture not found</p>
          <button
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 text-accent-600 hover:text-accent-700 font-medium text-[13px]"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(lecture.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-6 py-4">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center gap-2 text-[13px] text-[#6E6A7C] hover:text-[#1A1523] dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Back to classwork
        </button>
      </div>

      {/* Main content layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left column - Video player */}
        <motion.div
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex-1 max-w-5xl mx-auto px-6 py-6 w-full"
        >
          {/* Video player */}
          <div className="aspect-video w-full bg-[#0F0D17] rounded-[14px] overflow-hidden border border-[#E8E6F0] shadow-sm">
            <VideoEmbed embedUrl={lecture.embedUrl} platform={lecture.platform} title={lecture.title} />
          </div>

          {/* Video metadata */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="mt-6"
          >
            {/* Title */}
            <h1 className="text-[24px] font-semibold text-[#1A1523] dark:text-white font-cabinet-grotesk">
              {lecture.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[12px] text-[#A89FBC]">
              <PlatformChip platform={lecture.platform} className="!text-[11px]" />
              {lecture.durationLabel && <span>{lecture.durationLabel}</span>}
              <span>·</span>
              <span>Posted {formattedDate}</span>
            </div>

            {/* Description */}
            {lecture.description && (
              <div className="mt-4">
                <p
                  className={clsx(
                    'text-[14px] text-[#6E6A7C] dark:text-gray-400 leading-relaxed',
                    !expandedDescription && 'line-clamp-3'
                  )}
                >
                  {lecture.description}
                </p>
                {lecture.description.split('\n').length > 3 && (
                  <button
                    onClick={() => setExpandedDescription(!expandedDescription)}
                    className="mt-2 text-[12px] text-accent-600 hover:text-accent-700 font-medium"
                  >
                    {expandedDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Mark as watched button */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.2 }}
              className="mt-6"
            >
              <WatchedButton lectureId={lecture.id} watched={lecture.watched} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right column - Sidebar */}
        <motion.div
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <LectureSidebar lectures={courseLectures} activeLectureId={lectureId} courseId={courseId} />
        </motion.div>
      </div>
    </div>
  );
};

export default LectureViewer;
export { LectureViewer };
