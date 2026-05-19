const { mysqlPool } = require('../config/database');

async function createComment({ confessionId, userId, content }) {
  const [result] = await mysqlPool.execute(
    'INSERT INTO comments (confession_id, user_id, content) VALUES (?, ?, ?)',
    [confessionId, userId, content.trim()]
  );
  return result.insertId;
}

async function getCommentById(commentId) {
  const [rows] = await mysqlPool.execute(
    `SELECT
      c.id,
      c.content,
      c.created_at as createdAt,
      u.anonymous_id as anonymousId,
      u.nickname,
      u.avatar_url as avatarUrl
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?`,
    [commentId]
  );
  return rows[0] || null;
}

module.exports = {
  createComment,
  getCommentById
};
