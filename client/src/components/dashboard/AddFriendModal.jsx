import { useEffect, useState } from "react";

const QR_PLATFORMS = [
    { id: "PhonePe", label: "PhonePe", icon: "🟣" },
    { id: "Google Pay", label: "Google Pay", icon: "🔵" },
    { id: "Paytm", label: "Paytm", icon: "🔷" },
    { id: "BHIM / Other", label: "BHIM / Other", icon: "🇮🇳" }
];

export default function AddFriendModal({ open, editingFriend, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [qrPlatform, setQrPlatform] = useState("PhonePe");
    const [sendWhatsAppRequest, setSendWhatsAppRequest] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        if (editingFriend) {
            setName(editingFriend.name || "");
            setMobile(editingFriend.mobile || "");
            setQrCode(editingFriend.qrCode || "");
            setQrPlatform(editingFriend.qrPlatform || "PhonePe");
            setSendWhatsAppRequest(false);
        } else {
            setName("");
            setMobile("");
            setQrCode("");
            setQrPlatform("PhonePe");
            setSendWhatsAppRequest(false);
        }
        setError("");
    }, [open, editingFriend]);

    if (!open) return null;

    // Handle QR code file selection & compression
    const handleQrUpload = (e) => {
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
                const maxDim = 800;

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
                setQrCode(compressedBase64);
                setSendWhatsAppRequest(false);
                setError("");
            };
            img.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setError("");

        const trimmedName = name.trim();
        const trimmedMobile = mobile.trim();

        if (!trimmedName) {
            setError("Please enter your friend's name");
            return;
        }

        if (!trimmedMobile) {
            setError("WhatsApp Mobile Number is compulsory");
            return;
        }

        if (!/^[0-9]{10}$/.test(trimmedMobile)) {
            setError("Please enter a valid 10-digit mobile number (e.g. 9876543210)");
            return;
        }

        onSubmit({
            name: trimmedName,
            mobile: trimmedMobile,
            qrCode,
            qrPlatform: qrCode ? qrPlatform : "",
            qrRequestStatus: qrCode ? "uploaded" : sendWhatsAppRequest ? "pending" : (editingFriend?.qrRequestStatus || "not_requested"),
            sendWhatsAppRequest
        });
    };

    return (
        <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content add-friend-modal-content">
                <div className="modal-header-row">
                    <h3>{editingFriend ? "Edit Friend Details" : "Add New Friend"}</h3>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    {/* 1. Friend Name (Compulsory) */}
                    <div className="form-group">
                        <label>Friend Name <span className="required-star">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter friend name (e.g. Rahul Sharma)"
                            value={name}
                            required
                            autoFocus
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* 2. WhatsApp Mobile Number (Compulsory - No slash) */}
                    <div className="form-group">
                        <label>WhatsApp Mobile Number <span className="required-star">*</span></label>
                        <div className="phone-input-wrap">
                            <span className="country-code-prefix">+91</span>
                            <input
                                type="tel"
                                placeholder="10-digit mobile number (e.g. 9876543210)"
                                value={mobile}
                                maxLength={10}
                                required
                                onChange={(e) => setMobile(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 3. Payment QR Code (Optional) */}
                    <div className="form-group qr-upload-section-group">
                        <div className="form-label-row">
                            <label>Payment QR Code <span className="optional-tag">(Optional)</span></label>
                        </div>

                        {qrCode ? (
                            /* When QR Code IS Uploaded: Show Image Preview + Platform Selector */
                            <div className="modal-qr-uploaded-card">
                                <div className="modal-qr-preview-row">
                                    <img src={qrCode} alt="Friend QR" className="modal-qr-thumb" />
                                    <div className="modal-qr-meta">
                                        <span className="qr-attached-label">✓ QR Code Uploaded</span>
                                        <button
                                            type="button"
                                            className="btn-remove-qr-thumb"
                                            onClick={() => setQrCode("")}
                                        >
                                            ✕ Remove QR
                                        </button>
                                    </div>
                                </div>

                                {/* Platform of QR Code (Google Pay, PhonePe, Paytm) */}
                                <div className="qr-platform-select-box">
                                    <label className="qr-platform-label">Select Platform of this QR Code:</label>
                                    <div className="qr-platform-chips-grid">
                                        {QR_PLATFORMS.map((platform) => (
                                            <button
                                                key={platform.id}
                                                type="button"
                                                className={`qr-platform-chip-btn ${qrPlatform === platform.id ? "active" : ""}`}
                                                onClick={() => setQrPlatform(platform.id)}
                                            >
                                                <span className="platform-icon">{platform.icon}</span>
                                                <span className="platform-name">{platform.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* When NO QR Uploaded: Upload / Screenshot Button + Send Request Checkbox below */
                            <div className="qr-choice-options-wrapper">
                                <label className="btn-upload-qr-file" htmlFor="friend-qr-file">
                                    <span className="upload-icon">📸</span>
                                    <span>Upload / Screenshot of Friend's QR Code</span>
                                    <input
                                        id="friend-qr-file"
                                        type="file"
                                        accept="image/*"
                                        className="file-hidden-input"
                                        onChange={handleQrUpload}
                                    />
                                </label>

                                {!editingFriend && (
                                    <label className="checkbox-qr-request-row">
                                        <input
                                            type="checkbox"
                                            checked={sendWhatsAppRequest}
                                            onChange={(e) => setSendWhatsAppRequest(e.target.checked)}
                                        />
                                        <span>📲 Send request to friend for QR Code via WhatsApp</span>
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="modal-info-note">
                        Starting balance will automatically be set to <strong>₹0</strong>.
                    </p>

                    {error && <p className="form-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="submit" className="btn-submit">
                            {editingFriend ? "Save Changes" : "+ Add Friend"}
                        </button>
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
