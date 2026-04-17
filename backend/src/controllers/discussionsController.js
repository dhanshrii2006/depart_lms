import { query } from '../db/pool.js';

/**
 * Get all discussions with reply counts
 */
export const getAllDiscussions = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.id,
        d.title,
        d.description,
        d.author_id,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.email as author_email,
        d.created_at,
        COUNT(dr.id) as reply_count
      FROM discussions d
      LEFT JOIN users u ON d.author_id = u.id
      LEFT JOIN discussion_replies dr ON d.id = dr.discussion_id
      GROUP BY d.id, u.first_name, u.last_name, u.email
      ORDER BY d.created_at DESC
    `);

    res.json({
      discussions: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        author: {
          id: row.author_id,
          name: row.author_name,
          email: row.author_email
        },
        createdAt: row.created_at,
        replies: row.reply_count,
        likes: 0, // For future enhancement
        tags: [] // For future enhancement
      }))
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
};

/**
 * Get single discussion with all replies
 */
export const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get discussion
    const discussionResult = await query(`
      SELECT 
        d.id,
        d.title,
        d.description,
        d.author_id,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.email as author_email,
        d.created_at
      FROM discussions d
      LEFT JOIN users u ON d.author_id = u.id
      WHERE d.id = $1
    `, [id]);

    if (discussionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    const discussion = discussionResult.rows[0];

    // Get replies
    const repliesResult = await query(`
      SELECT 
        dr.id,
        dr.content,
        dr.author_id,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        u.email as author_email,
        dr.created_at
      FROM discussion_replies dr
      LEFT JOIN users u ON dr.author_id = u.id
      WHERE dr.discussion_id = $1
      ORDER BY dr.created_at ASC
    `, [id]);

    res.json({
      id: discussion.id,
      title: discussion.title,
      description: discussion.description,
      author: {
        id: discussion.author_id,
        name: discussion.author_name,
        email: discussion.author_email
      },
      createdAt: discussion.created_at,
      replies_data: repliesResult.rows.map(row => ({
        id: row.id,
        content: row.content,
        author: {
          id: row.author_id,
          name: row.author_name,
          email: row.author_email
        },
        createdAt: row.created_at,
        likes: 0,
        isAnswer: false
      })),
      replies: repliesResult.rows.length,
      likes: 0,
      tags: []
    });
  } catch (error) {
    console.error('Get discussion error:', error);
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
};

/**
 * Create new discussion
 */
export const createDiscussion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    const result = await query(`
      INSERT INTO discussions (title, description, author_id)
      VALUES ($1, $2, $3)
      RETURNING id, title, description, author_id, created_at
    `, [title, description, userId]);

    const discussion = result.rows[0];

    // Get author info
    const userResult = await query(`
      SELECT first_name, last_name, email FROM users WHERE id = $1
    `, [userId]);

    const user = userResult.rows[0];

    res.status(201).json({
      id: discussion.id,
      title: discussion.title,
      description: discussion.description,
      author: {
        id: discussion.author_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      },
      createdAt: discussion.created_at,
      replies_data: [],
      replies: 0,
      likes: 0,
      tags: tags || [],
      message: 'Discussion created successfully'
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ error: 'Failed to create discussion' });
  }
};

/**
 * Add reply to discussion
 */
export const createReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Reply content required' });
    }

    // Check discussion exists
    const discussionCheck = await query('SELECT id FROM discussions WHERE id = $1', [id]);
    if (discussionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    // Create reply
    const result = await query(`
      INSERT INTO discussion_replies (discussion_id, author_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, author_id, created_at
    `, [id, userId, content]);

    const reply = result.rows[0];

    // Get author info
    const userResult = await query(`
      SELECT first_name, last_name, email FROM users WHERE id = $1
    `, [userId]);

    const user = userResult.rows[0];

    res.status(201).json({
      id: reply.id,
      content: reply.content,
      author: {
        id: reply.author_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      },
      createdAt: reply.created_at,
      likes: 0,
      isAnswer: false,
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
};

/**
 * Delete discussion (owner only)
 */
export const deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the author
    const checkResult = await query('SELECT author_id FROM discussions WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    if (checkResult.rows[0].author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this discussion' });
    }

    await query('DELETE FROM discussions WHERE id = $1', [id]);

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({ error: 'Failed to delete discussion' });
  }
};
