const express = require('express');
const { query, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
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

function normalizeConfession(item) {
  const profile = item.profiles || {};
  const category = item.categories || {};
  const hotScore = Math.round((item.like_count || 0) * 2 + (item.comment_count || 0) * 3 + (item.play_count || 0) * 0.5);

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
    nickname: profile.nickname || '',
    avatarUrl: profile.avatar_url || '',
    categoryName: category.name || '',
    categoryIcon: category.icon || '',
    hotScore
  };
}

function getStartDate(period) {
  const now = new Date();
  if (period === 'day') now.setDate(now.getDate() - 1);
  else if (period === 'week') now.setDate(now.getDate() - 7);
  else if (period === 'month') now.setDate(now.getDate() - 30);
  else return null;
  return now.toISOString();
}

router.get('/hot', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('period').optional().isIn(['day', 'week', 'month', 'all'])
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;
    const period = req.query.period || 'all';
    const startDate = getStartDate(period);

    let builder = supabaseAdmin
      .from('confessions')
      .select('id, user_id, title, content, audio_url, audio_duration, like_count, comment_count, play_count, created_at, profiles(nickname, avatar_url), categories(name, icon)', { count: 'exact' });

    if (startDate) {
      builder = builder.gte('created_at', startDate);
    }

    const { data, error, count } = await builder
      .order('like_count', { ascending: false })
      .order('comment_count', { ascending: false })
      .order('play_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, to);

    if (error) throw error;

    const list = (data || [])
      .map(normalizeConfession)
      .sort((a, b) => b.hotScore - a.hotScore || new Date(b.createdAt) - new Date(a.createdAt));

    return ok(res, {
      list,
      period,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Get hot ranking error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, icon, sort_order')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const result = await Promise.all((categories || []).map(async (category) => {
      const { count, error: countError } = await supabaseAdmin
        .from('confessions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (countError) throw countError;

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        sortOrder: category.sort_order,
        count: count || 0
      };
    }));

    return ok(res, result);
  } catch (err) {
    console.error('Get categories error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

module.exports = router;
