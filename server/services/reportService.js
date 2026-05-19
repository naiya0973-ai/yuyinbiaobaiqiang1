const { mysqlPool } = require('../config/database');

async function createReport({ targetType, targetId, reporterId, reason, description }) {
  await mysqlPool.execute(
    'INSERT INTO reports (target_type, target_id, reporter_id, reason, description) VALUES (?, ?, ?, ?, ?)',
    [targetType, targetId, reporterId, reason, description || null]
  );
}

module.exports = {
  createReport
};
