-- Course builder schema: course fields + modules/lessons/videos

-- Add course fields
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category varchar(100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty varchar(20);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_hours numeric(6,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_students integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS outcomes jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status varchar(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_status_check'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_status_check
      CHECK (status IN ('draft','published'));
  END IF;
END$$;

-- Course modules
CREATE TABLE IF NOT EXISTS course_modules (
  id serial PRIMARY KEY,
  course_id integer NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Lessons
CREATE TABLE IF NOT EXISTS course_lessons (
  id serial PRIMARY KEY,
  module_id integer NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Lesson videos
CREATE TABLE IF NOT EXISTS lesson_videos (
  id serial PRIMARY KEY,
  lesson_id integer UNIQUE NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  original_url text NOT NULL,
  platform varchar(10) NOT NULL,
  video_id text,
  embed_url text NOT NULL,
  thumbnail_url text,
  title text,
  duration text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lesson_videos_platform_check CHECK (platform IN ('youtube','gdrive'))
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson_id ON lesson_videos(lesson_id);
