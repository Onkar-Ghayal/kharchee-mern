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
        <div className="auth-page-wrapper">
            <Header variant="auth-login" />

            <section className="auth-section">
                <div className="auth-ambient-glow"></div>

                <div className="auth-card">
                    <div className="auth-card-header">
                        <Link to="/" className="auth-logo-link" title="Kharchee Home">
                            <img src="/assets/images/logo.png" alt="kharchee logo" className="auth-brand-logo" />
                        </Link>
                        <h2>Welcome back</h2>
                        <p className="sub-text">Sign in to manage your everyday friends & ledgers</p>
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
                        <span>or sign in with email</span>
                    </div>

                    {error && (
                        <div className="auth-error-alert">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="alert-icon-svg">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="login-email">Email Address</label>
                            <div className="input-with-icon">
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="form-label-row">
                                <label htmlFor="login-password">Password</label>
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
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
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
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-submit-auth"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="btn-loading-content">
                                    <span className="btn-spinner"></span> Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className="auth-footer-text">
                            Don't have an account?{" "}
                            <Link to="/register" className="auth-accent-link">
                                Create Free Account
                            </Link>
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
        </div>
    );
}
