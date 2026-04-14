import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { X, FileUp } from 'lucide-react';
import { useCreateAssignment } from '../../hooks/useAssignments.js';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';

/**
 * Assignment creation validation schema
 */
const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  instructions: z.string().optional().default(''),
  dueDate: z.string().optional().default(''),
  points: z.coerce.number().min(0, 'Points must be 0 or more').default(100),
});

/**
 * CreateAssignmentModal - Teacher create assignment
 */
const CreateAssignmentModal = ({ isOpen, onClose, courseId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const { mutate: createAssignment, isPending } = useCreateAssignment(courseId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: '',
      instructions: '',
      dueDate: '',
      points: 100,
      topic: '',
    },
  });

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    onClose();
  };

  const onSubmit = (values) => {
    const payload = {
      title: values.title,
      instructions: values.instructions || '',
      dueDate: values.dueDate || '',
      points: values.points,
      file: selectedFile
    };

    createAssignment(payload, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="assignment-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      <motion.div
        key="assignment-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'fixed left-[30%] top-[10%] -translate-x-1/2 -translate-y-1/2',
          'bg-white dark:bg-gray-950 rounded-lg shadow-xl z-50',
          'max-w-lg w-[calc(100%-2rem)] max-h-[85vh] flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E8E6F0]">
          <h2 className="text-lg font-semibold text-[#1A1523] dark:text-white">Create assignment</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-[#F3F0FF] dark:hover:bg-gray-900 text-[#6E6A7C] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Title */}
            <Input
              label="Assignment title"
              placeholder="e.g. Chapter 5 Reading Review"
              error={errors.title?.message}
              autoFocus
              {...register('title')}
              required
            />

            {/* Instructions */}
            <Textarea
              label="Instructions (optional)"
              placeholder="Add details, resources, or instructions..."
              {...register('instructions')}
              maxLength={2000}
              showCharCount
            />

            {/* Due date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-[#1A1523] dark:text-gray-100 mb-2">
                Due date (optional)
              </label>
              <input
                id="dueDate"
                type="datetime-local"
                {...register('dueDate')}
                className={clsx(
                  'w-full px-4 py-2.5 border border-[#E8E6F0] rounded-lg',
                  'bg-white dark:bg-gray-900 text-[#1A1523] dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500',
                  'transition-all duration-250'
                )}
              />
            </div>

            {/* Points */}
            <Input
              label="Points"
              type="number"
              placeholder="100"
              {...register('points')}
              min="0"
            />

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-[#1A1523] dark:text-gray-100 mb-2">
                Attachment (optional)
              </label>
              <div className="flex items-center gap-2">
                <label
                  className={clsx(
                    'flex-1 px-4 py-2.5 border-2 border-dashed border-[#D0CCE8] rounded-lg',
                    'cursor-pointer hover:border-accent-500 hover:bg-[#F8F7FF]',
                    'transition-all duration-250 text-center',
                    selectedFile && 'bg-[#F3F0FF] border-accent-500'
                  )}
                >
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 text-[13px]">
                    <FileUp className="w-4 h-4 text-[#7C5CFC]" strokeWidth={2} />
                    <span className="text-[#6E6A7C]">
                      {selectedFile ? selectedFile.name : 'Click to upload'}
                    </span>
                  </div>
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-2 text-[12px] text-red-600 hover:bg-[#FEE2E2] rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-[#E8E6F0] bg-gray-50 dark:bg-gray-900">
          <button
            onClick={handleClose}
            disabled={isPending}
            className={clsx(
              'flex-1 px-4 py-2.5 rounded-lg font-medium text-[14px]',
              'border border-[#D1D5DB] text-[#6B7280]',
              'hover:bg-white hover:text-[#374151] transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Cancel
          </button>

          <motion.button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending || Object.keys(errors).length > 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              'flex-1 px-4 py-2.5 rounded-lg font-medium text-[14px]',
              'bg-accent-600 text-white',
              'hover:bg-accent-700 transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Create assignment'
            )}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateAssignmentModal;
export { CreateAssignmentModal };
