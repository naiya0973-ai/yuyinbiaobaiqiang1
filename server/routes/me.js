const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMe } = require('../controllers/meController');

const router = express.Router();

router.get('/me', authenticate, getMe);

module.exports = router;
