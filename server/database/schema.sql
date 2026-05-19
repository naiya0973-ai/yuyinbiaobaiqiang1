-- Voice Confession Wall Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS voice_confession_wall
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE voice_confession_wall;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(11) NOT NULL UNIQUE COMMENT '手机号',
  nickname VARCHAR(50) NOT NULL COMMENT '随机昵称',
  avatar_url VARCHAR(500) COMMENT '头像URL',
  anonymous_id VARCHAR(20) NOT NULL UNIQUE COMMENT '匿名代号',
  ip_hash VARCHAR(64) COMMENT 'IP哈希值，用于限流',
  status TINYINT DEFAULT 1 COMMENT '状态: 1正常 2禁言 3封号',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_anonymous_id (anonymous_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(20) NOT NULL COMMENT '分类名称',
  icon VARCHAR(50) COMMENT '分类图标',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- Insert default categories
INSERT INTO categories (id, name, icon, sort_order) VALUES
  (1, '暗恋', 'heart', 1),
  (2, '失恋', 'broken-heart', 2),
  (3, '感谢', 'smile', 3),
  (4, '道歉', 'handshake', 4),
  (5, '其他', 'more', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Confessions table
CREATE TABLE IF NOT EXISTS confessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '发布者ID',
  category_id INT NOT NULL COMMENT '分类ID',
  title VARCHAR(100) COMMENT '标题',
  content TEXT COMMENT '文字内容（可选）',
  audio_url VARCHAR(500) NOT NULL COMMENT '音频URL',
  audio_duration INT COMMENT '音频时长(秒)',
  audio_size INT COMMENT '音频大小(bytes)',
  status TINYINT DEFAULT 1 COMMENT '状态: 1正常 2下架 3待审核',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  play_count INT DEFAULT 0 COMMENT '播放数',
  reported_count INT DEFAULT 0 COMMENT '被举报次数',
  is_featured TINYINT DEFAULT 0 COMMENT '是否精选: 0否 1是',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_hot_score (like_count, comment_count, play_count),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='表白表';

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  confession_id BIGINT NOT NULL COMMENT '表白ID',
  user_id BIGINT NOT NULL COMMENT '评论者ID',
  content TEXT NOT NULL COMMENT '评论内容',
  status TINYINT DEFAULT 1 COMMENT '状态: 1正常 2删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_confession_id (confession_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (confession_id) REFERENCES confessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  confession_id BIGINT NOT NULL COMMENT '表白ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_confession_user (confession_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (confession_id) REFERENCES confessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  target_type VARCHAR(20) NOT NULL COMMENT '举报对象类型: confession/comment',
  target_id BIGINT NOT NULL COMMENT '对象ID',
  reporter_id BIGINT NOT NULL COMMENT '举报人ID',
  reason VARCHAR(50) NOT NULL COMMENT '举报原因',
  description TEXT COMMENT '详细描述',
  status TINYINT DEFAULT 0 COMMENT '状态: 0待处理 1已处理 2驳回',
  handled_by BIGINT COMMENT '处理人ID',
  handled_at TIMESTAMP NULL COMMENT '处理时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target (target_type, target_id),
  INDEX idx_reporter_id (reporter_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报表';

-- Play history table (for tracking unique plays)
CREATE TABLE IF NOT EXISTS play_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  confession_id BIGINT NOT NULL COMMENT '表白ID',
  user_id BIGINT COMMENT '用户ID（未登录为NULL）',
  ip_hash VARCHAR(64) COMMENT 'IP哈希',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_confession_user (confession_id, user_id, ip_hash),
  INDEX idx_confession_id (confession_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (confession_id) REFERENCES confessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='播放记录表';

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  role ENUM('super', 'admin', 'moderator') DEFAULT 'moderator' COMMENT '角色',
  status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- SMS verification codes table
CREATE TABLE IF NOT EXISTS sms_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(11) NOT NULL COMMENT '手机号',
  code VARCHAR(6) NOT NULL COMMENT '验证码',
  type VARCHAR(20) NOT NULL COMMENT '类型: login/register/reset',
  used TINYINT DEFAULT 0 COMMENT '是否已使用: 0否 1是',
  expired_at TIMESTAMP NOT NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_expired_at (expired_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信验证码表';
