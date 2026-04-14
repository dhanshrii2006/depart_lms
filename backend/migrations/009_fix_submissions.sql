-- Ensure submissions table has Google Classroom-style fields
-- Note: this project uses `submissions` (not `assignment_submissions`).

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS file_name    TEXT,
  ADD COLUMN IF NOT EXISTS file_type    TEXT,
  ADD COLUMN IF NOT EXISTS drive_link   TEXT,
  ADD COLUMN IF NOT EXISTS text_comment TEXT,
  ADD COLUMN IF NOT EXISTS status       VARCHAR(20) DEFAULT 'submitted';

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_student
  ON submissions(assignment_id, user_id);
