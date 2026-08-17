import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect, useRef } from "react";
import NotificationCenter from "./NotificationCenter";

/**
 * Header Component
 * Variants:
 *  "public"    -> Home page (About, How it Works, Features, Theme Toggle, Login/Register)
 *  "auth-login" / "auth-register" -> Clean auth navigation
 *  "back"      -> Back to dashboard button (Analytics, Profile)
 *  "dashboard" -> Full dashboard header with Notification Center & profile dropdown
 */
export default function Header({
    variant = "public",
    friends = [],
    onRemind
}) {
    const { logout, user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Dismiss menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className={`app-header ${scrolled ? "scrolled" : ""}`}>
            <div className="header-container">
                {/* Brand Logo */}
                <Link to="/" className="brand-logo">
                    <img src="/assets/images/logo.png" alt="kharchee logo" className="brand-logo-img" />
                    <span className="brand-name">kharchee</span>
                </Link>

                {/* Public Home Navigation Links */}
                {variant === "public" && (
                    <nav className="nav-links desktop-only">
                        <a href="#about" className="nav-link">About</a>
                        <a href="#how-it-works" className="nav-link">How it Works</a>
                        <a href="#features" className="nav-link">Features</a>
                    </nav>
                )}

                {/* Right-Side Actions */}
                <div className="header-actions">
                    {/* Theme Toggle Button */}
                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label="Toggle Theme"
                    >
                        {isDark ? "☀️" : "🌙"}
                    </button>

                    {/* Variant Specific Action Buttons */}
                    {variant === "public" && (
                        <div className="auth-nav-group">
                            <Link to="/login" className="btn-nav-login">
                                Log In
                            </Link>
                            <Link to="/register" className="btn-nav-register">
                                <span className="text-desktop-only">Get Started Free</span>
                                <span className="text-mobile-only">Get Started</span>
                            </Link>
                        </div>
                    )}

                    {variant === "auth-login" && (
                        <div className="auth-nav-group">
                            <Link to="/" className="btn-nav-login">
                                Home
                            </Link>
                            <Link to="/register" className="btn-nav-register">
                                <span className="text-desktop-only">Create Account</span>
                                <span className="text-mobile-only">Sign Up</span>
                            </Link>
                        </div>
                    )}

                    {variant === "auth-register" && (
                        <div className="auth-nav-group">
                            <Link to="/" className="btn-nav-login">
                                Home
                            </Link>
                            <Link to="/login" className="btn-nav-register">
                                Sign In
                            </Link>
                        </div>
                    )}

                    {variant === "back" && (
                        <button onClick={() => navigate("/dashboard")} className="btn-nav-back">
                            Back to Dashboard
                        </button>
                    )}

                    {variant === "dashboard" && (
                        <>
                            {/* Notification Center */}
                            <NotificationCenter
                                friends={friends}
                                onRemind={onRemind}
                            />

                            {/* Profile Dropdown Menu */}
                            <div className="dashboard-user-menu" ref={menuRef}>
                                <button
                                    className="user-avatar-btn"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    aria-label="User menu"
                                >
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="avatar-mini-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                    ) : (
                                        <span className="avatar-initial">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                                        </span>
                                    )}
                                </button>

                                {menuOpen && (
                                    <div className="dropdown-panel">
                                        <div className="dropdown-user-info">
                                            <p className="user-info-name">{user?.name || "User"}</p>
                                            <p className="user-info-email">{user?.email || ""}</p>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/analytics" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                                            📊 Analytics & Insights
                                        </Link>
                                        <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                                            👤 Profile Settings
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                                            🚪 Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
