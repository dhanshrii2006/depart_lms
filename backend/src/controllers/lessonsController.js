import { query } from '../db/pool.js';

function parseVideoUrl(url) {
  if (!url) return null;

  const youtubePatterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      const videoId = match[1];
      return {
        platform: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&color=white&iv_load_policy=3&showinfo=0`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    }
  }

  const drivePatterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of drivePatterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      const fileId = match[1];
      return {
        platform: 'gdrive',
        videoId: fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        thumbnailUrl: null,
      };
    }
  }

  return null;
}

export const attachVideo = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const originalUrl = req.validatedData.original_url || req.validatedData.originalUrl;
    const title = req.validatedData.title || '';
    const duration = req.validatedData.duration || '';

    const parsed = parseVideoUrl(originalUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Only YouTube and Google Drive links are supported' });
    }

    // Verify ownership via lesson -> module -> course
    const lessonRes = await query(
      `SELECT l.id, m.course_id, c.teacher_id
       FROM course_lessons l
       JOIN course_modules m ON m.id = l.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (lessonRes.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `INSERT INTO lesson_videos (lesson_id, original_url, platform, video_id, embed_url, thumbnail_url, title, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (lesson_id)
       DO UPDATE SET
         original_url = EXCLUDED.original_url,
         platform = EXCLUDED.platform,
         video_id = EXCLUDED.video_id,
         embed_url = EXCLUDED.embed_url,
         thumbnail_url = EXCLUDED.thumbnail_url,
         title = EXCLUDED.title,
         duration = EXCLUDED.duration,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        lessonId,
        originalUrl,
        parsed.platform,
        parsed.videoId,
        parsed.embedUrl,
        parsed.thumbnailUrl,
        title,
        duration,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Attach video error:', error);
    res.status(500).json({ error: 'Failed to attach video' });
  }
};
