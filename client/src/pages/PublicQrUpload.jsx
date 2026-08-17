import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/public-qr.css";

export default function PublicQrUpload() {
    const { friendId } = useParams();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [info, setInfo] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form inputs
    const [qrImage, setQrImage] = useState("");
    const [upiId, setUpiId] = useState("");
    const [upiApp, setUpiApp] = useState("Google Pay");

    useEffect(() => {
        const fetchFriendInfo = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await api.get(`/friends/public-qr/${friendId}`);
                setInfo(res.data);
                if (res.data.qrCode) setQrImage(res.data.qrCode);
                if (res.data.upiId) setUpiId(res.data.upiId);
                if (res.data.upiApp) setUpiApp(res.data.upiApp);
            } catch (err) {
                console.error("Fetch friend QR error:", err);
                setError(err.response?.data?.message || "Invalid or expired link");
            } finally {
                setLoading(false);
            }
        };

        if (friendId) {
            fetchFriendInfo();
        }
    }, [friendId]);

    // Handle Image file selection & compression
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (PNG, JPG, JPEG, WEBP)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const maxDim = 800; // Optimal size for high QR readability & fast upload

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
                setQrImage(compressedBase64);
                setError("");
            };
            img.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!qrImage && !upiId.trim()) {
            setError("Please upload a QR code screenshot or enter your UPI ID");
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/friends/public-qr/${friendId}`, {
                qrCode: qrImage,
                upiId: upiId.trim(),
                upiApp
            });
            setSuccess(true);
        } catch (err) {
            console.error("Submit QR error:", err);
            setError(err.response?.data?.message || "Failed to upload QR code. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="public-qr-page-container">
            {/* Header Brand */}
            <header className="public-qr-header">
                <div className="public-brand-badge">
                    <span className="brand-logo-icon">💸</span>
                    <span className="brand-title">Kharchee</span>
                </div>
            </header>

            <main className="public-qr-main-card">
                {loading ? (
                    <div className="public-loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading payment request details...</p>
                    </div>
                ) : error && !info ? (
                    <div className="public-error-state">
                        <div className="error-icon-bubble">⚠️</div>
                        <h2>Invalid Link</h2>
                        <p>{error}</p>
                        <Link to="/" className="btn-return-home">Back to Homepage</Link>
                    </div>
                ) : success ? (
                    <div className="public-success-state">
                        <div className="success-icon-bubble">🎉</div>
                        <h2>QR Code Saved!</h2>
                        <p className="success-subtext">
                            <strong>{info?.requestedBy || "Your Friend"}</strong> can now scan your QR code or send money directly to you without errors!
                        </p>

                        {qrImage && (
                            <div className="uploaded-qr-preview-box">
                                <img src={qrImage} alt="Uploaded QR Code" className="preview-qr-img" />
                            </div>
                        )}

                        <div className="success-footer-note">
                            <p>You can close this tab now.</p>
                            <Link to="/register" className="btn-try-kharchee">
                                Track your own shared expenses on Kharchee ↗
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="public-form-wrapper">
                        <div className="public-hero-badge">
                            <span className="badge-tag">Payment Setup</span>
                            <h2>Upload Your Payment QR</h2>
                            <p className="public-hero-desc">
                                <strong>{info?.requestedBy || "A friend"}</strong> wants to send you money and requested your PhonePe / Google Pay / Paytm QR code.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="public-qr-form">
                            {/* QR Code Upload Drop Area */}
                            <div className="form-group">
                                <label className="form-label">
                                    Upload QR Code Screenshot <span className="req-star">*</span>
                                </label>

                                <div className="qr-dropzone">
                                    {qrImage ? (
                                        <div className="qr-image-preview-wrapper">
                                            <img src={qrImage} alt="QR Code Preview" className="uploaded-qr-preview" />
                                            <button
                                                type="button"
                                                className="btn-remove-qr"
                                                onClick={() => setQrImage("")}
                                            >
                                                ✕ Change Image
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="qr-upload-label" htmlFor="qr-file-input">
                                            <div className="upload-camera-icon">📸</div>
                                            <span className="upload-cta-title">Tap here to select QR Screenshot</span>
                                            <span className="upload-cta-sub">From PhonePe, Google Pay, or Paytm</span>
                                            <input
                                                id="qr-file-input"
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="file-hidden-input"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Optional: UPI ID & App Selector */}
                            <div className="form-group">
                                <label className="form-label">UPI ID (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. mobileNumber@ybl, yourname@oksbi"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Primary UPI App</label>
                                <select
                                    className="form-select"
                                    value={upiApp}
                                    onChange={(e) => setUpiApp(e.target.value)}
                                >
                                    <option value="Google Pay">Google Pay</option>
                                    <option value="PhonePe">PhonePe</option>
                                    <option value="Paytm">Paytm</option>
                                    <option value="BHIM UPI">BHIM UPI</option>
                                </select>
                            </div>

                            {error && <div className="public-error-banner">{error}</div>}

                            <button
                                type="submit"
                                className="btn-submit-public-qr"
                                disabled={submitting || (!qrImage && !upiId.trim())}
                            >
                                {submitting ? "Uploading..." : "✓ Submit Payment QR"}
                            </button>

                            <p className="public-privacy-note">
                                🔒 Your QR code is stored securely and only shared with <strong>{info?.requestedBy || "your friend"}</strong> for direct settlements.
                            </p>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
