import { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function PaymentModal({
    open,
    friends = [],
    preselectedFriend,
    onClose,
    onPaymentSuccess
}) {
    const [selectedFriendId, setSelectedFriendId] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [paymentTab, setPaymentTab] = useState("upi"); // 'upi' | 'qr'
    const [recording, setRecording] = useState(false);
    const [copied, setCopied] = useState("");
    const [error, setError] = useState("");

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
        setPaymentTab("upi");
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

    // Construct UPI String
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

    // Launch UPI App
    const handleLaunchUpi = (appType = "generic") => {
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
            setError("No UPI ID found for this friend. Please add their UPI ID first.");
            return;
        }

        const validAmount = num.toFixed(2);
        const note = encodeURIComponent(description.trim() || "Kharchee Payment");

        let finalUri = `upi://pay?pa=${encodeURIComponent(targetVpa)}&pn=${encodeURIComponent(activeFriend.name)}&cu=INR&am=${validAmount}`;
        if (note) finalUri += `&tn=${note}`;

        // Save state before leaving app
        setLaunchedPayment({
            friend: activeFriend,
            amount: num,
            description: description.trim(),
            upiApp: appType === "generic" ? (activeFriend.upiApp || "UPI") : appType
        });
        setWaitingForReturn(true);

        // Open UPI App
        window.location.href = finalUri;

        // Fallback popup if browser does not fire visibilitychange immediately
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
                {/* 1. Return from UPI Status Confirmation Modal (Popup Verification) */}
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
                                    <p className="pay-header-sub">UPI Deep-Link, QR Code & 1-Tap Transfer</p>
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

                        {/* Amount & Note Input Section */}
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

                            {/* Quick Presets */}
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

                        {/* Note / Description */}
                        <div className="pay-form-section">
                            <label className="pay-form-label">Note / Reason (Optional)</label>
                            <input
                                type="text"
                                className="pay-description-input"
                                placeholder="e.g. Dinner share, Chai, Cab, Rent"
                                value={description}
                                maxLength={100}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Payment Mode Selector (UPI Launch vs QR Code) */}
                        <div className="payment-mode-tabs">
                            <button
                                type="button"
                                className={`pay-mode-tab-btn ${paymentTab === "upi" ? "active" : ""}`}
                                onClick={() => setPaymentTab("upi")}
                            >
                                📱 1-Tap UPI Apps
                            </button>
                            <button
                                type="button"
                                className={`pay-mode-tab-btn ${paymentTab === "qr" ? "active" : ""}`}
                                onClick={() => setPaymentTab("qr")}
                            >
                                📸 Scan & Pay QR Code
                            </button>
                        </div>

                        {/* TAB 1: 1-Tap UPI Launch */}
                        {paymentTab === "upi" ? (
                            <div className="payment-tab-content">
                                <div className="direct-upi-launch-box">
                                    <button
                                        type="button"
                                        className="btn-launch-mobile-upi primary-upi-btn"
                                        disabled={!Number(amount)}
                                        onClick={() => handleLaunchUpi("generic")}
                                    >
                                        🚀 Open PhonePe / GPay / Paytm
                                    </button>
                                </div>

                                {/* Security Guidance Note */}
                                <div className="upi-security-note-box">
                                    <div className="security-note-icon">🛡️</div>
                                    <div className="security-note-text">
                                        <strong>PhonePe / GPay Security Notice:</strong>
                                        <p>
                                            If your UPI app declines browser links, tap <strong>Scan & Pay QR Code</strong> above or copy the <strong>UPI ID / Mobile Number</strong> and paste directly in your UPI app.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* TAB 2: Dynamic Live QR Code */
                            <div className="payment-tab-content qr-tab-content">
                                <div className="dynamic-qr-container">
                                    {upiString ? (
                                        <div className="qr-code-box">
                                            <QRCodeSVG
                                                value={upiString}
                                                size={160}
                                                level="H"
                                                includeMargin={true}
                                                bgColor="#ffffff"
                                                fgColor="#0f172a"
                                            />
                                            <div className="qr-code-caption">
                                                <span className="qr-pay-amount">₹{Number(amount) > 0 ? Number(amount).toLocaleString("en-IN") : "0"}</span>
                                                <span className="qr-pay-recipient">Scan with PhonePe, Google Pay, Paytm, or BHIM</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="qr-placeholder-box">
                                            <p>Please enter an amount above to generate the payment QR code</p>
                                        </div>
                                    )}
                                </div>
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
                    </>
                )}
            </div>
        </div>
    );
}
