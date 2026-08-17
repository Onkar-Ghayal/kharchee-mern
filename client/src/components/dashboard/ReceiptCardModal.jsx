import { useEffect, useRef, useState } from "react";
import { drawReceiptCard, downloadReceiptCard, getReceiptCardBlob } from "../../utils/receiptCardGenerator";

export default function ReceiptCardModal(props) {
    if (!props.open) return null;
    return <ReceiptCardModalContent {...props} />;
}

function ReceiptCardModalContent({
    friend,
    userName = "User",
    onClose
}) {
    const canvasRef = useRef(null);
    const [theme, setTheme] = useState("dark"); // "dark" | "light"
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const friendName = friend?.name || "Friend";
    const currentAmount = Math.abs(Number(friend?.currentAmount) || 0);

    // Redraw whenever theme or friend data changes
    useEffect(() => {
        if (canvasRef.current && friend) {
            drawReceiptCard(canvasRef.current, {
                friend,
                userName,
                theme
            });
        }
    }, [friend, userName, theme]);

    const handleDownload = () => {
        setDownloading(true);
        try {
            downloadReceiptCard(canvasRef.current, friendName);
        } finally {
            setTimeout(() => setDownloading(false), 500);
        }
    };

    const handleCopyImage = async () => {
        if (!canvasRef.current) return;
        try {
            const blob = await getReceiptCardBlob(canvasRef.current);
            if (blob && navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new window.ClipboardItem({ "image/png": blob })
                ]);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            } else {
                handleDownload();
            }
        } catch {
            handleDownload();
        }
    };

    const handleWhatsAppShare = () => {
        // Download receipt for easy attachment
        handleDownload();

        // Create polite payment message
        const msg = encodeURIComponent(
            `Hi ${friendName}! 👋 Here is our shared expense statement from Kharchee.\n\n` +
            `💰 *Pending Amount:* ₹${currentAmount.toLocaleString("en-IN")}\n` +
            `📄 *Attached Receipt Slip:* Downloaded to your device.\n\n` +
            `Please settle when convenient. Thanks! 😊`
        );

        let url = `https://wa.me/?text=${msg}`;
        if (friend?.mobile) {
            const cleanPhone = friend.mobile.replace(/[^0-9]/g, "");
            const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            url = `https://wa.me/${formattedPhone}?text=${msg}`;
        }

        window.open(url, "_blank");
    };

    return (
        <div className="modal receipt-card-modal" style={{ display: "flex" }}>
            <div className="modal-content receipt-modal-content">
                {/* Header */}
                <div className="modal-header-row">
                    <div>
                        <h3>Visual Receipt Slip</h3>
                        <p className="receipt-subtitle">Executive Statement Card for {friendName}</p>
                    </div>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Theme Selector Toolbar */}
                <div className="receipt-theme-toolbar">
                    <span className="theme-toggle-label">Card Theme:</span>
                    <div className="receipt-theme-pills">
                        <button
                            type="button"
                            className={`theme-pill-btn ${theme === "dark" ? "active" : ""}`}
                            onClick={() => setTheme("dark")}
                        >
                            🌙 Midnight Executive
                        </button>
                        <button
                            type="button"
                            className={`theme-pill-btn ${theme === "light" ? "active" : ""}`}
                            onClick={() => setTheme("light")}
                        >
                            ☀️ Pure Emerald
                        </button>
                    </div>
                </div>

                {/* Live Canvas Preview Stage */}
                <div className="receipt-canvas-stage">
                    <canvas
                        ref={canvasRef}
                        className="receipt-preview-canvas"
                    />
                </div>

                {/* Action Buttons Toolbar */}
                <div className="receipt-actions-toolbar">
                    <button
                        type="button"
                        className="btn-receipt-action download"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>{downloading ? "Saving..." : "Download HD PNG"}</span>
                    </button>

                    <button
                        type="button"
                        className={`btn-receipt-action copy ${copied ? "copied" : ""}`}
                        onClick={handleCopyImage}
                    >
                        {copied ? (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Copied to Clipboard!</span>
                            </>
                        ) : (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span>Copy Image</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn-receipt-action whatsapp"
                        onClick={handleWhatsAppShare}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                        </svg>
                        <span>Share on WhatsApp</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
