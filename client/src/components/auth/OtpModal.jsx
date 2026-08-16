import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

export default function OtpModal({ open, email, onClose, onSuccess, type = "verification" }) {
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);
    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Timer countdown for Resend button
    useEffect(() => {
        if (!open) return;
        setCountdown(60);
        setCanResend(false);
        setError("");
        setOtpDigits(["", "", "", "", "", ""]);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Auto focus first input on open
        setTimeout(() => {
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        }, 100);

        return () => clearInterval(interval);
    }, [open, email]);

    if (!open) return null;

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        setError("");

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split("");
            setOtpDigits(digits);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async (e) => {
        e?.preventDefault();
        const fullOtp = otpDigits.join("");

        if (fullOtp.length !== 6) {
            setError("Please enter all 6 digits");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/verify-otp", {
                email,
                otp: fullOtp
            });

            showToast("Account verified successfully! Welcome to Kharchee.", "success");
            if (res.data.token) {
                login(res.data.token, res.data.user);
            }
            onClose();
            if (onSuccess) {
                onSuccess();
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setLoading(true);
        setError("");
        try {
            await api.post("/auth/resend-otp", { email, type });
            showToast("A new verification code has been sent to your email.", "info");
            setCountdown(60);
            setCanResend(false);
            setOtpDigits(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-card">
                <h3>Verify Email</h3>
                <p className="otp-instructions">
                    Enter the 6-digit code sent to <br />
                    <strong className="otp-email-highlight">{email}</strong>
                </p>

                {error && <div className="otp-error-alert">{error}</div>}

                <form onSubmit={handleVerify}>
                    <div className="otp-inputs-row" onPaste={handlePaste}>
                        {otpDigits.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => (inputRefs.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                className={`otp-input-box ${digit ? "filled" : ""}`}
                                value={digit}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                disabled={loading}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="btn-submit otp-submit-btn"
                        disabled={loading || otpDigits.join("").length !== 6}
                    >
                        {loading ? (
                            <span className="btn-loading-content">
                                <span className="btn-spinner"></span> Verifying...
                            </span>
                        ) : (
                            "Verify & Continue"
                        )}
                    </button>
                </form>

                <div className="otp-resend-row">
                    {canResend ? (
                        <p>
                            Didn't receive the code?{" "}
                            <button className="otp-resend-btn" onClick={handleResend} disabled={loading}>
                                Resend Code
                            </button>
                        </p>
                    ) : (
                        <p className="otp-timer-text">
                            Resend code in <strong>{countdown}s</strong>
                        </p>
                    )}
                </div>

                <button className="otp-cancel-btn" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
