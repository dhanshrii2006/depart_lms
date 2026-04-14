import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Archive,
  Undo2,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, Button, Input, Textarea, Modal, Badge, Loading } from '../ui.jsx';
import { assignmentsAPI, coursesAPI } from '../../api/client.js';
import { useMySubmission, useSubmitAssignment, useUnsubmitAssignment } from '../../hooks/useAssignments.js';

const isValidDriveLink = (value) => {
  const v = (value || '').trim();
  if (!v) return false;
  try {
    const url = new URL(v);
    const host = (url.hostname || '').toLowerCase();
    return host === 'drive.google.com' || host.endsWith('.drive.google.com');
  } catch {
    return false;
  }
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = unitIndex === 0 ? String(Math.round(value)) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
};

const fileIconFor = (file) => {
  const type = file?.type || '';
  const name = file?.name || '';
  const ext = name.split('.').pop()?.toLowerCase();

  if (type === 'application/pdf' || ext === 'pdf') return FileText;
  if (type.includes('word') || ext === 'doc' || ext === 'docx') return FileText;
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return ImageIcon;
  if (type === 'application/zip' || ext === 'zip') return Archive;
  return FileText;
};

const statusBadgeVariant = ({ graded, submitted, missing }) => {
  if (graded) return { label: 'graded', variant: 'graded' };
  if (submitted) return { label: 'turned in', variant: 'submitted' };
  if (missing) return { label: 'missing', variant: 'late' };
  return { label: 'assigned', variant: 'default' };
};

