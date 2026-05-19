const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { paginate } = require('../utils/helpers');

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

function normalizeProfile(profile, stats = {}) {
  return {
    id: profile.id,
    phone: profile.phone,
    nickname: profile.nickname,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    confessionCount: stats.confessionCount || 0,
    commentCount: stats.commentCount || 0,
    totalLikes: stats.totalLikes || 0
  };
}

function normalizeConfession(item) {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    audioUrl: item.audio_url,
    audioDuration: item.audio_duration,
    likeCount: item.like_count,
    commentCount: item.comment_count,
    playCount: item.play_count,
    createdAt: item.created_at,
    categoryName: item.categories?.name || '',
    categoryIcon: item.categories?.icon || ''
  };
}

router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [{ count: confessionCount, error: confessionCountError }, { count: commentCount, error: commentCountError }, { data: confessions, error: likesError }] = await Promise.all([
      supabaseAdmin.from('confessions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('confessions').select('like_count').eq('user_id', userId)
    ]);

    if (confessionCountError || commentCountError || likesError) {
      throw confessionCountError || commentCountError || likesError;
    }

    const totalLikes = (confessions || []).reduce((sum, item) => sum + (item.like_count || 0), 0);

    return ok(res, normalizeProfile(req.user, {
      confessionCount,
      commentCount,
      totalLikes
    }));
  } catch (err) {
    console.error('Get user profile error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.put('/profile', authenticate, [
  body('nickname').optional().isLength({ min: 1, max: 50 }).withMessage('昵称长度应在1-50个字符之间'),
  body('avatarUrl').optional().isURL().withMessage('头像地址格式不正确')
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const updates = {};
    if (req.body.nickname) updates.nickname = req.body.nickname.trim();
    if (req.body.avatarUrl) updates.avatar_url = req.body.avatarUrl;

    if (Object.keys(updates).length === 0) {
      return fail(res, 400, '没有要更新的内容');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, phone, nickname, avatar_url, created_at')
      .single();

    if (error) throw error;

    return ok(res, normalizeProfile(data), '更新成功');
  } catch (err) {
    console.error('Update user profile error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/confessions', authenticate, async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('confessions')
      .select('id, title, content, audio_url, audio_duration, like_count, comment_count, play_count, created_at, categories(name, icon)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, to);

    if (error) throw error;

    return ok(res, {
      list: (data || []).map(normalizeConfession),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Get user confessions error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/comments', authenticate, async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('comments')
      .select('id, content, created_at, confessions(id, title, audio_url)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, to);

    if (error) throw error;

    return ok(res, {
      list: (data || []).map((item) => ({
        id: item.id,
        content: item.content,
        createdAt: item.created_at,
        confessionId: item.confessions?.id,
        confessionTitle: item.confessions?.title,
        confessionAudioUrl: item.confessions?.audio_url
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Get user comments error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

module.exports = router;
