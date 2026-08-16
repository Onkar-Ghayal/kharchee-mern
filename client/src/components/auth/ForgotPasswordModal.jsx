import { useState, useRef } from "react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function ForgotPasswordModal({ open, onClose }) {
    const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
    const [email, setEmail] = useState("");
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRefs = useRef([]);
    const { showToast } = useToast();

    if (!open) return null;

    const handleClose = () => {
        setStep(1);
        setEmail("");
        setOtpDigits(["", "", "", "", "", ""]);
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        onClose();
    };

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError("Please enter your registered email address");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await api.post("/auth/forgot-password", { email: email.trim() });
            showToast("Password reset code sent to your email", "info");
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send reset code");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle OTP input
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        setError("");

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Step 2: Submit Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const fullOtp = otpDigits.join("");

        if (fullOtp.length !== 6) {
            setError("Please enter the 6-digit code");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await api.post("/auth/reset-password", {
                email: email.trim(),
                otp: fullOtp,
                newPassword,
                confirmPassword
            });

            showToast("Password reset successfully! You can now log in.", "success");
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-card">
                <h3>{step === 1 ? "Reset Password" : "Create New Password"}</h3>
                <p className="otp-instructions">
                    {step === 1
                        ? "Enter your registered email address and we'll send you a 6-digit recovery code."
                        : `Enter the 6-digit code sent to ${email} and choose a new password.`}
                </p>

                {error && <div className="otp-error-alert">{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp}>
                        <div className="form-group" style={{ textAlign: "left" }}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                required
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? "Sending Code..." : "Send Verification Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <label style={{ display: "block", textAlign: "left", fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
                            6-Digit Reset Code
                        </label>
                        <div className="otp-inputs-row">
                            {otpDigits.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={(el) => (inputRefs.current[idx] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    className={`otp-input-box ${digit ? "filled" : ""}`}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                    disabled={loading}
                                />
                            ))}
                        </div>

                        <div className="form-group" style={{ textAlign: "left", marginTop: "16px" }}>
                            <label>New Password</label>
                            <div className="password-input-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ textAlign: "left" }}>
                            <label>Confirm New Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? "Updating Password..." : "Reset Password & Login"}
                        </button>
                    </form>
                )}

                <button className="otp-cancel-btn" onClick={handleClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