export default function StudentAssignmentDetail() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const submissionQuery = useMySubmission(assignmentId);
  const submission = submissionQuery.data;

  const [selectedFile, setSelectedFile] = useState(null);
  const [driveLink, setDriveLink] = useState('');
  const [textComment, setTextComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [turnInConfirmOpen, setTurnInConfirmOpen] = useState(false);
  const [unsubmitConfirmOpen, setUnsubmitConfirmOpen] = useState(false);

  const fileInputRef = useRef(null);

  const submitMutation = useSubmitAssignment(assignmentId, assignment?.course_id);
  const unsubmitMutation = useUnsubmitAssignment(assignmentId, assignment?.course_id);

  const graded = submission?.grade !== null && submission?.grade !== undefined;
  const submitted = submission?.status === 'submitted';
  const draft = submission?.status === 'draft';

  const dueDate = assignment?.due_date ? new Date(assignment.due_date) : null;
  const isMissing = !graded && !submitted && dueDate && !Number.isNaN(dueDate.getTime()) && new Date() > dueDate;

  const badge = useMemo(
    () => statusBadgeVariant({ graded, submitted, missing: isMissing }),
    [graded, submitted, isMissing]
  );

  const driveValid = isValidDriveLink(driveLink);
  const driveInvalid = !!driveLink.trim() && !driveValid;

  const canTurnIn = !graded && (selectedFile || driveValid);

  useEffect(() => {
    const run = async () => {
      if (!assignmentId) return;
      setIsLoading(true);
      try {
        const aRes = await assignmentsAPI.get(assignmentId);
        setAssignment(aRes.data);

        try {
          const cRes = await coursesAPI.get(aRes.data.course_id);
          setCourse(cRes.data);
        } catch {
          setCourse(null);
        }
      } catch {
        toast.error('Failed to load assignment');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [assignmentId, navigate]);

  useEffect(() => {
    // Prefill sidebar with existing data when in draft / not submitted.
    if (graded || submitted) return;
    if (!submission) return;

    const existingDrive = submission.drive_link || submission.link_url || '';
    const existingComment = submission.text_comment || submission.submission_text || '';

    setDriveLink(existingDrive);
    setTextComment(existingComment);
    setShowComment(!!existingComment);
  }, [submission, graded, submitted]);

  const handleFileSelected = (file) => {
    if (!file) return;
    setSelectedFile(file);
  };

  const handleTurnIn = async () => {
    if (!assignmentId) return;
    if (!canTurnIn) return;

    const formData = new FormData();
    if (selectedFile) formData.append('file', selectedFile);
    if (driveValid) formData.append('drive_link', driveLink.trim());
    if (textComment.trim()) formData.append('text_comment', textComment.trim());

    try {
      await submitMutation.mutateAsync(formData);
      setTurnInConfirmOpen(false);
      setSelectedFile(null);
    } catch (err) {
      // handled by hook
    }
  };

  const handleUnsubmit = async () => {
    if (!assignmentId) return;
    try {
      await unsubmitMutation.mutateAsync();
      setUnsubmitConfirmOpen(false);
    } catch {
      // handled by hook
    }
  };

  if (isLoading) return <Loading />;

  const dueText = dueDate && !Number.isNaN(dueDate.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(dueDate)
    : 'No due date';

  const teacherName = course?.first_name ? `${course.first_name} ${course.last_name || ''}`.trim() : null;

  const ExistingFileIcon = submission?.file_name
    ? fileIconFor({ name: submission.file_name, type: submission.file_type })
    : FileText;

  const SelectedFileIcon = selectedFile ? fileIconFor(selectedFile) : FileText;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-cabinet-grotesk">
                  {assignment?.title}
                </h1>
                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                  <span>Due: {dueText}</span>
                  <span>·</span>
                  <span>{assignment?.points || 100} points</span>
                  {course?.title && (
                    <>
                      <span>·</span>
                      <span>{course.title}</span>
                    </>
                  )}
                </div>
              </div>

              <Badge variant={badge.variant} size="sm">
                {badge.label}
              </Badge>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-gray-500 tracking-wider">INSTRUCTIONS</p>
              <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                {assignment?.instructions || <span className="text-gray-500 italic">No instructions provided.</span>}
              </p>
            </div>

            {assignment?.attachment_url && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs font-semibold text-gray-500 tracking-wider">ATTACHMENTS</p>
                <div className="mt-2">
                  <a
                    href={assignment.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
                  >
                    <FileText className="w-4 h-4" /> Download attachment
                  </a>
                </div>
              </div>
            )}
          </Card>

          {/* Graded view */}
          {graded && (
            <Card className="p-6 space-y-4">
              <div>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold text-gray-900 font-cabinet-grotesk">
                    {submission.grade}
                  </div>
                  <div className="text-lg text-gray-500">/{assignment?.points || 100}</div>
                </div>
                <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, (Number(submission.grade) / (assignment?.points || 100)) * 100))}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                    className={
                      (Number(submission.grade) / (assignment?.points || 100)) >= 0.75
                        ? 'h-full bg-emerald-500'
                        : (Number(submission.grade) / (assignment?.points || 100)) >= 0.5
                          ? 'h-full bg-amber-500'
                          : 'h-full bg-red-500'
                    }
                  />
                </div>
              </div>

              {submission.feedback && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 tracking-wider">FEEDBACK</p>
                  <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{submission.feedback}</p>
                </div>
              )}

              {(submission.file_url || submission.drive_link || submission.link_url || submission.text_comment || submission.submission_text) && (
                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="text-sm text-gray-700 cursor-pointer select-none">
                    View your submission
                  </summary>
                  <div className="mt-3 space-y-2">
                    {submission.file_url && (
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-indigo-600 hover:underline"
                      >
                        Open submitted file
                      </a>
                    )}
                    {(submission.drive_link || submission.link_url) && (
                      <a
                        href={submission.drive_link || submission.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-indigo-600 hover:underline"
                      >
                        Open submitted Drive link
                      </a>
                    )}
                    {(submission.text_comment || submission.submission_text) && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {(submission.text_comment || submission.submission_text)}
                      </p>
                    )}
                  </div>
                </details>
              )}
            </Card>
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Your work</h2>
              {submitted && !graded && (
                <span className="inline-flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" /> Turned in
                </span>
              )}
              {!submitted && !graded && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" /> Not turned in
                </span>
              )}
            </div>

            {/* STATE 2: submitted */}
            {submitted && !graded && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <CheckCircle className="w-4 h-4" /> Turned in
                  </div>
                  {submission?.submitted_at && (
                    <p className="text-xs text-gray-600 mt-1">
                      Submitted {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {submission?.file_url && (
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
                  >
                    <ExistingFileIcon className="w-4 h-4" /> Open submitted file
                  </a>
                )}

                {(submission?.drive_link || submission?.link_url) && (
                  <a
                    href={submission.drive_link || submission.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" /> Open Drive link
                  </a>
                )}

                {(submission?.text_comment || submission?.submission_text) && (
                  <div className="text-sm text-gray-700 italic whitespace-pre-wrap">
                    {submission.text_comment || submission.submission_text}
                  </div>
                )}

                <Button
                  variant="secondary"
                  className="w-full"
                  icon={<Undo2 className="w-4 h-4" />}
                  onClick={() => setUnsubmitConfirmOpen(true)}
                  disabled={unsubmitMutation.isPending}
                >
                  Unsubmit
                </Button>
              </motion.div>
            )}

            {/* STATE 1: draft / not submitted */}
            {!graded && !submitted && (
              <div className="space-y-4">
                <motion.div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    handleFileSelected(file);
                  }}
                  className={
                    `border-2 border-dashed rounded-xl p-6 text-center transition-colors ` +
                    (isDragOver
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-indigo-200 bg-gray-50')
                  }
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-700">Drag a file here or</p>
                  <button
                    type="button"
                    className="mt-1 text-sm text-indigo-600 hover:underline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse files
                  </button>
                  <p className="mt-2 text-xs text-gray-500">PDF, Word, images up to 25MB</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                    onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  />
                </motion.div>

                <AnimatePresence>
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <SelectedFileIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-600">{formatBytes(selectedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-gray-600 hover:text-gray-900"
                        onClick={() => setSelectedFile(null)}
                        aria-label="Remove file"
                      >
                        ×
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {draft && submission?.file_url && !selectedFile && (
                  <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ExistingFileIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{submission.file_name || 'Previously attached file'}</p>
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <hr className="flex-1 border-gray-200" />
                  <span className="text-xs text-gray-500">or</span>
                  <hr className="flex-1 border-gray-200" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Add Google Drive link</p>
                  <Input
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="Paste Google Drive link..."
                    icon={LinkIcon}
                    error={driveInvalid ? 'Must be a Google Drive link' : undefined}
                  />

                  {driveValid && (
                    <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Drive link added
                    </p>
                  )}

                  {driveValid && (
                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-2.5 text-xs text-amber-900">
                      Make sure your file is shared as “Anyone with the link can view”.
                    </div>
                  )}
                </div>

                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<MessageSquare className="w-4 h-4" />}
                    onClick={() => setShowComment((v) => !v)}
                  >
                    Add a comment (optional)
                  </Button>

                  <AnimatePresence>
                    {showComment && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 overflow-hidden"
                      >
                        <Textarea
                          rows="2"
                          placeholder="Add a private comment to your teacher..."
                          value={textComment}
                          onChange={(e) => setTextComment(e.target.value)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  variant="primary"
                  className="w-full !from-green-700 !to-green-700 hover:!from-green-800 hover:!to-green-800"
                  icon={<Upload className="w-4 h-4" />}
                  disabled={!canTurnIn || submitMutation.isPending}
                  isLoading={submitMutation.isPending}
                  onClick={() => setTurnInConfirmOpen(true)}
                >
                  Turn in
                </Button>
              </div>
            )}

            {/* Confirm modals */}
            <Modal
              isOpen={turnInConfirmOpen}
              onClose={() => setTurnInConfirmOpen(false)}
              title="Turn in assignment?"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setTurnInConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="!from-green-700 !to-green-700 hover:!from-green-800 hover:!to-green-800"
                    onClick={handleTurnIn}
                    disabled={!canTurnIn || submitMutation.isPending}
                    isLoading={submitMutation.isPending}
                  >
                    Turn in
                  </Button>
                </>
              }
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{assignment?.title}</span>
                </p>
                <p className="text-sm text-gray-600">
                  This will submit your work{teacherName ? ` to ${teacherName}` : ''}.
                </p>

                {selectedFile && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <SelectedFileIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-gray-900">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">({formatBytes(selectedFile.size)})</span>
                  </div>
                )}

                {driveValid && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <LinkIcon className="w-4 h-4 text-gray-700" />
                    <span className="text-sm text-gray-900 truncate">{driveLink.trim()}</span>
                  </div>
                )}
              </div>
            </Modal>

            <Modal
              isOpen={unsubmitConfirmOpen}
              onClose={() => setUnsubmitConfirmOpen(false)}
              title="Unsubmit assignment?"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setUnsubmitConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleUnsubmit}
                    disabled={unsubmitMutation.isPending}
                    isLoading={unsubmitMutation.isPending}
                  >
                    Unsubmit
                  </Button>
                </>
              }
            >
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  Your teacher will be notified. You can turn it in again before it’s graded.
                </p>
              </div>
            </Modal>
          </Card>
        </div>
      </div>
    </div>
  );
}
