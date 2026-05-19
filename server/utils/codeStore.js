/**
 * 内存验证码存储（单进程）。生产环境需换 Redis 等。
 */

const store = new Map();

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;

function useFixedCode() {
  const fixed = process.env.FIXED_SMS_CODE || process.env.MOCK_SMS_CODE;
  if (fixed && /^[0-9]{6}$/.test(String(fixed).trim())) {
    return String(fixed).trim();
  }
  return null;
}

function generateSixDigitCode() {
  const fixed = useFixedCode();
  if (fixed) return fixed;
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * @param {string} phone
 * @returns {{ ok: true } | { ok: false, waitSeconds: number }}
 */
function assertCanResend(phone) {
  const row = store.get(phone);
  if (!row) return { ok: true };
  const elapsed = Date.now() - row.lastSendAt;
  if (elapsed < RESEND_INTERVAL_MS) {
    const waitSeconds = Math.ceil((RESEND_INTERVAL_MS - elapsed) / 1000);
    return { ok: false, waitSeconds };
  }
  return { ok: true };
}

/**
 * @param {string} phone
 * @param {string} code
 */
function saveCode(phone, code) {
  const now = Date.now();
  store.set(phone, {
    code: String(code),
    expireAt: now + CODE_TTL_MS,
    lastSendAt: now
  });
}

/**
 * @param {string} phone
 * @param {string} inputCode
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function verifyAndConsume(phone, inputCode) {
  const row = store.get(phone);
  if (!row) {
    return { ok: false, message: '请先获取验证码' };
  }
  const now = Date.now();
  if (now > row.expireAt) {
    store.delete(phone);
    return { ok: false, message: '验证码已过期' };
  }
  if (String(inputCode).trim() !== row.code) {
    return { ok: false, message: '验证码错误' };
  }
  store.delete(phone);
  return { ok: true };
}

module.exports = {
  CODE_TTL_MS,
  RESEND_INTERVAL_MS,
  generateSixDigitCode,
  assertCanResend,
  saveCode,
  verifyAndConsume
};
