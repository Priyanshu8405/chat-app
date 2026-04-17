const express = require('express');
const router = express.Router();
const { getUsers, searchUsers } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', auth, getUsers);
router.get('/search', auth, searchUsers);

module.exports = router;
