const crypto = require('crypto');

// Generate random nickname
const adjectives = ['安静', '温柔', '忧郁', '开心', '神秘', '可爱', '勇敢', '善良', '孤独', '快乐',
  '沉默', '热情', '细心', '调皮', '害羞', '坚强', '温柔', '可爱', '神秘', '独特'];
const nouns = ['猫咪', '星星', '云朵', '风铃', '彩虹', '雨滴', '月光', '雪花', '枫叶', '海风',
  '小鹿', '蝴蝶', '青鸟', '白鸽', '小熊', '兔子', '樱花', '竹子', '石子', '溪流'];

function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}的${noun}`;
}

// Generate anonymous ID
function generateAnonymousId() {
  const random = Math.floor(Math.random() * 100000);
  return `用户#${random.toString().padStart(5, '0')}`;
}

// Hash IP address
function hashIp(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Generate SMS code
function generateSmsCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

// Format response
function success(data = null, message = '操作成功') {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now()
  };
}

function error(message = '操作失败', code = 1, statusCode = 200) {
  const err = new Error(message);
  err.code = code;
  err.status = statusCode;
  return err;
}

// Pagination helper
function paginate(page = 1, limit = 20) {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (currentPage - 1) * pageSize;

  return {
    page: currentPage,
    limit: pageSize,
    offset
  };
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration (seconds to mm:ss)
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate hot score
function calculateHotScore(likeCount, commentCount, playCount) {
  return Math.round(likeCount * 2 + commentCount * 3 + playCount * 0.5);
}

const defaultSensitiveWords = (process.env.SENSITIVE_WORDS || '赌博,毒品,恐怖主义,自杀教程,诈骗链接,枪支弹药,色情交易,赌博网站,代孕,裸聊,刷单,杀猪盘,钓鱼链接,非法集资,传销,邪教,暴力血腥,儿童色情,贩卖毒品,管制刀具')
  .split(',')
  .map((w) => w.trim())
  .filter(Boolean);

function containsSensitiveContent(text = '') {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return defaultSensitiveWords.some((word) => normalized.includes(word));
}

function sanitizeInput(text = '') {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

module.exports = {
  generateNickname,
  generateAnonymousId,
  hashIp,
  generateSmsCode,
  success,
  error,
  paginate,
  formatFileSize,
  formatDuration,
  calculateHotScore,
  containsSensitiveContent,
  sanitizeInput
};
