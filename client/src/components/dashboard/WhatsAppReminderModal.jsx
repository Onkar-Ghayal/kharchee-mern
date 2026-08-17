import { useState, useEffect } from "react";

const TEMPLATES = [
    {
        id: "friendly",
        label: "Polite & Friendly",
        generate: (friendName, amount, userName) =>
            `Hey ${friendName}! 👋 Just a friendly reminder regarding the pending ₹${amount.toLocaleString("en-IN")} on Kharchee. Let's settle up whenever convenient! 😊`
    },
    {
        id: "direct",
        label: "Short & Direct",
        generate: (friendName, amount, userName) =>
            `Hi ${friendName}, reminder: ₹${amount.toLocaleString("en-IN")} is pending on Kharchee from our shared expenses. Please clear when free. Thanks!`
    },
    {
        id: "upi",
        label: "With UPI Settlement",
        generate: (friendName, amount, userName) =>
            `Hey ${friendName}! 👋 Please clear the pending ₹${amount.toLocaleString("en-IN")} on Kharchee via Google Pay / PhonePe when possible. Let me know once done! 👍`
    }
];

export default function WhatsAppReminderModal({
    open,
    friend,
    userName = "Friend",
    onClose,
    onOpenReceiptCard
}) {
    const [selectedTemplate, setSelectedTemplate] = useState("friendly");
    const [customMessage, setCustomMessage] = useState("");
    const [copied, setCopied] = useState(false);

    const pendingAmount = friend ? Math.abs(friend.currentAmount || 0) : 0;

    useEffect(() => {
        if (!open || !friend) return;

        const defaultTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];
        setCustomMessage(defaultTemplate.generate(friend.name, pendingAmount, userName));
        setCopied(false);
    }, [open, friend, selectedTemplate, pendingAmount, userName]);

    if (!open || !friend) return null;

    const handleSelectTemplate = (templateId) => {
        setSelectedTemplate(templateId);
        const t = TEMPLATES.find((item) => item.id === templateId);
        if (t) {
            setCustomMessage(t.generate(friend.name, pendingAmount, userName));
        }
    };

    const handleSendWhatsApp = () => {
        const cleanMobile = (friend.mobile || "").replace(/[^0-9]/g, "");
        if (!cleanMobile) {
            alert("This friend does not have a valid mobile number attached.");
            return;
        }

        const encodedMsg = encodeURIComponent(customMessage.trim());
        const waUrl = `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodedMsg}`;
        window.open(waUrl, "_blank");
        onClose();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(customMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal reminder-modal-backdrop" style={{ display: "flex" }}>
            <div className="modal-content reminder-modal-content">
                {/* Header */}
                <div className="modal-header-row">
                    <div className="reminder-header-left">
                        <div className="whatsapp-badge-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3>WhatsApp Reminder</h3>
                            <p className="reminder-header-sub">To {friend.name} (+91 {friend.mobile})</p>
                        </div>
                    </div>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Amount Due Banner */}
                <div className="reminder-due-banner">
                    <span className="due-label">Pending Balance:</span>
                    <span className="due-val">₹{pendingAmount.toLocaleString("en-IN")}</span>
                </div>

                {/* Template Choice Pills */}
                <div className="reminder-section">
                    <label className="reminder-section-label">Choose Message Style</label>
                    <div className="reminder-template-chips">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                className={`template-chip-btn ${selectedTemplate === t.id ? "active" : ""}`}
                                onClick={() => handleSelectTemplate(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editable Message Textarea */}
                <div className="reminder-section">
                    <div className="reminder-textarea-header">
                        <label className="reminder-section-label">Customize Reminder Message</label>
                        <button type="button" className="btn-copy-msg-link" onClick={handleCopy}>
                            {copied ? "✓ Copied" : "Copy Text"}
                        </button>
                    </div>
                    <textarea
                        className="reminder-custom-textarea"
                        rows={4}
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type your custom message..."
                    />
                </div>

                {/* WhatsApp Chat Preview Bubble */}
                <div className="whatsapp-preview-box">
                    <div className="whatsapp-bubble">
                        <p>{customMessage}</p>
                        <span className="bubble-time">
                            {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    </div>
                </div>

                {/* Visual Receipt Card Shortcut */}
                {onOpenReceiptCard && (
                    <div style={{ marginBottom: "1rem" }}>
                        <button
                            type="button"
                            className="btn-open-receipt-card"
                            onClick={() => {
                                onClose();
                                onOpenReceiptCard(friend);
                            }}
                        >
                            <span>🖼️ Generate & Share Visual Receipt Slip</span>
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="reminder-modal-footer">
                    <button
                        type="button"
                        className="btn-send-whatsapp"
                        onClick={handleSendWhatsApp}
                    >
                        <span>Send Text on WhatsApp</span>
                        <span className="btn-wa-arrow">↗</span>
                    </button>
                    <button type="button" className="btn-reminder-cancel" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
