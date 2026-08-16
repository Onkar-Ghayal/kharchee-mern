import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Header from "../components/Header";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import OtpModal from "../components/auth/OtpModal";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal";
import "../styles/auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Modal states
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");
    const [forgotModalOpen, setForgotModalOpen] = useState(false);

    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Regular Email/Password Login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/auth/login", {
                email: email.trim(),
                password
            });

            login(res.data.token, res.data.user);
            showToast("Welcome back!", "success");
            navigate("/dashboard");
        } catch (err) {
            const data = err.response?.data;
            if (data?.requiresVerification) {
                setPendingEmail(data.email || email.trim());
                setOtpModalOpen(true);
            } else {
                setError(data?.message || "Login failed. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Google Sign-In Handler
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/auth/google", {
                credential: credentialResponse.credential
            });

            login(res.data.token, res.data.user);
            showToast("Signed in with Google successfully!", "success");
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Google authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google sign-in was unsuccessful. Please try again.");
    };

    return (
        <>
            <Header variant="auth-login" />

            <section className="auth-section">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <Link to="/" className="auth-logo-link">
                            <img src="/assets/images/logo.png" alt="kharchee logo" className="auth-brand-logo" />
                        </Link>
                        <h2>Log in</h2>
                        <p className="sub-text">Access your Kharchee account</p>
                    </div>

                    {/* Google OAuth Button */}
                    <div className="google-btn-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_blue"
                            shape="pill"
                            size="large"
                            text="signin_with"
                            width="100%"
                        />
                    </div>

                    <div className="auth-divider">
                        <span>or continue with email</span>
                    </div>

                    {error && <div className="auth-error-alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <div className="form-label-row">
                                <label>Password</label>
                                <button
                                    type="button"
                                    className="forgot-pw-link"
                                    onClick={() => setForgotModalOpen(true)}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="password-input-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    required
                                    autoComplete="current-password"
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

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                            style={{ opacity: loading ? 0.75 : 1 }}
                        >
                            {loading ? (
                                <span className="btn-loading-content">
                                    <span className="btn-spinner"></span> Logging in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className="auth-footer-text">
                            Don't have an account? <Link to="/register" className="auth-accent-link">Create Account</Link>
                        </div>
                    </form>
                </div>
            </section>

            {/* OTP Verification Modal */}
            <OtpModal
                open={otpModalOpen}
                email={pendingEmail}
                onClose={() => setOtpModalOpen(false)}
                onSuccess={() => navigate("/dashboard")}
            />

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                open={forgotModalOpen}
                onClose={() => setForgotModalOpen(false)}
            />
        </>
    );
}
