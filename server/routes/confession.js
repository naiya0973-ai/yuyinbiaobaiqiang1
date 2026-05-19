const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { paginate, hashIp, containsSensitiveContent } = require('../utils/helpers');

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

  return {
    id: item.id,
    title: item.title,
    content: item.content,
    audioUrl: item.audio_url,
    audioDuration: item.audio_duration,
    audioSize: item.audio_size,
    likeCount: item.like_count,
    commentCount: item.comment_count,
    playCount: item.play_count,
    reportedCount: item.reported_count,
    createdAt: item.created_at,
    userId: item.user_id,
    nickname: profile.nickname || '',
    avatarUrl: profile.avatar_url || '',
    categoryId: item.category_id,
    categoryName: category.name || '',
    categoryIcon: category.icon || '',
    hotScore: Math.round((item.like_count || 0) * 2 + (item.comment_count || 0) * 3 + (item.play_count || 0) * 0.5),
    isLiked: !!item.isLiked
  };
}

async function getConfessionById(id) {
  const { data, error } = await supabaseAdmin
    .from('confessions')
    .select('id, user_id, category_id, title, content, audio_url, audio_duration, audio_size, like_count, comment_count, play_count, reported_count, created_at, profiles(nickname, avatar_url), categories(name, icon)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function markLiked(items, userId) {
  if (!userId || items.length === 0) return items;

  const ids = items.map((item) => item.id);
  const { data, error } = await supabaseAdmin
    .from('likes')
    .select('confession_id')
    .eq('user_id', userId)
    .in('confession_id', ids);

  if (error) throw error;

  const likedSet = new Set((data || []).map((item) => item.confession_id));
  return items.map((item) => ({ ...item, isLiked: likedSet.has(item.id) }));
}

router.get('/list', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isInt(),
  query('sort').optional().isIn(['newest', 'hot', 'popular'])
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;
    const sort = req.query.sort || 'newest';

    let builder = supabaseAdmin
      .from('confessions')
      .select('id, user_id, category_id, title, content, audio_url, audio_duration, audio_size, like_count, comment_count, play_count, reported_count, created_at, profiles(nickname, avatar_url), categories(name, icon)', { count: 'exact' });

    if (req.query.category) {
      builder = builder.eq('category_id', Number(req.query.category));
    }

    if (sort === 'popular') {
      builder = builder.order('play_count', { ascending: false }).order('created_at', { ascending: false });
    } else if (sort === 'hot') {
      builder = builder.order('like_count', { ascending: false }).order('comment_count', { ascending: false }).order('play_count', { ascending: false });
    } else {
      builder = builder.order('created_at', { ascending: false });
    }

    const { data, error, count } = await builder.range(offset, to);
    if (error) throw error;

    const withLikes = await markLiked(data || [], req.user?.id);

    return ok(res, {
      list: withLikes.map(normalizeConfession),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Get confession list error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/user/my', authenticate, async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from('confessions')
      .select('id, user_id, category_id, title, content, audio_url, audio_duration, audio_size, like_count, comment_count, play_count, reported_count, created_at, profiles(nickname, avatar_url), categories(name, icon)', { count: 'exact' })
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
    console.error('Get my confessions error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/:id', optionalAuth, [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const confession = await getConfessionById(Number(req.params.id));
    if (!confession) {
      return fail(res, 404, '表白内容不存在或已被删除');
    }

    const withLikes = await markLiked([confession], req.user?.id);
    recordPlay(confession.id, req.user?.id, req.ip);

    return ok(res, normalizeConfession(withLikes[0]));
  } catch (err) {
    console.error('Get confession detail error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.post('/', authenticate, [
  body('categoryId').isInt({ min: 1 }).withMessage('请选择有效的分类'),
  body('audioUrl').isURL().withMessage('请上传音频文件'),
  body('title').optional().isLength({ max: 100 }).withMessage('标题最多100个字符'),
  body('content').optional().isLength({ max: 500 }).withMessage('内容最多500个字符'),
  body('audioDuration').optional().isInt({ min: 0 }).withMessage('音频时长无效'),
  body('audioSize').optional().isInt({ min: 0 }).withMessage('音频大小无效')
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const { categoryId, title, content, audioUrl, audioDuration, audioSize } = req.body;
    if (containsSensitiveContent(title) || containsSensitiveContent(content)) {
      return fail(res, 400, '内容包含敏感词，请修改后再发布');
    }

    const { data, error } = await supabaseAdmin
      .from('confessions')
      .insert({
        user_id: req.user.id,
        category_id: Number(categoryId),
        title: title || null,
        content: content || null,
        audio_url: audioUrl,
        audio_duration: Number(audioDuration || 0),
        audio_size: Number(audioSize || 0)
      })
      .select('id')
      .single();

    if (error) throw error;

    return ok(res, { id: data.id }, '发布成功');
  } catch (err) {
    console.error('Create confession error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.delete('/:id', authenticate, [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const confession = await getConfessionById(Number(req.params.id));
    if (!confession) {
      return fail(res, 404, '表白内容不存在');
    }

    if (confession.user_id !== req.user.id) {
      return fail(res, 403, '无权删除此内容');
    }

    const { error } = await supabaseAdmin
      .from('confessions')
      .delete()
      .eq('id', confession.id);

    if (error) throw error;

    return ok(res, null, '删除成功');
  } catch (err) {
    console.error('Delete confession error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.post('/:id/like', authenticate, [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const confession = await getConfessionById(Number(req.params.id));
    if (!confession) {
      return fail(res, 404, '表白内容不存在');
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('confession_id', confession.id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      const { error: deleteError } = await supabaseAdmin.from('likes').delete().eq('id', existing.id);
      if (deleteError) throw deleteError;

      const likeCount = Math.max(0, (confession.like_count || 0) - 1);
      const { error: updateError } = await supabaseAdmin.from('confessions').update({ like_count: likeCount }).eq('id', confession.id);
      if (updateError) throw updateError;

      return ok(res, { isLiked: false, likeCount }, '取消点赞成功');
    }

    const { error: insertError } = await supabaseAdmin.from('likes').insert({ user_id: req.user.id, confession_id: confession.id });
    if (insertError) throw insertError;

    const likeCount = (confession.like_count || 0) + 1;
    const { error: updateError } = await supabaseAdmin.from('confessions').update({ like_count: likeCount }).eq('id', confession.id);
    if (updateError) throw updateError;

    return ok(res, { isLiked: true, likeCount }, '点赞成功');
  } catch (err) {
    console.error('Toggle like error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

async function recordPlay(confessionId, userId, ip) {
  try {
    const ipHash = ip ? hashIp(ip) : null;
    let builder = supabaseAdmin.from('play_history').select('id').eq('confession_id', confessionId).limit(1);

    if (userId) builder = builder.eq('user_id', userId);
    else if (ipHash) builder = builder.eq('ip_hash', ipHash);
    else return;

    const { data: existing, error: existingError } = await builder;
    if (existingError) throw existingError;
    if (existing && existing.length > 0) return;

    const { error: insertError } = await supabaseAdmin.from('play_history').insert({
      confession_id: confessionId,
      user_id: userId || null,
      ip_hash: ipHash
    });
    if (insertError) throw insertError;

    const confession = await getConfessionById(confessionId);
    if (!confession) return;

    await supabaseAdmin.from('confessions').update({ play_count: (confession.play_count || 0) + 1 }).eq('id', confessionId);
  } catch (err) {
    console.error('Record play error:', err);
  }
}

module.exports = router;
