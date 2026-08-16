export default function DesktopPayWarningModal({
    open,
    onClose,
    friendName = "your friend"
}) {
    if (!open) return null;

    return (
        <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content desktop-pay-warning-modal">
                <div className="desktop-warning-header">
                    <div className="desktop-warning-icon-wrap">
                        <span className="desktop-icon">💻</span>
                        <span className="warning-slash">🚫</span>
                        <span className="mobile-icon">📱</span>
                    </div>
                    <h3 className="desktop-warning-title">
                        You Cannot Pay from Laptop
                    </h3>
                    <p className="desktop-warning-subtitle">
                        Direct 1-tap UPI payments (Google Pay, PhonePe, Paytm, BHIM) require an <strong>Android or iOS</strong> mobile device.
                    </p>
                </div>

                <div className="desktop-warning-body">
                    <div className="desktop-info-card">
                        <div className="info-step-item">
                            <span className="step-num">1</span>
                            <p>Open <strong>Kharchee</strong> on your phone browser (Android or iPhone).</p>
                        </div>
                        <div className="info-step-item">
                            <span className="step-num">2</span>
                            <p>Tap <strong>"Pay"</strong> on {friendName}'s card to launch your UPI app directly.</p>
                        </div>
                        <div className="info-step-item">
                            <span className="step-num">3</span>
                            <p>Your ledger and balance will sync across all devices in real-time.</p>
                        </div>
                    </div>
                </div>

                <div className="desktop-warning-footer">
                    <button
                        type="button"
                        className="btn-desktop-warning-close"
                        onClick={onClose}
                    >
                        Got It ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
