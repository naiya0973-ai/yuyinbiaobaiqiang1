const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { generateToken, authenticate } = require('../middleware/auth');
const { generateNickname, sanitizeInput } = require('../utils/helpers');

const router = express.Router();

// 仅在开发环境允许使用固定验证码
const isDevelopment = process.env.NODE_ENV !== 'production';
const MOCK_SMS_CODE = isDevelopment ? process.env.MOCK_SMS_CODE : null;

if (isDevelopment && MOCK_SMS_CODE) {
  console.warn('[SECURITY WARNING] Using fixed SMS code for development:', MOCK_SMS_CODE);
}

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
    phone: maskPhone(profile.phone),
    nickname: profile.nickname,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at
  };
}

// 手机号脱敏：138****1234
function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
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

    return success(res, null, '验证码已发送');
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

    // 仅在开发环境允许使用固定验证码
    if (isDevelopment && MOCK_SMS_CODE && code === MOCK_SMS_CODE) {
      // 开发环境跳过验证码验证
    } else {
      // 生产环境必须验证真实验证码
      // TODO: 这里应该调用真实的短信服务验证验证码
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
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('头像地址必须是有效的 HTTP/HTTPS URL')
], async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;

    const updates = {};

    if (req.body.nickname) {
      updates.nickname = sanitizeInput(req.body.nickname);
    }

    if (req.body.avatarUrl) {
      // 额外验证 URL 不以 javascript: 或 data: 开头（防止 XSS）
      const url = req.body.avatarUrl.toLowerCase().trim();
      if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('vbscript:')) {
        return fail(res, 400, '头像地址包含不安全的协议');
      }
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
