import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Send, FileText } from 'lucide-react';
import { useCreateAnnouncement } from '../../hooks/useAnnouncements.js';
import Avatar from '../ui/Avatar.jsx';

/**
 * PostComposer - Announcement creation form (stream tab)
 * Collapsed → Expanded with textarea and post button
 */
const PostComposer = ({ courseId, user }) => {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const { mutate: createAnnouncement, isPending } = useCreateAnnouncement(courseId);

  const handlePost = async () => {
    if (!content.trim() || !title.trim()) return;

    createAnnouncement(
      { title: title.trim(), content: content.trim() },
      {
        onSuccess: () => {
          setContent('');
          setTitle('');
          setExpanded(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setContent('');
    setTitle('');
    setExpanded(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Collapsed state */}
      {!expanded && (
        <div
          onClick={() => setExpanded(true)}
          className={clsx(
            'bg-white border border-[#E8E6F0] rounded-[14px] p-4',
            'flex items-center gap-3 cursor-text',
            'hover:border-[#D0CCE8] transition-colors duration-250'
          )}
        >
          {user?.avatar_url && (
            <Avatar size="sm" src={user.avatar_url} name={user.first_name} />
          )}
          <input
            type="text"
            placeholder="Announce something to your class..."
            className="flex-1 outline-none text-[14px] text-[#6E6A7C] placeholder-[#A89FBC]"
            onFocus={() => setExpanded(true)}
          />
        </div>
      )}

      {/* Expanded state */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-[#E8E6F0] rounded-[14px] p-4 shadow-sm"
          >
            {/* Title input */}
            <input
              type="text"
              placeholder="Announcement title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className={clsx(
                'w-full px-0 py-2 text-[14px] font-medium placeholder-[#A89FBC]',
                'border-b-2 border-[#E8E6F0] mb-3 outline-none',
                'focus:border-accent-500 transition-colors'
              )}
            />

            {/* Content textarea */}
            <textarea
              placeholder="Share details with your class..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={clsx(
                'w-full h-[100px] px-0 py-3 text-[14px] placeholder-[#A89FBC]',
                'outline-none resize-none',
                'focus:outline-none'
              )}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                  handlePost();
                }
              }}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E8E6F0]">
              {/* Left - File button (placeholder) */}
              <button
                type="button"
                className={clsx(
                  'p-2 rounded-lg text-[#6E6A7C] hover:text-[#1A1523]',
                  'hover:bg-[#F3F0FF] transition-colors'
                )}
                title="Attach file (coming soon)"
              >
                <FileText className="w-4 h-4" strokeWidth={2} />
              </button>

              {/* Right - Cancel & Post buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className={clsx(
                    'px-4 py-2 text-[13px] font-medium rounded-lg',
                    'text-[#6E6A7C] hover:text-[#1A1523]',
                    'hover:bg-[#F3F0FF] transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  Cancel
                </button>

                <motion.button
                  onClick={handlePost}
                  disabled={!content.trim() || !title.trim() || isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg',
                    'bg-accent-600 text-white',
                    'hover:bg-accent-700 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isPending ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" strokeWidth={2} />
                      Post
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostComposer;
export { PostComposer };
