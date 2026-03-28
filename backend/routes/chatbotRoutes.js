const express = require('express');
const router = express.Router();
const { askBrowseChatbot } = require('../controllers/chatbotController');
const { attachUserIfPresent } = require('../middleware/authMiddleware');

router.post('/ask', attachUserIfPresent, askBrowseChatbot);

module.exports = router;
