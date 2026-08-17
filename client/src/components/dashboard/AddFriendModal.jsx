import { useEffect, useState } from "react";

const UPI_APPS = [
    { id: "Google Pay", label: "Google Pay" },
    { id: "PhonePe", label: "PhonePe" },
    { id: "Paytm", label: "Paytm" },
    { id: "BHIM / Other", label: "BHIM / Other" }
];

export default function AddFriendModal({ open, editingFriend, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [upiId, setUpiId] = useState("");
    const [upiApp, setUpiApp] = useState("Google Pay");
    const [qrCode, setQrCode] = useState("");
    const [sendWhatsAppRequest, setSendWhatsAppRequest] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        if (editingFriend) {
            setName(editingFriend.name || "");
            setMobile(editingFriend.mobile || "");
            setUpiId(editingFriend.upiId || "");
            setUpiApp(editingFriend.upiApp || "Google Pay");
            setQrCode(editingFriend.qrCode || "");
            setSendWhatsAppRequest(false);
        } else {
            setName("");
            setMobile("");
            setUpiId("");
            setUpiApp("Google Pay");
            setQrCode("");
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
            setError("Please upload an image file (PNG, JPG, WEBP)");
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
        const trimmedUpi = upiId.trim();

        if (!trimmedName) {
            setError("Please enter your friend's name");
            return;
        }

        if (!trimmedMobile) {
            setError("WhatsApp / Mobile number is compulsory");
            return;
        }

        if (!/^[0-9]{10}$/.test(trimmedMobile)) {
            setError("Please enter a valid 10-digit mobile number (e.g. 9876543210)");
            return;
        }

        if (trimmedUpi && !trimmedUpi.includes("@")) {
            setError("Please enter a valid UPI ID (e.g. rahul@okhdfcbank or 9876543210@ybl)");
            return;
        }

        onSubmit({
            name: trimmedName,
            mobile: trimmedMobile,
            upiId: trimmedUpi,
            upiApp,
            qrCode,
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

                    {/* 2. WhatsApp / Mobile Number (Compulsory) */}
                    <div className="form-group">
                        <label>WhatsApp / Mobile Number <span className="required-star">*</span></label>
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

                    {/* 3. QR Code Upload or WhatsApp Request (Optional) */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label>Payment QR Code <span className="optional-tag">(Optional)</span></label>
                        </div>

                        {qrCode ? (
                            <div className="modal-qr-preview-box">
                                <img src={qrCode} alt="Friend QR" className="modal-qr-thumb" />
                                <div className="modal-qr-meta">
                                    <span className="qr-attached-label">✓ QR Code Attached</span>
                                    <button
                                        type="button"
                                        className="btn-remove-qr-thumb"
                                        onClick={() => setQrCode("")}
                                    >
                                        Remove QR
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="qr-choice-options-wrapper">
                                <label className="btn-upload-qr-file" htmlFor="friend-qr-file">
                                    <span>📸 Upload QR Screenshot</span>
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
                                        <span>📲 Send QR Code Request via WhatsApp after saving</span>
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. UPI ID (Optional fallback) */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label>UPI ID <span className="optional-tag">(Optional)</span></label>
                        </div>
                        <input
                            type="text"
                            placeholder="e.g. rahul@okhdfcbank or 9876543210@ybl"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                        />
                    </div>

                    {/* 5. Select App Platform */}
                    <div className="form-group">
                        <label>UPI Platform / App <span className="optional-tag">(Optional)</span></label>
                        <div className="upi-app-selector-grid">
                            {UPI_APPS.map((app) => (
                                <button
                                    key={app.id}
                                    type="button"
                                    className={`upi-app-choice-btn ${upiApp === app.id ? "active" : ""}`}
                                    onClick={() => setUpiApp(app.id)}
                                >
                                    <span>{app.label}</span>
                                </button>
                            ))}
                        </div>
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
