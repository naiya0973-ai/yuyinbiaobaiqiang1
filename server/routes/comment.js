const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { paginate, containsSensitiveContent, sanitizeInput } = require('../utils/helpers');

const router = express.Router();

// 创建评论的速率限制
const createCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 50, // 每小时最多50条评论
  message: {
    code: 429,
    message: '评论过于频繁，请稍后再试'
  },
  // 基于用户ID限流
  keyGenerator: (req) => req.user?.id || req.ip
});

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

function normalizeComment(item) {
  const profile = item.profiles || {};
  return {
    id: item.id,
    confessionId: item.confession_id,
    content: item.content,
    createdAt: item.created_at,
    userId: item.user_id,
    nickname: profile.nickname || '',
    avatarUrl: profile.avatar_url || ''
  };
}

async function getConfession(id) {
  const { data, error } = await supabaseAdmin
    .from('confessions')
    .select('id, user_id, comment_count')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

router.get('/:confessionId', [
  param('confessionId').isInt({ min: 1 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const confessionId = Number(req.params.confessionId);
    const confession = await getConfession(confessionId);
    if (!confession) {
      return fail(res, 404, '表白内容不存在');
    }

    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('comments')
      .select('id, confession_id, user_id, content, created_at, profiles(nickname, avatar_url)', { count: 'exact' })
      .eq('confession_id', confessionId)
      .order('created_at', { ascending: false })
      .range(offset, to);

    if (error) throw error;

    return ok(res, {
      list: (data || []).map(normalizeComment),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Get comments error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.post('/', authenticate, createCommentLimiter, [
  body('confessionId').isInt({ min: 1 }).withMessage('无效的表白ID'),
  body('content').isLength({ min: 1, max: 500 }).withMessage('评论内容应在1-500个字符之间')
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const { confessionId } = req.body;
    const content = sanitizeInput(req.body.content || '');
    if (!content) {
      return fail(res, 400, '评论内容不能为空');
    }
    if (containsSensitiveContent(content)) {
      return fail(res, 400, '评论包含敏感词，请修改后再提交');
    }

    const confession = await getConfession(Number(confessionId));
    if (!confession) {
      return fail(res, 404, '表白内容不存在或已被删除');
    }

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        confession_id: Number(confessionId),
        user_id: req.user.id,
        content
      })
      .select('id, confession_id, user_id, content, created_at, profiles(nickname, avatar_url)')
      .single();

    if (error) throw error;

    const { error: updateError } = await supabaseAdmin
      .from('confessions')
      .update({ comment_count: (confession.comment_count || 0) + 1 })
      .eq('id', Number(confessionId));

    if (updateError) throw updateError;

    return ok(res, normalizeComment(data), '评论成功');
  } catch (err) {
    console.error('Create comment error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.delete('/:id', authenticate, [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .select('id, user_id, confession_id, confessions(user_id, comment_count)')
      .eq('id', Number(req.params.id))
      .maybeSingle();

    if (error) throw error;
    if (!comment) {
      return fail(res, 404, '评论不存在');
    }

    const confessionOwnerId = comment.confessions?.user_id;
    if (comment.user_id !== req.user.id && confessionOwnerId !== req.user.id) {
      return fail(res, 403, '无权删除此评论');
    }

    const { error: deleteError } = await supabaseAdmin.from('comments').delete().eq('id', comment.id);
    if (deleteError) throw deleteError;

    const nextCount = Math.max(0, (comment.confessions?.comment_count || 0) - 1);
    const { error: updateError } = await supabaseAdmin
      .from('confessions')
      .update({ comment_count: nextCount })
      .eq('id', comment.confession_id);

    if (updateError) throw updateError;

    return ok(res, null, '删除成功');
  } catch (err) {
    console.error('Delete comment error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

module.exports = router;
