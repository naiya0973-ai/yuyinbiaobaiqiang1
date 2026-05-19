const { mysqlPool } = require('../config/database');

async function getConfessionById(confessionId) {
  const [rows] = await mysqlPool.execute(
    `SELECT
      c.id,
      c.title,
      c.content,
      c.audio_url as audioUrl,
      c.audio_duration as audioDuration,
      c.audio_size as audioSize,
      c.like_count as likeCount,
      c.comment_count as commentCount,
      c.play_count as playCount,
      c.created_at as createdAt,
      c.category_id as categoryId,
      u.anonymous_id as anonymousId,
      u.nickname,
      u.avatar_url as avatarUrl,
      cat.name as categoryName,
      cat.icon as categoryIcon
    FROM confessions c
    JOIN users u ON c.user_id = u.id
    JOIN categories cat ON c.category_id = cat.id
    WHERE c.id = ? AND c.status = 1`,
    [confessionId]
  );
  return rows[0] || null;
}

async function createConfession({
  userId,
  categoryId,
  title,
  content,
  audioUrl,
  audioDuration,
  audioSize
}) {
  const [result] = await mysqlPool.execute(
    `INSERT INTO confessions
      (user_id, category_id, title, content, audio_url, audio_duration, audio_size, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [userId, categoryId, title || null, content || null, audioUrl, audioDuration || 0, audioSize || 0]
  );
  return result.insertId;
}

module.exports = {
  getConfessionById,
  createConfession
};
