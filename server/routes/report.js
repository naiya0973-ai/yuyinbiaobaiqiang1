const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { sanitizeInput } = require('../utils/helpers');

const router = express.Router();

function ok(res, data = null, message = '操作成功') {
  return res.json({ code: 0, data, message });
}

function fail(res, status, message) {
  return res.status(status).json({ code: status, data: null, message });
}

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fail(res, 400, errors.array()[0].msg);
    return false;
  }
  return true;
}

async function getTarget(targetType, targetId) {
  const table = targetType === 'confession' ? 'confessions' : 'comments';
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id, user_id, reported_count')
    .eq('id', targetId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

router.post('/', authenticate, [
  body('targetType').isIn(['confession', 'comment']).withMessage('举报类型无效'),
  body('targetId').isInt({ min: 1 }).withMessage('举报对象ID无效'),
  body('reason').isLength({ min: 1, max: 50 }).withMessage('请选择举报原因'),
  body('description').optional().isLength({ max: 500 }).withMessage('描述最多500个字符')
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const reporterId = req.user.id;
    const { targetType, targetId, reason } = req.body;
    const description = sanitizeInput(req.body.description || '');
    const numericTargetId = Number(targetId);
    const target = await getTarget(targetType, numericTargetId);

    if (!target) {
      return fail(res, 404, targetType === 'confession' ? '举报的内容不存在' : '举报的评论不存在');
    }

    if (target.user_id === reporterId) {
      return fail(res, 400, targetType === 'confession' ? '不能举报自己的内容' : '不能举报自己的评论');
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('target_type', targetType)
      .eq('target_id', numericTargetId)
      .eq('reporter_id', reporterId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return fail(res, 400, '您已经举报过此内容，请勿重复举报');
    }

    const { error: insertError } = await supabaseAdmin.from('reports').insert({
      target_type: targetType,
      target_id: numericTargetId,
      reporter_id: reporterId,
      reason,
      description: description || null
    });

    if (insertError) throw insertError;

    if (targetType === 'confession') {
      const reportedCount = (target.reported_count || 0) + 1;
      const updates = { reported_count: reportedCount };
      if (reportedCount >= 5) updates.status = 'pending_review';

      const { error: updateError } = await supabaseAdmin
        .from('confessions')
        .update(updates)
        .eq('id', numericTargetId);

      if (updateError) throw updateError;
    }

    return ok(res, null, '举报成功，我们会尽快处理');
  } catch (err) {
    console.error('Create report error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/reasons', (req, res) => {
  return ok(res, [
    { value: '色情低俗', label: '色情低俗' },
    { value: '暴力血腥', label: '暴力血腥' },
    { value: '政治敏感', label: '政治敏感' },
    { value: '广告诈骗', label: '广告诈骗' },
    { value: '人身攻击', label: '人身攻击' },
    { value: '侵犯隐私', label: '侵犯隐私' },
    { value: '引战吵架', label: '引战吵架' },
    { value: '其他违规', label: '其他违规' }
  ]);
});

module.exports = router;
