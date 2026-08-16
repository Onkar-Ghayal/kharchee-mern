const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    googleAuth,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile
} = require("../controllers/authController");

// Authentication & Registration
router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", loginUser);
router.post("/google", googleAuth);

// Password Recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Profile
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;
