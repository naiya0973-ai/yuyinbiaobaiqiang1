const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const {
  shouldUseSupabaseStorage,
  uploadAudio,
  deleteAudio
} = require('../utils/storageService');

const router = express.Router();

const FILE_SIGNATURES = {
  '.mp3': [
    Buffer.from([0x49, 0x44, 0x33]),
    Buffer.from([0xFF, 0xFB]),
    Buffer.from([0xFF, 0xF3]),
    Buffer.from([0xFF, 0xF2])
  ],
  '.wav': [Buffer.from([0x52, 0x49, 0x46, 0x46])],
  '.aac': [
    Buffer.from([0xFF, 0xF1]),
    Buffer.from([0xFF, 0xF9]),
    Buffer.from([0x41, 0x44, 0x49, 0x46])
  ],
  '.ogg': [Buffer.from([0x4F, 0x67, 0x67, 0x53])],
  '.webm': [Buffer.from([0x1A, 0x45, 0xDF, 0xA3])],
  '.m4a': [Buffer.from([0x00, 0x00, 0x00])]
};

function verifyFileSignature(buffer, ext) {
  try {
    const signatures = FILE_SIGNATURES[ext];
    if (!signatures || buffer.length < 4) return false;

    if (ext === '.m4a') {
      return buffer.toString('ascii', 4, 8) === 'ftyp';
    }

    return signatures.some((sig) => {
      if (buffer.length < sig.length) return false;
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

function getUploadDir() {
  return process.env.VERCEL
    ? path.join('/tmp', 'uploads', 'audio')
    : path.join(__dirname, '..', 'uploads', 'audio');
}

function getPublicBaseUrl() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return '';
}

const useCloudStorage = shouldUseSupabaseStorage();

const storage = useCloudStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = getUploadDir();
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
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a'
  ];
  const allowedExts = ['.mp3', '.wav', '.aac', '.ogg', '.webm', '.m4a'];
  const ext = path.extname(file.originalname).toLowerCase();
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

async function getAudioDuration(filePath, fileBuffer, bodyDuration) {
  if (process.env.VERCEL) {
    return parseInt(bodyDuration, 10) || 0;
  }

  try {
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    ffmpeg.setFfmpegPath(ffmpegPath);

    return await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(Math.round(metadata.format.duration || 0));
      });
    });
  } catch {
    return parseInt(bodyDuration, 10) || 0;
  }
}

router.post('/audio', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return fail(res, 400, '请上传音频文件');
    }

    const { filename, size, mimetype } = req.file;
    const ext = path.extname(filename).toLowerCase();
    const allowExts = ['.mp3', '.wav', '.aac', '.ogg', '.webm', '.m4a'];

    if (!allowExts.includes(ext)) {
      if (req.file.path) fs.unlink(req.file.path, () => {});
      return fail(res, 400, '文件格式不支持');
    }

    const fileBuffer = req.file.buffer || fs.readFileSync(req.file.path);
    if (!verifyFileSignature(fileBuffer, ext)) {
      if (req.file.path) fs.unlink(req.file.path, () => {});
      return fail(res, 400, '文件类型验证失败，请上传有效的音频文件');
    }

    const duration = await getAudioDuration(req.file.path, fileBuffer, req.body.duration);

    if (duration > 600) {
      if (req.file.path) fs.unlink(req.file.path, () => {});
      return fail(res, 400, '音频时长不能超过10分钟');
    }

    let audioUrl;

    if (useCloudStorage) {
      const uploaded = await uploadAudio(fileBuffer, filename, mimetype);
      audioUrl = uploaded.url;
    } else {
      audioUrl = `${getPublicBaseUrl()}/uploads/audio/${filename}`;
    }

    trackUpload(req.user.id, filename);

    return ok(res, {
      url: audioUrl,
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

    if (useCloudStorage) {
      await deleteAudio(filename);
    } else {
      const filePath = path.join(getUploadDir(), filename);
      const uploadDir = getUploadDir();
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(uploadDir);

      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        return fail(res, 400, '无效的文件名');
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

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
