const mysql = require('mysql2/promise');
const redis = require('redis');

// MySQL Connection Pool
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'voice_confession_wall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Redis Client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

// Initialize Redis connection
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

module.exports = {
  mysqlPool,
  redisClient
};
