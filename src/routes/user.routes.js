const express = require('express');
const { getProfile, getAll, getById } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.use(authenticate);

router.get('/me', getProfile);
router.get('/', authorize('admin'), getAll);
router.get('/:id', authorize('admin'), getById);

module.exports = router;
