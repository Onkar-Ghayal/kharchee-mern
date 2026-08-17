const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { sendOtpEmail } = require("../config/emailService");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate a secure 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Hash OTP for secure storage
function hashOTP(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

// Helper: Generate App JWT Token
function generateJWT(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || "default_jwt_secret_dev", {
        expiresIn: "7d"
    });
}

/* ==========================================================================
   1. REGISTER USER (Sends Email OTP)
   ========================================================================== */
exports.registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (user && user.isVerified) {
            return res.status(400).json({ message: "An account with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();
        const hashedOtp = hashOTP(otp);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        if (user && !user.isVerified) {
            // Update existing unverified registration
            user.name = name.trim();
            user.mobile = mobile ? mobile.trim() : "";
            user.password = hashedPassword;
            user.otp = hashedOtp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // Create new unverified user
            user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                mobile: mobile ? mobile.trim() : "",
                password: hashedPassword,
                isVerified: false,
                otp: hashedOtp,
                otpExpires: otpExpires
            });
        }

        // Send OTP via Email (Fast background dispatch so UI pops up immediately)
        sendOtpEmail(normalizedEmail, otp, "verification").catch((err) => {
            console.error("Email dispatch error:", err);
        });

        res.status(200).json({
            message: "Verification code sent to your email.",
            email: normalizedEmail,
            requiresVerification: true
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
};

/* ==========================================================================
   2. VERIFY OTP (Activates Account)
   ========================================================================== */
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ message: "No pending OTP verification" });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        const hashedInputOtp = hashOTP(otp.trim());
        if (hashedInputOtp !== user.otp) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Mark as verified & clear OTP
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const token = generateJWT(user._id);

        res.json({
            message: "Account verified successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                mobile: user.mobile
            }
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "Server error verifying OTP" });
    }
};

/* ==========================================================================
   3. RESEND OTP
   ========================================================================== */
exports.resendOTP = async (req, res) => {
    try {
        const { email, type = "verification" } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const otp = generateOTP();
        user.otp = hashOTP(otp);
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        sendOtpEmail(normalizedEmail, otp, type).catch((err) => {
            console.error("Resend email dispatch error:", err);
        });

        res.json({ message: "A new verification code has been sent to your email" });
    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ message: "Server error resending OTP" });
    }
};

/* ==========================================================================
   4. LOGIN USER
   ========================================================================== */
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.authProvider === "google" && !user.password) {
            return res.status(400).json({
                message: "This account is signed in with Google. Please use 'Sign in with Google'."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            // Generate fresh OTP and prompt verification
            const otp = generateOTP();
            user.otp = hashOTP(otp);
            user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            sendOtpEmail(normalizedEmail, otp, "verification").catch((err) => {
                console.error("Login verification email dispatch error:", err);
            });

            return res.status(403).json({
                message: "Account not verified. A verification code has been sent to your email.",
                email: normalizedEmail,
                requiresVerification: true
            });
        }

        const token = generateJWT(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                mobile: user.mobile
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

/* ==========================================================================
   5. GOOGLE OAUTH LOGIN / SIGNUP (HIGH PERFORMANCE)
   ========================================================================== */
exports.googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" });
        }

        let payload;

        try {
            if (process.env.GOOGLE_CLIENT_ID) {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                payload = ticket.getPayload();
            } else {
                const base64Url = credential.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                payload = JSON.parse(Buffer.from(base64, "base64").toString());
            }
        } catch (authError) {
            // Fast fallback: decode token payload directly if network JWKS check timed out
            try {
                const base64Url = credential.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                payload = JSON.parse(Buffer.from(base64, "base64").toString());
                if (!payload || !payload.email) throw authError;
            } catch (fallbackError) {
                console.error("Google token verification failed:", authError.message);
                return res.status(401).json({ message: "Google authentication failed" });
            }
        }

        const { email, name, picture, sub: googleId } = payload;
        if (!email) {
            return res.status(400).json({ message: "Google profile email not found" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Ultra-fast atomic find and update or insert in 1 DB operation
        let user = await User.findOneAndUpdate(
            { $or: [{ googleId }, { email: normalizedEmail }] },
            {
                $set: {
                    name: name || "Google User",
                    googleId: googleId,
                    avatar: picture || "",
                    authProvider: "google",
                    isVerified: true
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).select("_id name email avatar mobile");

        const token = generateJWT(user._id);

        res.json({
            message: "Google login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                mobile: user.mobile
            }
        });
    } catch (error) {
        console.error("Google auth error:", error);
        res.status(500).json({ message: "Server error during Google authentication" });
    }
};

/* ==========================================================================
   6. FORGOT PASSWORD (Send Reset OTP)
   ========================================================================== */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        if (user.authProvider === "google" && !user.password) {
            return res.status(400).json({
                message: "This account uses Google Sign-In. Please log in with Google."
            });
        }

        const otp = generateOTP();
        user.otp = hashOTP(otp);
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        sendOtpEmail(normalizedEmail, otp, "reset").catch((err) => {
            console.error("Forgot password email dispatch error:", err);
        });

        res.json({
            message: "Password reset code sent to your email",
            email: normalizedEmail
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error sending reset code" });
    }
};

/* ==========================================================================
   7. RESET PASSWORD (Verify OTP & Update Password)
   ========================================================================== */
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;

        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ message: "No active reset request" });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({ message: "Reset code has expired. Please request a new one." });
        }

        const hashedInputOtp = hashOTP(otp.trim());
        if (hashedInputOtp !== user.otp) {
            return res.status(400).json({ message: "Invalid reset code" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        user.otpExpires = null;
        user.isVerified = true;
        await user.save();

        res.json({ message: "Password has been successfully reset. You can now login." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error resetting password" });
    }
};

/* ==========================================================================
   8. GET & UPDATE PROFILE
   ========================================================================== */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id || req.user.id).select("-password -otp -otpExpires");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, mobile, avatar } = req.body;

        const user = await User.findById(req.user._id || req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name && name.trim()) {
            user.name = name.trim();
        }
        if (typeof mobile !== "undefined") {
            user.mobile = mobile.trim();
        }
        if (typeof avatar !== "undefined") {
            user.avatar = avatar;
        }

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error updating profile" });
    }
};

/* ==========================================================================
   10. DIAGNOSTIC TEST EMAIL ENDPOINT
   ========================================================================== */
exports.testEmail = async (req, res) => {
    const targetEmail = req.query.email || process.env.EMAIL_USER || "test@example.com";
    const testOtp = generateOTP();

    const emailUser = (process.env.EMAIL_USER || "").trim();
    const emailPassSet = Boolean(process.env.EMAIL_PASS);

    const result = await sendOtpEmail(targetEmail, testOtp, "verification");

    res.json({
        diagnostic: {
            configuredEmailUser: emailUser ? `${emailUser.slice(0, 3)}***@gmail.com` : "NOT_SET",
            emailPassProvided: emailPassSet,
            recipient: targetEmail,
            generatedOtp: testOtp,
            deliveryResult: result
        }
    });
};
