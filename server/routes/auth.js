const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { generateToken, authenticate } = require('../middleware/auth');
const { generateNickname } = require('../utils/helpers');

const router = express.Router();
const MOCK_SMS_CODE = process.env.MOCK_SMS_CODE || '123456';

function success(res, data = null, message = '操作成功') {
  return res.json({
    code: 0,
    message,
    data
  });
}

function fail(res, status, message, data = null) {
  return res.status(status).json({
    code: status,
    message,
    data
  });
}

function handleValidation(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    fail(res, 400, errors.array()[0].msg);
    return false;
  }

  return true;
}

function normalizeProfile(profile) {
  return {
    id: profile.id,
    phone: profile.phone,
    nickname: profile.nickname,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at
  };
}

async function findProfileByPhone(phone) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, nickname, avatar_url, created_at')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function createProfile(phone) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      phone,
      nickname: generateNickname(),
      avatar_url: null
    })
    .select('id, phone, nickname, avatar_url, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

router.post('/send-code', [
  body('phone')
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码')
], async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;

    return success(
      res,
      process.env.NODE_ENV === 'production' ? null : { code: MOCK_SMS_CODE },
      '验证码已发送'
    );
  } catch (err) {
    console.error('Send code error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.post('/login', [
  body('phone')
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('请输入6位数字验证码')
], async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;

    const { phone, code } = req.body;

    if (code !== MOCK_SMS_CODE) {
      return fail(res, 400, '验证码错误');
    }

    let profile = await findProfileByPhone(phone);
    const isNewUser = !profile;

    if (!profile) {
      profile = await createProfile(phone);
    }

    const token = generateToken(profile.id);

    return success(res, {
      token,
      user: normalizeProfile(profile),
      isNewUser
    }, isNewUser ? '注册成功' : '登录成功');
  } catch (err) {
    console.error('Login error:', err);

    if (err.code === '23505') {
      return fail(res, 409, '用户已存在，请重试');
    }

    return fail(res, 500, '服务器内部错误');
  }
});

router.get('/me', authenticate, async (req, res) => {
  return success(res, normalizeProfile(req.user));
});

router.put('/profile', authenticate, [
  body('nickname')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度应在1-50个字符之间'),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('头像地址格式不正确')
], async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;

    const updates = {};

    if (req.body.nickname) {
      updates.nickname = req.body.nickname.trim();
    }

    if (req.body.avatarUrl) {
      updates.avatar_url = req.body.avatarUrl;
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, 400, '没有要更新的内容');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.userId)
      .select('id, phone, nickname, avatar_url, created_at')
      .single();

    if (error) {
      throw error;
    }

    return success(res, normalizeProfile(data), '更新成功');
  } catch (err) {
    console.error('Update profile error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

module.exports = router;
