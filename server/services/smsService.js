const { supabaseAdmin } = require('../config/supabase');
const {
  generateSixDigitCode,
  assertCanResend,
  saveCode,
  verifyAndConsume
} = require('../utils/codeStore');

const CODE_TTL_MS = 5 * 60 * 1000;

async function saveSmsCode(phone, code) {
  const expiredAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const { error } = await supabaseAdmin.from('sms_codes').insert({
    phone,
    code: String(code),
    type: 'login',
    used: false,
    expired_at: expiredAt
  });

  if (error) {
    console.error('Save SMS code to Supabase error:', error);
  }

  saveCode(phone, code);
}

async function verifySmsCode(phone, inputCode) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('sms_codes')
    .select('id, code, expired_at, used')
    .eq('phone', phone)
    .eq('used', false)
    .gt('expired_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data && String(inputCode).trim() === data.code) {
    await supabaseAdmin.from('sms_codes').update({ used: true }).eq('id', data.id);
    return { ok: true };
  }

  return verifyAndConsume(phone, inputCode);
}

module.exports = {
  generateSixDigitCode,
  assertCanResend,
  saveSmsCode,
  verifySmsCode
};
