const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// 文件类型魔数（Magic Numbers）检查
const FILE_SIGNATURES = {
  // MP3: ID3 标签或 MPEG 帧同步
  '.mp3': [
    Buffer.from([0x49, 0x44, 0x33]), // ID3
    Buffer.from([0xFF, 0xFB]),       // MPEG-1 Layer 3
    Buffer.from([0xFF, 0xF3]),       // MPEG-2 Layer 3
    Buffer.from([0xFF, 0xF2])        // MPEG-2.5 Layer 3
  ],
  // WAV: RIFF....WAVE
  '.wav': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
  // AAC: ADIF 或 ADTS
  '.aac': [
    Buffer.from([0xFF, 0xF1]), // ADTS
    Buffer.from([0xFF, 0xF9]),
    Buffer.from([0x41, 0x44, 0x49, 0x46]) // ADIF
  ],
  // OGG: OggS
  '.ogg': [Buffer.from([0x4F, 0x67, 0x67, 0x53])],
  // WebM: 1A 45 DF A3 (EBML header，WebM 基于 EBML)
  '.webm': [Buffer.from([0x1A, 0x45, 0xDF, 0xA3])],
  // M4A/AAC: ftypM4A 或 ftypmp42
  '.m4a': [
    Buffer.from([0x00, 0x00, 0x00]), // ftyp box
  ]
};

/**
 * 验证文件的真实类型（通过魔数检查）
 * @param {string} filePath - 文件路径
 * @param {string} ext - 期望的扩展名
 * @returns {boolean} - 是否验证通过
 */
function verifyFileSignature(filePath, ext) {
  try {
    const signatures = FILE_SIGNATURES[ext];
    if (!signatures) return false;

    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // 对于 M4A 需要特殊处理（ftyp box）
    if (ext === '.m4a') {
      // ftyp box 前 4 字节是 box size，然后 4 字节 'ftyp'
      return buffer.toString('ascii', 4, 8) === 'ftyp';
    }

    return signatures.some(sig => {
      if (bytesRead < sig.length) return false;
      return buffer.slice(0, sig.length).equals(sig);
    });
  } catch (err) {
    console.error('File signature verification error:', err);
    return false;
  }
}

function ok(res, data = null, message = '操作成功') {
  return res.json({ code: 0, data, message });
}

function fail(res, status, message) {
  return res.status(status).json({ code: status, data: null, message });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.mp3';
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // 严格的 MIME 类型检查
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a'
  ];
  const allowedExts = ['.mp3', '.wav', '.aac', '.ogg', '.webm', '.m4a'];
  const ext = path.extname(file.originalname).toLowerCase();

  // 只允许特定的 MIME 类型和扩展名，且两者必须匹配
  const isAllowedMime = allowedMimes.includes(file.mimetype);
  const isAllowedExt = allowedExts.includes(ext);

  if (isAllowedMime && isAllowedExt) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 MP3, WAV, AAC, OGG, M4A, WebM 格式的音频文件'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1
  }
});

// 使用数据库存储上传记录而不是内存 Map
async function trackUpload(userId, filename) {
  try {
    const { error } = await supabaseAdmin
      .from('uploaded_files')
      .insert({
        user_id: userId,
        filename: filename,
        created_at: new Date().toISOString()
      });
    if (error) {
      console.error('Track upload error:', error);
    }
  } catch (err) {
    console.error('Track upload error:', err);
  }
}

async function ownsUpload(userId, filename) {
  try {
    const { data, error } = await supabaseAdmin
      .from('uploaded_files')
      .select('id')
      .eq('user_id', userId)
      .eq('filename', filename)
      .maybeSingle();
    if (error) {
      console.error('Check upload ownership error:', error);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error('Check upload ownership error:', err);
    return false;
  }
}

router.post('/audio', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return fail(res, 400, '请上传音频文件');
    }

    const { path: filePath, filename, size } = req.file;
    const ext = path.extname(filename).toLowerCase();
    const allowExts = ['.mp3', '.wav', '.aac', '.ogg', '.webm', '.m4a'];

    if (!allowExts.includes(ext)) {
      fs.unlink(filePath, () => {});
      return fail(res, 400, '文件格式不支持');
    }

    // 验证文件真实类型（魔数检查）
    if (!verifyFileSignature(filePath, ext)) {
      fs.unlink(filePath, () => {});
      return fail(res, 400, '文件类型验证失败，请上传有效的音频文件');
    }

    let duration = 0;
    try {
      const ffmpeg = require('fluent-ffmpeg');
      const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
      ffmpeg.setFfmpegPath(ffmpegPath);

      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) reject(err);
          else {
            duration = Math.round(metadata.format.duration || 0);
            resolve();
          }
        });
      });
    } catch {
      duration = parseInt(req.body.duration, 10) || 0;
    }

    if (duration > 600) {
      fs.unlink(filePath, () => {});
      return fail(res, 400, '音频时长不能超过10分钟');
    }

    trackUpload(req.user.id, filename);

    return ok(res, {
      url: `${process.env.BASE_URL || ''}/uploads/audio/${filename}`,
      filename,
      size,
      duration
    }, '上传成功');
  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Upload audio error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

router.delete('/audio/:filename', authenticate, async (req, res) => {
  try {
    const { filename } = req.params;

    const owns = await ownsUpload(req.user.id, filename);
    if (!owns) {
      return fail(res, 403, '无权删除此文件');
    }

    const normalized = path.normalize(filename).replace(/[/\\]/g, '');
    if (!normalized || normalized !== filename) {
      return fail(res, 400, '无效的文件名');
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    const uploadDir = path.join(__dirname, '..', 'uploads', 'audio');
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(uploadDir);

    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return fail(res, 400, '无效的文件名');
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 从数据库删除记录
    await supabaseAdmin
      .from('uploaded_files')
      .delete()
      .eq('user_id', req.user.id)
      .eq('filename', filename);

    return ok(res, null, '删除成功');
  } catch (err) {
    console.error('Delete audio error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

module.exports = router;
