const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

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
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg',
    'audio/webm'
  ];
  const allowedExts = ['.mp3', '.wav', '.aac', '.ogg', '.webm', '.m4a'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 MP3, WAV, AAC, OGG, M4A 格式的音频文件'), false);
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

router.post('/audio', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return fail(res, 400, '请上传音频文件');
    }

    const { path: filePath, filename, size } = req.file;
    const ext = path.extname(filename).toLowerCase();
    const allowExts = ['.mp3', '.wav', '.aac', '.ogg', '.webm', '.m4a'];

    if (!allowExts.includes(ext)) {
      return fail(res, 400, '文件格式不支持');
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
      return fail(res, 400, '音频时长不能超过10分钟');
    }

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

    return ok(res, null, '删除成功');
  } catch (err) {
    console.error('Delete audio error:', err);
    return fail(res, 500, '服务器内部错误');
  }
});

module.exports = router;
