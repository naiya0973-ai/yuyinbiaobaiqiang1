function normalizeProfile(profile) {
  return {
    id: profile.id,
    phone: profile.phone,
    nickname: profile.nickname,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at
  };
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
