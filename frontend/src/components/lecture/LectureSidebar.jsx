import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Play } from 'lucide-react';

/**
 * LectureSidebar - Right sidebar showing all lectures in course
 */
const LectureSidebar = ({ lectures = [], activeLectureId, courseId }) => {
  const groupedLectures = {};

  // Group by topic
  lectures.forEach((lec) => {
    const topic = lec.topic || 'Ungrouped';
    if (!groupedLectures[topic]) {
      groupedLectures[topic] = [];
    }
    groupedLectures[topic].push(lec);
  });

  return (
    <div className="hidden lg:block w-64 bg-[#F8F7FF] border-l border-[#E8E6F0] p-4">
      <h3 className="text-sm font-semibold text-[#1A1523] mb-4">Course lectures</h3>

      <div className="space-y-4">
        {Object.entries(groupedLectures).map(([topic, lecturesInTopic]) => (
          <div key={topic}>
            {topic !== 'Ungrouped' && (
              <p className="text-[11px] font-semibold text-[#A89FBC] uppercase mb-2 px-2">{topic}</p>
            )}

            <div className="space-y-1.5">
              {lecturesInTopic.map((lec) => {
                const isActive = lec.id === activeLectureId;

                return (
                  <Link
                    key={lec.id}
                    to={`/courses/${courseId}/lectures/${lec.id}`}
                    className={clsx(
                      'flex gap-3 p-2 rounded-lg transition-all duration-250 group',
                      isActive
                        ? 'bg-white border border-[#DDD6FE] shadow-sm'
                        : 'hover:bg-[#FAFAFE] border border-transparent'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-12 rounded-md flex-shrink-0 bg-[#E8E6F0] overflow-hidden relative">
                      {lec.platform === 'youtube' && lec.thumbnailUrl ? (
                        <img
                          src={lec.thumbnailUrl}
                          alt={lec.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C5CFC] to-[#6D28D9]">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}

                      {/* Watched indicator */}
                      {lec.watched && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-[450] text-[#1A1523] line-clamp-2 group-hover:text-accent-600">
                        {lec.title}
                      </p>
                      {lec.durationLabel && (
                        <p className="text-[10px] text-[#A89FBC] mt-0.5">{lec.durationLabel}</p>
                      )}
                    </div>

                    {/* Active indicator */}
                    {isActive && <div className="w-1 bg-accent-600 rounded-full flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LectureSidebar;
export { LectureSidebar };
