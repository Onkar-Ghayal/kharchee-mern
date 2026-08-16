import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Header from "../components/Header";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import OtpModal from "../components/auth/OtpModal";
import "../styles/auth.css";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
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
        if (!p) return { score: 0, text: "", color: "" };

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
        <>
            <Header variant="auth-register" />

            <section className="auth-section">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <Link to="/" className="auth-logo-link">
                            <img src="/assets/images/logo.png" alt="kharchee logo" className="auth-brand-logo" />
                        </Link>
                        <h2>Create Account</h2>
                        <p className="sub-text">Join Kharchee to manage your shared expenses</p>
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
                            width="100%"
                        />
                    </div>

                    <div className="auth-divider">
                        <span>or register with email</span>
                    </div>

                    {error && <div className="auth-error-alert">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
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

                            {/* Password strength indicator */}
                            {form.password && (
                                <div className="strength-meter-container">
                                    <div className="strength-bar-track">
                                        <div
                                            className={`strength-bar-fill strength-${passwordStrength.score}`}
                                            style={{ width: `${(passwordStrength.score / 3) * 100}%`, backgroundColor: passwordStrength.color }}
                                        ></div>
                                    </div>
                                    <span className="strength-text" style={{ color: passwordStrength.color }}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                            style={{ opacity: loading ? 0.75 : 1 }}
                        >
                            {loading ? (
                                <span className="btn-loading-content">
                                    <span className="btn-spinner"></span> Creating Account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </button>

                        <div className="auth-footer-text">
                            Already have an account? <Link to="/login" className="auth-accent-link">Sign In</Link>
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
        </>
    );
}
