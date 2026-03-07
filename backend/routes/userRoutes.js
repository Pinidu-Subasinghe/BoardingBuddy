const express = require('express');
const router = express.Router();

const {
  getUserProfile,
  updateUserProfile,
  deleteMyAccount,
  getAllUsers,
  deleteUser,
  createUser,
  updateUser
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Profile
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .delete(protect, deleteMyAccount);

// Admin
router.route('/')
  .get(protect, authorize('admin'), getAllUsers)
  .post(protect, authorize('admin'), createUser);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteUser)
  .put(protect, authorize('admin'), updateUser);

module.exports = router;