import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/index.jsx';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';
import PlatformChip from './PlatformChip.jsx';
import VideoPreview from './VideoPreview.jsx';
import { extractVideoId, isValidVideoUrl } from '../../lib/videoUtils.js';

/**
 * AddLectureModal - Teacher create/edit lecture modal
 */
const AddLectureModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  lecture = null,
  courseTopics = [],
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: lecture || {
      videoUrl: '',
      title: '',
      description: '',
      topic: '',
      durationLabel: '',
      status: 'published',
    },
  });

  const videoUrl = watch('videoUrl');
  const title = watch('title');
  const status = watch('status');

  // Parse video URL
  const videoData = useMemo(() => {
    if (!videoUrl) return null;
    return extractVideoId(videoUrl);
  }, [videoUrl]);

  const isValidUrl = useMemo(() => {
    return videoUrl ? isValidVideoUrl(videoUrl) : false;
  }, [videoUrl]);

  const showDriveWarning = videoData?.platform === 'gdrive';

  const handleAddTopic = useCallback(() => {
    const newTopic = prompt('Enter new topic name:');
    if (newTopic && newTopic.trim()) {
      // This would typically add to the course topics
      console.log('New topic:', newTopic);
    }
  }, []);

  const handleCloseModal = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleCloseModal}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'bg-white dark:bg-gray-950 rounded-lg shadow-xl z-50',
          'max-w-lg w-full mx-4 max-h-[90vh] flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8E6F0]">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1523]">
              {lecture ? 'Edit video lecture' : 'Add video lecture'}
            </h2>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1 rounded-lg hover:bg-[#F3F0FF] text-[#6E6A7C] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Video URL Input */}
          <div>
            <label className="block text-sm font-medium text-[#1A1523] mb-2">
              Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              placeholder="Paste YouTube or Google Drive link..."
              {...register('videoUrl', { required: 'Video URL is required' })}
              className={clsx(
                'w-full px-4 py-2.5 border rounded-lg',
                'bg-white text-[#1A1523] placeholder-[#A89FBC]',
                'transition-all duration-250 outline-none',
                videoUrl && !isValidUrl
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                  : 'border-[#E8E6F0] focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20'
              )}
            />

            {/* Validation feedback */}
            {videoUrl && !isValidUrl && (
              <motion.div
                initial={{ x: -4, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mt-2 flex items-center gap-2 text-sm text-red-600"
              >
                <AlertCircle className="w-4 h-4" strokeWidth={2} />
                <span>Only YouTube and Google Drive links are supported</span>
              </motion.div>
            )}

            {/* Platform detection pill */}
            {isValidUrl && videoData && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-2">
                <PlatformChip platform={videoData.platform} />
              </motion.div>
            )}

            {/* Drive warning */}
            {showDriveWarning && (
              <motion.div
                initial={{ y: 4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mt-3 flex items-start gap-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] p-3"
              >
                <AlertTriangle className="w-4 h-4 text-[#92400E] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-[12px] text-[#92400E]">
                  Make sure sharing is set to <strong>"Anyone with the link can view"</strong>
                </p>
              </motion.div>
            )}

            {/* Video preview */}
            {isValidUrl && videoData && (
              <VideoPreview
                platform={videoData.platform}
                thumbnailUrl={videoData.thumbnailUrl}
                videoId={videoData.id}
              />
            )}
          </div>

          {/* Title */}
          <Input
            label="Title"
            placeholder="e.g. Introduction to React Hooks"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
            required
          />

          {/* Description */}
          <Textarea
            label="Description (optional)"
            placeholder="Add details about this lecture..."
            {...register('description')}
            maxLength={500}
            showCharCount
          />

          {/* Topic */}
          <Select
            label="Topic (optional)"
            placeholder="Select or create topic..."
            options={[
              ...courseTopics.map((t) => ({ label: t, value: t })),
              { label: '+ New topic', value: '__new__' },
            ]}
            {...register('topic')}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                handleAddTopic();
              } else {
                setValue('topic', e.target.value);
              }
            }}
          />

          {/* Duration */}
          <Input
            label="Duration (optional)"
            placeholder="e.g. 28:14"
            {...register('durationLabel')}
          />

          {/* Status Toggle */}
          <div>
            <label className="block text-sm font-medium text-[#1A1523] mb-3">Status</label>
            <div className="flex items-center gap-2 bg-[#F3F0FF] rounded-full p-0.5 w-fit">
              {['draft', 'published'].map((s) => (
                <motion.button
                  key={s}
                  onClick={() => setValue('status', s)}
                  className={clsx(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    status === s
                      ? 'bg-white text-accent-600 shadow-md'
                      : 'text-[#6E6A7C] hover:text-[#1A1523]'
                  )}
                  layoutId="status-toggle"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-[#E8E6F0] bg-gray-50">
          <button
            onClick={handleCloseModal}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg font-medium text-[14px]',
              'border border-[#D1D5DB] text-[#6B7280]',
              'hover:bg-white hover:text-[#374151] transition-all'
            )}
            disabled={isLoading}
          >
            Cancel
          </button>
          <motion.button
            onClick={handleSubmit((data) => {
              onSubmit(data);
              handleCloseModal();
            })}
            disabled={!isValidUrl || !title || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg font-medium text-[14px]',
              'bg-accent-600 text-white transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {lecture ? 'Saving...' : 'Adding...'}
              </span>
            ) : lecture ? (
              'Save changes'
            ) : (
              'Add lecture'
            )}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddLectureModal;
export { AddLectureModal };
