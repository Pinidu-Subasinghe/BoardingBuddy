const express = require('express');
const router = express.Router();

const {
	registerUser,
	verifyOtp,
	loginUser,
	forgotPassword,
	verifyForgotPasswordOtp,
	resetPasswordWithOtp,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);

module.exports = router;