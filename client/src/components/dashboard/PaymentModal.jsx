import { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";

const QR_PLATFORMS = [
    { id: "PhonePe", label: "PhonePe", icon: "🟣" },
    { id: "Google Pay", label: "Google Pay", icon: "🔵" },
    { id: "Paytm", label: "Paytm", icon: "🔷" },
    { id: "BHIM / Other", label: "BHIM / Other", icon: "🇮🇳" }
];

export default function PaymentModal({
    open,
    friends = [],
    preselectedFriend,
    onClose,
    onPaymentSuccess,
    onFriendUpdated
}) {
    const [selectedFriendId, setSelectedFriendId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [recording, setRecording] = useState(false);
    const [copied, setCopied] = useState("");
    const [error, setError] = useState("");

    // QR Upload modal inside payment modal
    const [uploadingQr, setUploadingQr] = useState(false);
    const [showUploadPicker, setShowUploadPicker] = useState(false);
    const [pickerImage, setPickerImage] = useState("");
    const [pickerPlatform, setPickerPlatform] = useState("PhonePe");

    // Initialize state when modal opens
    useEffect(() => {
        if (!open) {
            setShowUploadPicker(false);
            setPickerImage("");
            return;
        }

        if (preselectedFriend) {
            setSelectedFriendId(preselectedFriend._id);
            if (preselectedFriend.currentAmount < 0) {
                setAmount(String(Math.abs(preselectedFriend.currentAmount)));
            } else {
                setAmount("");
            }
        } else if (friends.length > 0) {
            setSelectedFriendId(friends[0]._id);
            setAmount("");
        }

        setDescription("");
        setError("");
        setCopied("");
        setShowUploadPicker(false);
        setPickerImage("");
    }, [open, preselectedFriend, friends]);

    const activeFriend = useMemo(() => {
        return friends.find((f) => f._id === selectedFriendId) || preselectedFriend || null;
    }, [friends, selectedFriendId, preselectedFriend]);

    const isOwed = activeFriend && activeFriend.currentAmount < 0;
    const isDue = activeFriend && activeFriend.currentAmount > 0;

    if (!open) return null;

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(""), 2500);
    };

    // Send / Re-send QR Code Request to Friend via WhatsApp
    const handleSendWhatsAppQrRequest = async () => {
        if (!activeFriend) return;
        try {
            const baseUrl = window.location.origin;
            const uploadUrl = `${baseUrl}/upload-qr/${activeFriend._id}`;
            const message = `Hey ${activeFriend.name}! Please upload a screenshot of your PhonePe / Google Pay / Paytm QR code so I can pay you directly on Kharchee: ${uploadUrl}`;
            const waUrl = `https://wa.me/91${activeFriend.mobile}?text=${encodeURIComponent(message)}`;

            // Mark status as pending
            await api.put(`/friends/${activeFriend._id}/qr-status`, { status: "pending" });
            if (onFriendUpdated) onFriendUpdated();

            window.open(waUrl, "_blank");
        } catch (err) {
            console.error("QR status update error:", err);
        }
    };

    // Handle Direct QR Upload from modal
    const handleFileSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file (PNG, JPG, JPEG, WEBP)");
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
                setPickerImage(compressedBase64);
                setShowUploadPicker(true);
                setError("");
            };
            img.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Save picked QR + Platform to friend
    const handleSavePickedQr = async () => {
        if (!pickerImage || !activeFriend) return;
        setUploadingQr(true);
        try {
            await api.put(`/friends/${activeFriend._id}`, {
                qrCode: pickerImage,
                qrPlatform: pickerPlatform,
                qrRequestStatus: "uploaded"
            });
            setShowUploadPicker(false);
            setPickerImage("");
            if (onFriendUpdated) onFriendUpdated();
        } catch (err) {
            setError("Failed to save QR code");
        } finally {
            setUploadingQr(false);
        }
    };

    // Manual Instant Mark as Paid
    const handleManualMarkPaid = async () => {
        const num = Number(amount);
        if (!num || isNaN(num) || num <= 0) {
            setError("Please enter a valid payment amount first");
            return;
        }
        if (!activeFriend) return;

        setRecording(true);
        try {
            await onPaymentSuccess(activeFriend._id, {
                amount: num,
                description: description.trim(),
                upiApp: activeFriend.qrPlatform || "QR Code"
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to record payment in ledger");
        } finally {
            setRecording(false);
        }
    };

    return (
        <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content professional-pay-card">
                {/* Modal Header */}
                <div className="pay-modal-header">
                    <div className="pay-header-left">
                        <div className="pay-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                        </div>
                        <div>
                            <h3>Pay Friend</h3>
                            <p className="pay-header-sub">Scan Payment QR & Clear Balance</p>
                        </div>
                    </div>
                    <button type="button" className="btn-close-pay-modal" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Recipient Context Card */}
                {activeFriend && (
                    <div className={`recipient-summary-box ${isOwed ? "status-owed" : isDue ? "status-due" : "status-settled"}`}>
                        <div className="recipient-avatar">
                            {activeFriend.name ? activeFriend.name.charAt(0).toUpperCase() : "F"}
                        </div>
                        <div className="recipient-meta">
                            <h4 className="recipient-name">{activeFriend.name}</h4>
                            <div className="recipient-phone-row">
                                <span>📱 +91 {activeFriend.mobile}</span>
                                <button
                                    type="button"
                                    className="btn-copy-tag"
                                    onClick={() => copyToClipboard(activeFriend.mobile, "Number")}
                                >
                                    {copied === "Number" ? "✓ Copied" : "Copy"}
                                </button>
                            </div>
                        </div>
                        <div className="recipient-balance-status">
                            <span className="status-caption">
                                {isOwed ? "You Owe" : isDue ? "Owes You" : "Balance"}
                            </span>
                            <span className="status-val">
                                ₹{Math.abs(activeFriend.currentAmount).toLocaleString("en-IN")}
                            </span>
                        </div>
                    </div>
                )}

                {/* Amount & Presets */}
                <div className="pay-form-section">
                    <label className="pay-form-label">Amount (₹) *</label>
                    <div className="pay-amount-input-box">
                        <span className="pay-currency-symbol">₹</span>
                        <input
                            type="number"
                            className="pay-amount-input"
                            placeholder="0"
                            value={amount}
                            min="1"
                            required
                            autoFocus
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="pay-quick-presets">
                        <button type="button" onClick={() => setAmount("50")}>+₹50</button>
                        <button type="button" onClick={() => setAmount("100")}>+₹100</button>
                        <button type="button" onClick={() => setAmount("200")}>+₹200</button>
                        <button type="button" onClick={() => setAmount("500")}>+₹500</button>
                        {isOwed && (
                            <button
                                type="button"
                                className="btn-preset-full-due"
                                onClick={() => setAmount(String(Math.abs(activeFriend.currentAmount)))}
                            >
                                Clear Due (₹{Math.abs(activeFriend.currentAmount)})
                            </button>
                        )}
                    </div>
                </div>

                {/* Note / Reason */}
                <div className="pay-form-section">
                    <label className="pay-form-label">Note / Reason (Optional)</label>
                    <input
                        type="text"
                        className="pay-description-input"
                        placeholder="e.g. Dinner share, Chai, Movie, Flat rent"
                        value={description}
                        maxLength={100}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {/* QR Upload Modal Sub-flow inside Pay Card */}
                {showUploadPicker ? (
                    <div className="pay-qr-picker-subcard">
                        <h4>Select Platform for Uploaded QR:</h4>
                        <div className="picker-image-thumb-wrap">
                            <img src={pickerImage} alt="Preview" className="picker-thumb-img" />
                        </div>

                        <div className="qr-platform-chips-grid">
                            {QR_PLATFORMS.map((platform) => (
                                <button
                                    key={platform.id}
                                    type="button"
                                    className={`qr-platform-chip-btn ${pickerPlatform === platform.id ? "active" : ""}`}
                                    onClick={() => setPickerPlatform(platform.id)}
                                >
                                    <span className="platform-icon">{platform.icon}</span>
                                    <span className="platform-name">{platform.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="picker-actions-row">
                            <button
                                type="button"
                                className="btn-save-picker-qr"
                                disabled={uploadingQr}
                                onClick={handleSavePickedQr}
                            >
                                {uploadingQr ? "Saving..." : "✓ Save QR Code"}
                            </button>
                            <button
                                type="button"
                                className="btn-cancel-picker-qr"
                                onClick={() => {
                                    setShowUploadPicker(false);
                                    setPickerImage("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    /* QR CODE SECTION (Friend's Uploaded QR vs Request Pending vs Not Uploaded) */
                    <div className="pay-qr-display-section">
                        {activeFriend?.qrCode ? (
                            /* Friend Has Uploaded Their QR Code */
                            <div className="friend-official-qr-card">
                                <div className="qr-badge-header">
                                    <span className="qr-status-pill green">
                                        ✓ {activeFriend.qrPlatform ? `${activeFriend.qrPlatform} QR` : "Payment QR"}
                                    </span>
                                    <label className="btn-reupload-qr-label" htmlFor="pay-qr-file-reupload">
                                        <span>Change QR</span>
                                        <input
                                            id="pay-qr-file-reupload"
                                            type="file"
                                            accept="image/*"
                                            className="file-hidden-input"
                                            onChange={handleFileSelected}
                                        />
                                    </label>
                                </div>

                                <div className="friend-qr-frame">
                                    <img src={activeFriend.qrCode} alt="Payment QR" className="friend-qr-image" />
                                </div>

                                <div className="qr-scan-instruction">
                                    <strong>Scan with PhonePe, Google Pay, or Paytm camera</strong>
                                    <p>Amount to send: <strong>₹{Number(amount) > 0 ? Number(amount).toLocaleString("en-IN") : "0"}</strong></p>
                                </div>
                            </div>
                        ) : activeFriend?.qrRequestStatus === "pending" ? (
                            /* QR Request is Pending from WhatsApp */
                            <div className="qr-status-card pending-card">
                                <div className="qr-status-icon-wrap">⏳</div>
                                <h4>QR Code Request Pending</h4>
                                <p>
                                    You sent a request to <strong>{activeFriend.name}</strong> on WhatsApp. Waiting for them to upload their QR screenshot.
                                </p>

                                <div className="qr-pending-actions">
                                    <button
                                        type="button"
                                        className="btn-whatsapp-action"
                                        onClick={handleSendWhatsAppQrRequest}
                                    >
                                        📲 Re-send WhatsApp Link
                                    </button>

                                    <label className="btn-upload-myself-action" htmlFor="pay-qr-upload-myself">
                                        <span>📸 Upload QR Screenshot Myself</span>
                                        <input
                                            id="pay-qr-upload-myself"
                                            type="file"
                                            accept="image/*"
                                            className="file-hidden-input"
                                            onChange={handleFileSelected}
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            /* No QR Code Uploaded Yet */
                            <div className="qr-status-card not-uploaded-card">
                                <div className="qr-status-icon-wrap">📸</div>
                                <h4>No Payment QR Attached Yet</h4>
                                <p>
                                    Send a 1-tap WhatsApp request to <strong>{activeFriend?.name}</strong> so they can upload their PhonePe/GPay QR, or upload their screenshot yourself!
                                </p>

                                <div className="qr-pending-actions">
                                    <button
                                        type="button"
                                        className="btn-whatsapp-action"
                                        onClick={handleSendWhatsAppQrRequest}
                                    >
                                        📲 Send Request to Friend for QR Code
                                    </button>

                                    <label className="btn-upload-myself-action" htmlFor="pay-qr-upload-initial">
                                        <span>📸 Upload QR Screenshot Myself</span>
                                        <input
                                            id="pay-qr-upload-initial"
                                            type="file"
                                            accept="image/*"
                                            className="file-hidden-input"
                                            onChange={handleFileSelected}
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="form-error pay-error-banner">{error}</p>}

                {/* Footer Action Buttons */}
                <div className="pay-modal-footer">
                    <button
                        type="button"
                        className="btn-pay-submit"
                        disabled={recording || !Number(amount)}
                        onClick={handleManualMarkPaid}
                    >
                        {recording ? "Updating Ledger..." : "✓ Mark as Paid & Update Ledger"}
                    </button>

                    <button type="button" className="btn-pay-cancel" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
