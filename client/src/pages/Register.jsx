import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Header from "../components/Header";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import OtpModal from "../components/auth/OtpModal";
import InstallPwaButton from "../components/InstallPwaButton";
import "../styles/auth.css";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Modal state for OTP verification
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");

    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    // Calculate password strength
    const passwordStrength = useMemo(() => {
        const p = form.password;
        if (!p) return { score: 0, text: "", color: "#94a3b8" };

        let score = 0;
        if (p.length >= 6) score += 1;
        if (p.length >= 10) score += 1;
        if (/[A-Z]/.test(p)) score += 1;
        if (/[0-9]/.test(p)) score += 1;
        if (/[^A-Za-z0-9]/.test(p)) score += 1;

        if (score <= 2) return { score: 1, text: "Weak", color: "#ef4444" };
        if (score <= 4) return { score: 2, text: "Medium", color: "#f59e0b" };
        return { score: 3, text: "Strong", color: "#10b981" };
    }, [form.password]);

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const { name, email, password, confirmPassword } = form;

        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setError("Please fill in all required fields");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/auth/register", {
                name: name.trim(),
                email: email.trim(),
                password,
                confirmPassword
            });

            setRegisteredEmail(email.trim());
            setOtpModalOpen(true);
            showToast("Verification code sent to your email", "info");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle Google Sign-Up Success
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/auth/google", {
                credential: credentialResponse.credential
            });

            login(res.data.token, res.data.user);
            showToast("Signed up with Google successfully!", "success");
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Google registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google registration was unsuccessful. Please try again.");
    };

    return (
        <div className="auth-page-wrapper">
            <Header variant="auth-register" />

            <section className="auth-section">
                <div className="auth-ambient-glow"></div>

                <div className="auth-card">
                    <div className="auth-card-header">
                        <Link to="/" className="auth-logo-link" title="Kharchee Home">
                            <img src="/assets/images/logo.png" alt="kharchee logo" className="auth-brand-logo" />
                        </Link>
                        <h2>Create your account</h2>
                        <p className="sub-text">Start tracking shared expenses with clarity & ease</p>
                    </div>

                    {/* Google OAuth Button */}
                    <div className="google-btn-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_blue"
                            shape="pill"
                            size="large"
                            text="signup_with"
                            width="340"
                        />
                    </div>

                    <div className="auth-divider">
                        <span>or register with email</span>
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
                            <label htmlFor="reg-name">Full Name</label>
                            <input
                                id="reg-name"
                                type="text"
                                name="name"
                                placeholder="Rahul Sharma"
                                value={form.name}
                                onChange={handleChange}
                                required
                                autoComplete="name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-email">Email Address</label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                placeholder="name@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-password">Password</label>
                            <div className="password-input-wrap">
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="At least 6 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
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

                            {/* Password strength indicator */}
                            {form.password && (
                                <div className="strength-meter-container">
                                    <div className="strength-bar-track">
                                        <div
                                            className="strength-bar-fill"
                                            style={{
                                                width: `${(passwordStrength.score / 3) * 100}%`,
                                                backgroundColor: passwordStrength.color
                                            }}
                                        ></div>
                                    </div>
                                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-confirm-password">Confirm Password</label>
                            <div className="password-input-wrap">
                                <input
                                    id="reg-confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Re-enter password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    title={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
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
                                    <span className="btn-spinner"></span> Creating Account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </button>

                        {/* Install App Button Below Sign Up Button */}
                        <InstallPwaButton className="btn-auth-install-pwa" label="Install App" />

                        <div className="auth-footer-text">
                            Already have an account?{" "}
                            <Link to="/login" className="auth-accent-link">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </section>

            {/* OTP Verification Modal */}
            <OtpModal
                open={otpModalOpen}
                email={registeredEmail}
                onClose={() => setOtpModalOpen(false)}
                onSuccess={() => navigate("/dashboard")}
            />
        </div>
    );
}
