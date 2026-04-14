-- Create lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  thumbnail_url TEXT,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'gdrive')),
  video_id TEXT NOT NULL,
  topic VARCHAR(100),
  order_index INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  duration_label VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lecture_progress table for tracking student views
CREATE TABLE IF NOT EXISTS lecture_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT false,
  watched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lecture_id, student_id)
);

-- Create indexes for common queries
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_lectures_created_by ON lectures(created_by);
CREATE INDEX idx_lectures_status ON lectures(status);
CREATE INDEX idx_lecture_progress_lecture_id ON lecture_progress(lecture_id);
CREATE INDEX idx_lecture_progress_student_id ON lecture_progress(student_id);
CREATE INDEX idx_lecture_progress_watched ON lecture_progress(watched);
