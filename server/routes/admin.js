const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { adminAuth } = require('../middleware/adminAuth');
const { paginate } = require('../utils/helpers');

const router = express.Router();

router.use(adminAuth);

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

router.get('/stats', async (req, res) => {
  try {
    const [confessions, pendingReview, reports, users] = await Promise.all([
      supabaseAdmin.from('confessions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('confessions').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true })
    ]);

    const errors = [confessions, pendingReview, reports, users].filter((r) => r.error);
    if (errors.length) throw errors[0].error;

    return ok(res, {
      confessionTotal: confessions.count || 0,
      pendingReview: pendingReview.count || 0,
      pendingReports: reports.count || 0,
      userTotal: users.count || 0
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/reports', [
  query('status').optional().isIn(['pending', 'handled', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;
    const status = req.query.status || 'pending';

    const { data, error, count } = await supabaseAdmin
      .from('reports')
      .select('id, target_type, target_id, reporter_id, reason, description, status, created_at', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, to);

    if (error) throw error;

    return ok(res, {
      list: data || [],
      pagination: { page, limit, total: count || 0 }
    });
  } catch (err) {
    console.error('Admin reports list error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.patch('/reports/:id', [
  param('id').isInt({ min: 1 }),
  body('action').isIn(['handled', 'rejected'])
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const reportId = Number(req.params.id);
    const { action } = req.body;

    const { data: report, error: findError } = await supabaseAdmin
      .from('reports')
      .select('id, status')
      .eq('id', reportId)
      .maybeSingle();

    if (findError) throw findError;
    if (!report) return fail(res, 404, '举报记录不存在');
    if (report.status !== 'pending') return fail(res, 400, '该举报已处理');

    const { error } = await supabaseAdmin
      .from('reports')
      .update({ status: action, handled_at: new Date().toISOString() })
      .eq('id', reportId);

    if (error) throw error;

    return ok(res, null, action === 'handled' ? '已标记为已处理' : '已驳回举报');
  } catch (err) {
    console.error('Admin report patch error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/confessions', [
  query('status').optional().isIn(['published', 'pending_review', 'hidden', 'deleted']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const to = offset + limit - 1;
    const status = req.query.status || 'pending_review';

    const { data, error, count } = await supabaseAdmin
      .from('confessions')
      .select('id, user_id, category_id, title, content, audio_url, status, reported_count, like_count, comment_count, created_at, profiles(nickname)', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, to);

    if (error) throw error;

    const list = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      audioUrl: item.audio_url,
      status: item.status,
      reportedCount: item.reported_count,
      likeCount: item.like_count,
      commentCount: item.comment_count,
      createdAt: item.created_at,
      nickname: item.profiles?.nickname || ''
    }));

    return ok(res, {
      list,
      pagination: { page, limit, total: count || 0 }
    });
  } catch (err) {
    console.error('Admin confessions list error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.patch('/confessions/:id', [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['published', 'hidden', 'deleted', 'pending_review'])
], async (req, res) => {
  try {
    if (!validate(req, res)) return;

    const confessionId = Number(req.params.id);
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('confessions')
      .update({ status })
      .eq('id', confessionId)
      .select('id, status')
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail(res, 404, '内容不存在');

    return ok(res, { id: data.id, status: data.status }, '状态已更新');
  } catch (err) {
    console.error('Admin confession patch error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

module.exports = router;
