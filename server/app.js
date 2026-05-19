require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    code: 429,
    message: '请求过于频繁，请5分钟后再试'
  }
});
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    code: 429,
    message: '上传过于频繁，请稍后再试'
  }
});
const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    code: 429,
    message: '举报提交过于频繁，请稍后再试'
  }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads (development only, use CDN in production)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', require('./routes/me'));
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/confession', require('./routes/confession'));
app.use('/api/comment', require('./routes/comment'));
app.use('/api/upload', uploadLimiter, require('./routes/upload'));
app.use('/api/ranking', require('./routes/ranking'));
app.use('/api/report', reportLimiter, require('./routes/report'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        code: 400,
        message: '文件大小超过限制'
      });
    }
    return res.status(400).json({
      code: 400,
      message: '文件上传失败'
    });
  }

  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
