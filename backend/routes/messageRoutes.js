const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, uploadFile } = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.post('/', auth, sendMessage);
router.get('/:userId', auth, getMessages);
router.post('/upload', auth, uploadFile);

module.exports = router;
