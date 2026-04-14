import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Play, CheckCircle, Trash2, Edit2, Eye } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import PlatformChip from './PlatformChip.jsx';

/**
 * LectureRow - Row in classwork list for lectures
 * Supports teacher and student variants
 */
const LectureRow = ({
  lecture,
  courseId,
  isTeacher = false,
  onEdit,
  onDelete,
  idx = 0,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const iconBg = lecture.platform === 'youtube' ? 'bg-[#FFF1F2]' : 'bg-[#EFF6FF]';
  const iconColor =
    lecture.platform === 'youtube' ? 'text-[#FF0000]' : 'text-[#4285F4]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.2 }}
      className={clsx(
        'h-12 flex items-center px-4 border-b border-[#F3F0FF]',
        'hover:bg-[#FAFAFE] transition-colors duration-250',
        'group relative'
      )}
    >
      {/* Platform icon */}
      <div className={clsx('w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0', iconBg)}>
        <Play className={clsx('w-4 h-4', iconColor)} strokeWidth={2} fill="currentColor" />
      </div>

      {/* Content */}
      <Link
        to={`/courses/${courseId}/lectures/${lecture.id}`}
        className="flex-1 ml-3 min-w-0 hover:no-underline"
      >
        <div>
          <p className="text-[13px] font-[450] text-[#1A1523] truncate hover:text-accent-600">
            {lecture.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <PlatformChip platform={lecture.platform} className="!px-1.5 !py-0.5 !text-[10px]" />
            {lecture.durationLabel && (
              <span className="text-[11px] text-[#A89FBC]">{lecture.durationLabel}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Right side - teacher or student specific */}
      {isTeacher ? (
        <div className="flex items-center gap-3 ml-3">
          {/* Watch count */}
          <span className="text-[12px] text-[#A89FBC]">
            {lecture.watchedCount !== undefined && `${lecture.watchedCount} watched`}
          </span>

          {/* Draft badge */}
          {lecture.status === 'draft' && (
            <span className="text-[10px] font-semibold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded-full">
              Draft
            </span>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-[#F3F0FF] text-[#A89FBC] hover:text-[#6E6A7C] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-full mt-1 bg-white border border-[#E8E6F0] rounded-lg shadow-lg z-50 min-w-max"
              >
                <button
                  onClick={() => {
                    onEdit?.(lecture);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] text-[#1A1523] hover:bg-[#F3F0FF] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete?.(lecture.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-[#FEE2E2] transition-colors border-t border-[#E8E6F0]"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Delete
                </button>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        // Student view
        <div className="flex items-center gap-2 ml-3">
          {lecture.watched ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] border border-[#A7F3D0]"
            >
              <CheckCircle className="w-3 h-3 text-[#16A34A]" strokeWidth={2} fill="currentColor" />
              <span className="text-[11px] font-medium text-[#16A34A]">Watched</span>
            </motion.div>
          ) : (
            <span className="text-[11px] text-[#A89FBC]">Not watched</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default LectureRow;
export { LectureRow };
