function normalizeProfile(profile) {
  return {
    id: profile.id,
    phone: maskPhone(profile.phone),
    nickname: profile.nickname,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at
  };
}

// 手机号脱敏：138****1234
function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

async function getMe(req, res) {
  return res.json({
    code: 0,
    data: normalizeProfile(req.user),
    message: 'success'
  });
}

module.exports = {
  getMe
};
