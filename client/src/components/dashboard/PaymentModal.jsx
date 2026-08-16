import { useState, useEffect, useMemo } from "react";

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
        setWaitingForReturn(false);
        setLaunchedPayment(null);
        setShowReturnConfirm(false);
    }, [open, preselectedFriend, friends]);

    // Detect when user returns from UPI app (Google Pay / PhonePe)
    useEffect(() => {
        if (!waitingForReturn || !launchedPayment) return;

        const handleReturn = () => {
            if (document.visibilityState === "visible") {
                // User has switched back to the Kharchee tab
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

    if (!open) return null;

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(""), 2500);
    };

    // 1-Tap Direct UPI Payment Launch for Mobile Users
    const handleLaunchUpi = (e) => {
        if (e && e.preventDefault) e.preventDefault();
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

        let upiUri = `upi://pay?pa=${encodeURIComponent(targetVpa)}&pn=${encodeURIComponent(activeFriend.name)}&cu=INR&am=${validAmount}`;
        if (note) upiUri += `&tn=${note}`;

        // Save state before leaving app
        setLaunchedPayment({
            friend: activeFriend,
            amount: num,
            description: description.trim()
        });
        setWaitingForReturn(true);

        // Open UPI App
        window.location.href = upiUri;

        // Fallback popup if browser does not fire visibilitychange immediately
        setTimeout(() => {
            setShowReturnConfirm(true);
        }, 1800);
    };

    // Confirm Payment in Ledger only from the return verification popup
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
            launchedPayment.friend.upiApp || "Google Pay / PhonePe"
        );
    };

    const handleReturnConfirmFailed = () => {
        setShowReturnConfirm(false);
        setLaunchedPayment(null);
        setWaitingForReturn(false);
        setError("Payment was marked as failed / cancelled. Balance was not changed.");
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
                                    <p className="pay-header-sub">Enter amount & launch UPI app</p>
                                </div>
                            </div>
                            <button type="button" className="btn-close-pay-modal" onClick={onClose} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleLaunchUpi}>
                            {/* Fixed Recipient Card */}
                            <div className="pay-form-section">
                                <label className="pay-form-label">Recipient</label>

                                {/* Recipient Context Card */}
                                {activeFriend && (
                                    <div className={`recipient-summary-box ${isOwed ? "status-owed" : isDue ? "status-due" : "status-settled"}`}>
                                        <div className="recipient-avatar">
                                            {activeFriend.name ? activeFriend.name.charAt(0).toUpperCase() : "F"}
                                        </div>
                                        <div className="recipient-meta">
                                            <h4 className="recipient-name">{activeFriend.name}</h4>
                                            <div className="recipient-phone-row">
                                                <span>+91 {activeFriend.mobile}</span>
                                                <button
                                                    type="button"
                                                    className="btn-copy-tag"
                                                    onClick={() => copyToClipboard(activeFriend.mobile, "Number")}
                                                >
                                                    {copied === "Number" ? "Copied" : "Copy"}
                                                </button>
                                            </div>
                                            {activeFriend.upiId && (
                                                <div className="recipient-upi-row">
                                                    <span>{activeFriend.upiId} ({activeFriend.upiApp || "UPI"})</span>
                                                    <button
                                                        type="button"
                                                        className="btn-copy-tag"
                                                        onClick={() => copyToClipboard(activeFriend.upiId, "UPI ID")}
                                                    >
                                                        {copied === "UPI ID" ? "Copied" : "Copy"}
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
                            </div>

                            {/* 1. Enter Amount */}
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

                            {/* 2. Enter Note / Description */}
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

                            {error && <p className="form-error pay-error-banner">{error}</p>}

                            {/* 3. Primary Pay Button & Cancel */}
                            <div className="pay-modal-footer">
                                <button
                                    type="submit"
                                    className="btn-pay-submit"
                                    disabled={recording || !Number(amount)}
                                >
                                    {`Open & Pay via ${
                                        activeFriend?.upiApp === "phonepe"
                                            ? "PhonePe"
                                            : activeFriend?.upiApp === "googlepay"
                                            ? "Google Pay"
                                            : activeFriend?.upiApp === "paytm"
                                            ? "Paytm"
                                            : activeFriend?.upiApp === "bhim"
                                            ? "BHIM UPI"
                                            : activeFriend?.upiApp || "UPI"
                                    } ↗`}
                                </button>
                                <button type="button" className="btn-pay-cancel" onClick={onClose}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
