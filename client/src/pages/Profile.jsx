import { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import "../styles/profile.css";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ totalFriends: 0, totalTx: 0, netBalance: 0 });
    const [loading, setLoading] = useState(true);

    // Form edit states
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const fileInputRef = useRef(null);

    const { setUser: setAuthUser, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { showToast } = useToast();

    // Fetch user profile and stats
    const loadProfileData = async () => {
        setLoading(true);
        try {
            const [profileRes, friendsRes] = await Promise.all([
                api.get("/auth/profile"),
                api.get("/friends")
            ]);

            setUser(profileRes.data);
            setName(profileRes.data.name || "");

            // Compute user summary stats
            const friends = friendsRes.data || [];
            let txCount = 0;
            let net = 0;

            friends.forEach((f) => {
                net += f.currentAmount || 0;
                txCount += (f.history || []).length;
            });

            setStats({
                totalFriends: friends.length,
                totalTx: txCount,
                netBalance: net
            });
        } catch {
            showToast("Failed to load profile", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfileData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save profile text details (Name)
    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            showToast("Name cannot be empty", "error");
            return;
        }

        setSaving(true);
        try {
            const res = await api.put("/auth/profile", {
                name: name.trim()
            });

            setUser(res.data.user);
            setAuthUser(res.data.user);
            setIsEditing(false);
            showToast("Profile updated successfully", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    // Handle Photo File Selection & Resize
    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("Please select a valid image file", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Image size must be less than 5MB", "error");
            return;
        }

        setUploadingPhoto(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

                try {
                    const res = await api.put("/auth/profile", {
                        avatar: resizedDataUrl
                    });

                    setUser(res.data.user);
                    setAuthUser(res.data.user);
                    showToast("Profile photo updated successfully", "success");
                } catch (err) {
                    showToast(err.response?.data?.message || "Failed to upload photo", "error");
                } finally {
                    setUploadingPhoto(false);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Remove Profile Photo
    const handleRemovePhoto = async () => {
        setUploadingPhoto(true);
        try {
            const res = await api.put("/auth/profile", {
                avatar: ""
            });

            setUser(res.data.user);
            setAuthUser(res.data.user);
            showToast("Profile photo removed", "info");
        } catch {
            showToast("Failed to remove photo", "error");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric"
          })
        : "Recently";

    return (
        <div className="profile-page-wrapper">
            <Header variant="back" />

            <main className="profile-container">
                {/* 1. Hero Executive Profile Banner Card */}
                <div className="profile-hero-card">
                    <div className="profile-hero-ambient-bg"></div>

                    <div className="profile-hero-content">
                        {/* Avatar with Camera Badge */}
                        <div className="profile-avatar-wrapper">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-initials">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                            )}

                            <button
                                type="button"
                                className="avatar-upload-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload Photo"
                                aria-label="Upload Photo"
                                disabled={uploadingPhoto}
                            >
                                {uploadingPhoto ? "⏳" : "📷"}
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                                accept="image/*"
                                style={{ display: "none" }}
                            />
                        </div>

                        {/* Title & Identification */}
                        <div className="profile-hero-info">
                            <div className="profile-title-row">
                                <h1 className="profile-user-name">{user?.name || "Kharchee User"}</h1>
                                <span className="profile-badge-verified">
                                    <span className="badge-dot"></span>
                                    {user?.isVerified ? "Verified Account" : "Active Member"}
                                </span>
                            </div>

                            <p className="profile-user-email">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                </svg>
                                {user?.email}
                            </p>

                            <div className="profile-hero-actions">
                                <button
                                    type="button"
                                    className="btn-profile-hero-action primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingPhoto}
                                >
                                    📸 {uploadingPhoto ? "Uploading..." : "Change Photo"}
                                </button>
                                {user?.avatar && (
                                    <button
                                        type="button"
                                        className="btn-profile-hero-action danger"
                                        onClick={handleRemovePhoto}
                                        disabled={uploadingPhoto}
                                    >
                                        ✕ Remove
                                    </button>
                                )}
                                {!isEditing && (
                                    <button
                                        type="button"
                                        className="btn-profile-hero-action outline"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        ✏️ Edit Profile
                                    </button>
                                )}
                                <span className="profile-member-since">Joined {memberSince}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Key Metrics Bar */}
                    <div className="profile-stats-bar">
                        <div className="profile-stat-item">
                            <div className="stat-icon-wrap">👥</div>
                            <div className="stat-data">
                                <span className="stat-value">{stats.totalFriends}</span>
                                <span className="stat-label">Friends Connected</span>
                            </div>
                        </div>

                        <div className="profile-stat-item">
                            <div className="stat-icon-wrap">⚡</div>
                            <div className="stat-data">
                                <span className="stat-value">{stats.totalTx}</span>
                                <span className="stat-label">Total Transactions</span>
                            </div>
                        </div>

                        <div className="profile-stat-item">
                            <div className="stat-icon-wrap">💰</div>
                            <div className="stat-data">
                                <span
                                    className={`stat-value ${
                                        stats.netBalance > 0
                                            ? "text-success"
                                            : stats.netBalance < 0
                                            ? "text-danger"
                                            : ""
                                    }`}
                                >
                                    {stats.netBalance >= 0 ? "+" : "-"}₹ {Math.abs(stats.netBalance).toLocaleString("en-IN")}
                                </span>
                                <span className="stat-label">
                                    {stats.netBalance > 0
                                        ? "You Will Get"
                                        : stats.netBalance < 0
                                        ? "You Owe"
                                        : "Net Settled"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Settings Cards Grid */}
                <div className="profile-settings-grid">
                    {/* Card 1: Personal Details */}
                    <div className="settings-panel">
                        <div className="panel-header-row">
                            <div className="panel-header-left">
                                <div className="panel-header-icon">👤</div>
                                <div>
                                    <h3>Personal Details</h3>
                                    <p className="panel-subtext">Manage your personal information and contact details</p>
                                </div>
                            </div>
                            {!isEditing && (
                                <button className="btn-panel-action" onClick={() => setIsEditing(true)}>
                                    Edit
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSave} className="profile-edit-form">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={name}
                                        placeholder="Your full name"
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="edit-btn-group">
                                    <button type="submit" className="btn-save-profile" disabled={saving}>
                                        {saving ? "Saving Changes..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-cancel-profile"
                                        onClick={() => {
                                            setName(user?.name || "");
                                            setIsEditing(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="details-list">
                                <div className="detail-item-box">
                                    <div className="detail-item-icon">🔤</div>
                                    <div className="detail-item-content">
                                        <span className="detail-label">Full Name</span>
                                        <span className="detail-val">{user?.name || "—"}</span>
                                    </div>
                                </div>

                                <div className="detail-item-box">
                                    <div className="detail-item-icon">✉️</div>
                                    <div className="detail-item-content">
                                        <span className="detail-label">Email Address</span>
                                        <div className="detail-val-row">
                                            <span className="detail-val">{user?.email}</span>
                                            <span className="verified-chip">✓ Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: App Preferences & Appearance */}
                    <div className="settings-panel">
                        <div className="panel-header-row">
                            <div className="panel-header-left">
                                <div className="panel-header-icon">⚙️</div>
                                <div>
                                    <h3>App Preferences</h3>
                                    <p className="panel-subtext">Customize theme and workspace display</p>
                                </div>
                            </div>
                        </div>

                        <div className="preferences-list">
                            {/* Theme Choice */}
                            <div className="preference-card-box">
                                <div className="pref-meta">
                                    <span className="pref-title">Appearance Mode</span>
                                    <span className="pref-subtitle">Toggle light or dark color scheme</span>
                                </div>
                                <div className="theme-toggle-chips">
                                    <button
                                        type="button"
                                        className={`theme-chip-btn ${!isDark ? "active" : ""}`}
                                        onClick={() => isDark && toggleTheme()}
                                    >
                                        ☀️ Light
                                    </button>
                                    <button
                                        type="button"
                                        className={`theme-chip-btn ${isDark ? "active" : ""}`}
                                        onClick={() => !isDark && toggleTheme()}
                                    >
                                        🌙 Dark
                                    </button>
                                </div>
                            </div>

                            {/* Currency */}
                            <div className="preference-card-box">
                                <div className="pref-meta">
                                    <span className="pref-title">Default Currency</span>
                                    <span className="pref-subtitle">All transactions calculated in Indian Rupee</span>
                                </div>
                                <span className="pref-static-badge">₹ INR</span>
                            </div>

                            {/* Security State */}
                            <div className="preference-card-box">
                                <div className="pref-meta">
                                    <span className="pref-title">Account Security</span>
                                    <span className="pref-subtitle">Protected via secure JWT tokens & bcrypt hash</span>
                                </div>
                                <span className="secure-badge">🛡️ Protected</span>
                            </div>
                        </div>

                        {/* Danger Zone / Logout */}
                        <div className="profile-danger-zone">
                            <div className="danger-zone-header">
                                <span className="danger-title">Session Management</span>
                                <span className="danger-desc">Log out of your current device session</span>
                            </div>
                            <button className="btn-logout-danger" onClick={logout}>
                                🚪 Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
