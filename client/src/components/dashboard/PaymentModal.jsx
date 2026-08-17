import { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../../api/axios";

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
    const [paymentTab, setPaymentTab] = useState("friend_qr"); // 'friend_qr' | 'dynamic_qr' | 'upi_apps'
    const [recording, setRecording] = useState(false);
    const [copied, setCopied] = useState("");
    const [error, setError] = useState("");
    const [uploadingQr, setUploadingQr] = useState(false);

    // Return from UPI App verification state
    const [waitingForReturn, setWaitingForReturn] = useState(false);
    const [launchedPayment, setLaunchedPayment] = useState(null);
    const [showReturnConfirm, setShowReturnConfirm] = useState(false);

    // Initialize state when modal opens
    useEffect(() => {
        if (!open) {
            setWaitingForReturn(false);
            setLaunchedPayment(null);
            setShowReturnConfirm(false);
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
        setPaymentTab("friend_qr");
        setWaitingForReturn(false);
        setLaunchedPayment(null);
        setShowReturnConfirm(false);
    }, [open, preselectedFriend, friends]);

    // Detect when user returns from UPI app
    useEffect(() => {
        if (!waitingForReturn || !launchedPayment) return;

        const handleReturn = () => {
            if (document.visibilityState === "visible") {
                setShowReturnConfirm(true);
                setWaitingForReturn(false);
            }
        };

        const handleFocus = () => {
            setShowReturnConfirm(true);
            setWaitingForReturn(false);
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleReturn);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleReturn);
        };
    }, [waitingForReturn, launchedPayment]);

    const activeFriend = useMemo(() => {
        return friends.find((f) => f._id === selectedFriendId) || preselectedFriend || null;
    }, [friends, selectedFriendId, preselectedFriend]);

    const isOwed = activeFriend && activeFriend.currentAmount < 0;
    const isDue = activeFriend && activeFriend.currentAmount > 0;

    // Dynamic UPI String fallback
    const upiString = useMemo(() => {
        if (!activeFriend) return "";
        const targetVpa = activeFriend.upiId || (activeFriend.mobile ? `${activeFriend.mobile}@upi` : "");
        if (!targetVpa) return "";
        const num = Number(amount) || 0;
        const validAmount = num > 0 ? num.toFixed(2) : "";
        const note = encodeURIComponent(description.trim() || "Kharchee Payment");

        let uri = `upi://pay?pa=${encodeURIComponent(targetVpa)}&pn=${encodeURIComponent(activeFriend.name)}&cu=INR`;
        if (validAmount) uri += `&am=${validAmount}`;
        if (note) uri += `&tn=${note}`;
        return uri;
    }, [activeFriend, amount, description]);

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
            const message = `Hey ${activeFriend.name}! Please upload your PhonePe / Google Pay / Paytm QR code screenshot so I can pay you directly on Kharchee: ${uploadUrl}`;
            const waUrl = `https://wa.me/91${activeFriend.mobile}?text=${encodeURIComponent(message)}`;

            // Mark as pending on server
            await api.put(`/friends/${activeFriend._id}/qr-status`, { status: "pending" });
            if (onFriendUpdated) onFriendUpdated();

            window.open(waUrl, "_blank");
        } catch (err) {
            console.error("QR status update error:", err);
        }
    };

    // Upload QR Code Directly from Modal
    const handleDirectQrUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeFriend) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file (PNG, JPG, WEBP)");
            return;
        }

        setUploadingQr(true);
        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            const img = new Image();
            img.onload = async () => {
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

                try {
                    await api.put(`/friends/${activeFriend._id}`, {
                        qrCode: compressedBase64,
                        qrRequestStatus: "uploaded"
                    });
                    if (onFriendUpdated) onFriendUpdated();
                    setError("");
                } catch (err) {
                    setError("Failed to save QR code");
                } finally {
                    setUploadingQr(false);
                }
            };
            img.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Launch UPI App directly
    const handleLaunchUpi = () => {
        setError("");

        const num = Number(amount);
        if (!num || isNaN(num) || num <= 0) {
            setError("Please enter a valid payment amount first");
            return;
        }

        if (!activeFriend) {
            setError("Please select a friend to pay");
            return;
        }

        const targetVpa = activeFriend.upiId || (activeFriend.mobile ? `${activeFriend.mobile}@upi` : "");
        if (!targetVpa) {
            setError("No UPI ID found. Please ask friend to upload QR or provide UPI ID.");
            return;
        }

        const validAmount = num.toFixed(2);
        const note = encodeURIComponent(description.trim() || "Kharchee Payment");

        let finalUri = `upi://pay?pa=${encodeURIComponent(targetVpa)}&pn=${encodeURIComponent(activeFriend.name)}&cu=INR&am=${validAmount}`;
        if (note) finalUri += `&tn=${note}`;

        setLaunchedPayment({
            friend: activeFriend,
            amount: num,
            description: description.trim(),
            upiApp: activeFriend.upiApp || "UPI"
        });
        setWaitingForReturn(true);

        window.location.href = finalUri;

        setTimeout(() => {
            setShowReturnConfirm(true);
        }, 2200);
    };

    // Confirm Payment in Ledger
    const handleConfirmPayment = async (targetFriendId, payAmount, payDesc, payApp) => {
        setRecording(true);
        try {
            await onPaymentSuccess(targetFriendId, {
                amount: payAmount,
                description: payDesc,
                upiApp: payApp || "UPI"
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to record payment in ledger");
        } finally {
            setRecording(false);
        }
    };

    const handleReturnConfirmSuccess = () => {
        if (!launchedPayment) return;
        handleConfirmPayment(
            launchedPayment.friend._id,
            launchedPayment.amount,
            launchedPayment.description,
            launchedPayment.upiApp
        );
    };

    const handleReturnConfirmFailed = () => {
        setWaitingForReturn(false);
        setLaunchedPayment(null);
        setShowReturnConfirm(false);
    };

    // Manual Instant Mark as Paid
    const handleManualMarkPaid = () => {
        const num = Number(amount);
        if (!num || isNaN(num) || num <= 0) {
            setError("Please enter a valid amount first");
            return;
        }
        if (!activeFriend) return;
        handleConfirmPayment(activeFriend._id, num, description.trim(), activeFriend.upiApp || "UPI");
    };

    return (
        <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content professional-pay-card">
                {/* 1. Return from UPI Status Confirmation */}
                {showReturnConfirm && launchedPayment ? (
                    <div className="payment-return-verify-card">
                        <div className="verify-badge-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>

                        <h3 className="verify-modal-title">Did your payment go through?</h3>
                        <p className="verify-modal-sub">
                            You initiated a payment of{" "}
                            <strong>₹{launchedPayment.amount.toLocaleString("en-IN")}</strong> to{" "}
                            <strong>{launchedPayment.friend.name}</strong> via{" "}
                            {launchedPayment.friend.upiApp || "UPI"}.
                        </p>

                        <div className="verify-actions-grid">
                            <button
                                type="button"
                                className="btn-verify-success"
                                disabled={recording}
                                onClick={handleReturnConfirmSuccess}
                            >
                                {recording ? "Recording..." : "✓ Yes, Payment Successful"}
                            </button>

                            <button
                                type="button"
                                className="btn-verify-failed"
                                disabled={recording}
                                onClick={handleReturnConfirmFailed}
                            >
                                ✕ No, Payment Failed / Cancelled
                            </button>
                        </div>

                        <p className="verify-security-note">
                            If failed or cancelled, your Kharchee balance will remain completely untouched.
                        </p>
                    </div>
                ) : (
                    <>
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
                                    <p className="pay-header-sub">Scan QR Code, 1-Tap UPI & Settle</p>
                                </div>
                            </div>
                            <button type="button" className="btn-close-pay-modal" onClick={onClose} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        {/* Recipient Summary Card */}
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
                                    {activeFriend.upiId && (
                                        <div className="recipient-upi-row">
                                            <span>💳 {activeFriend.upiId}</span>
                                            <button
                                                type="button"
                                                className="btn-copy-tag"
                                                onClick={() => copyToClipboard(activeFriend.upiId, "UPI ID")}
                                            >
                                                {copied === "UPI ID" ? "✓ Copied" : "Copy"}
                                            </button>
                                        </div>
                                    )}
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

                        {/* QR CODE SECTION (Friend's Uploaded QR vs Request Pending vs App Deep Link) */}
                        <div className="pay-qr-display-section">
                            {activeFriend?.qrCode ? (
                                /* Friend Has Uploaded Their Official QR Code */
                                <div className="friend-official-qr-card">
                                    <div className="qr-badge-header">
                                        <span className="qr-status-pill green">✓ Official QR Code</span>
                                        <label className="btn-reupload-qr-label" htmlFor="pay-qr-reupload">
                                            <span>Change QR</span>
                                            <input
                                                id="pay-qr-reupload"
                                                type="file"
                                                accept="image/*"
                                                className="file-hidden-input"
                                                onChange={handleDirectQrUpload}
                                            />
                                        </label>
                                    </div>

                                    <div className="friend-qr-frame">
                                        <img src={activeFriend.qrCode} alt="Payment QR" className="friend-qr-image" />
                                    </div>

                                    <div className="qr-scan-instruction">
                                        <strong>Scan with PhonePe, Google Pay, or Paytm</strong>
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
                                            <span>{uploadingQr ? "Uploading..." : "📸 Upload QR Myself"}</span>
                                            <input
                                                id="pay-qr-upload-myself"
                                                type="file"
                                                accept="image/*"
                                                className="file-hidden-input"
                                                onChange={handleDirectQrUpload}
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                /* No QR Code Uploaded Yet */
                                <div className="qr-status-card not-uploaded-card">
                                    <div className="qr-status-icon-wrap">📸</div>
                                    <h4>No QR Code Added Yet</h4>
                                    <p>
                                        Send a 1-tap WhatsApp link to <strong>{activeFriend?.name}</strong> so they can upload their PhonePe/GPay QR, or upload their screenshot yourself!
                                    </p>

                                    <div className="qr-pending-actions">
                                        <button
                                            type="button"
                                            className="btn-whatsapp-action"
                                            onClick={handleSendWhatsAppQrRequest}
                                        >
                                            📲 Request QR on WhatsApp
                                        </button>

                                        <label className="btn-upload-myself-action" htmlFor="pay-qr-upload-initial">
                                            <span>{uploadingQr ? "Uploading..." : "📸 Upload QR Myself"}</span>
                                            <input
                                                id="pay-qr-upload-initial"
                                                type="file"
                                                accept="image/*"
                                                className="file-hidden-input"
                                                onChange={handleDirectQrUpload}
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

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
                    </>
                )}
            </div>
        </div>
    );
}
