import { useState } from "react";
import {
    downloadExecutivePDF,
    sendPDFStatementToWhatsApp,
    generateExecutivePDFDoc
} from "../../utils/pdfStatementGenerator";

export default function PDFStatementModal(props) {
    if (!props.open) return null;
    return <PDFStatementModalContent {...props} />;
}

function PDFStatementModalContent({
    friend,
    userName = "User",
    onClose
}) {
    const [sending, setSending] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const friendName = friend?.name || "Friend";
    const currentAmount = Number(friend?.currentAmount) || 0;
    const isLoss = currentAmount < 0;
    const isZero = currentAmount === 0;
    const history = Array.isArray(friend?.history) ? friend.history : [];

    const totalGiven = history.reduce((acc, h) => (Number(h?.amount) > 0 ? acc + Number(h.amount) : acc), 0);
    const totalTaken = history.reduce((acc, h) => (Number(h?.amount) < 0 ? acc + Math.abs(Number(h.amount)) : acc), 0);

    const handleSendWhatsApp = async () => {
        setSending(true);
        try {
            await sendPDFStatementToWhatsApp(friend, userName);
        } finally {
            setSending(false);
        }
    };

    const handleDownload = () => {
        setDownloading(true);
        try {
            downloadExecutivePDF(friend, userName);
        } finally {
            setTimeout(() => setDownloading(false), 500);
        }
    };

    const handlePreview = () => {
        const doc = generateExecutivePDFDoc(friend, userName);
        if (doc) {
            const blobUrl = doc.output("bloburl");
            window.open(blobUrl, "_blank");
        }
    };

    return (
        <div className="modal pdf-statement-modal" style={{ display: "flex" }}>
            <div className="modal-content pdf-modal-content">
                {/* Header */}
                <div className="modal-header-row">
                    <div>
                        <h3>Official PDF Statement</h3>
                        <p className="pdf-modal-subtitle">Download or send digital PDF bill to {friendName}</p>
                    </div>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Executive Document Card Preview */}
                <div className="pdf-doc-summary-card">
                    <div className="pdf-doc-top-bar">
                        <div className="pdf-doc-icon-badge">📄</div>
                        <div className="pdf-doc-meta">
                            <h4 className="pdf-doc-title">Kharchee_Statement_{friendName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf</h4>
                            <span className="pdf-doc-pages">Official 1-Page A4 Statement • {history.length} Ledger Entries</span>
                        </div>
                    </div>

                    <div className="pdf-balance-spotlight">
                        <span className="pdf-spotlight-label">
                            {isLoss ? "Total Amount Owed" : isZero ? "Balance Settled" : "Total Amount Due"}
                        </span>
                        <span className={`pdf-spotlight-amount ${isLoss ? "loss" : isZero ? "settled" : "gain"}`}>
                            {isLoss ? "-" : isZero ? "" : "+"}₹{Math.abs(currentAmount).toLocaleString("en-IN")}
                        </span>
                        <span className={`pdf-status-chip ${isLoss ? "loss" : isZero ? "settled" : "gain"}`}>
                            {isLoss ? "YOU OWE" : isZero ? "SETTLED" : "PENDING PAYMENT"}
                        </span>
                    </div>

                    <div className="pdf-breakdown-row">
                        <div className="pdf-stat-col">
                            <span className="stat-label">Total Received</span>
                            <span className="stat-value gain">+₹{totalGiven.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="pdf-stat-col">
                            <span className="stat-label">Total Paid</span>
                            <span className="stat-value loss">-₹{totalTaken.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="pdf-stat-col">
                            <span className="stat-label">Recipient</span>
                            <span className="stat-value neutral">{friendName}</span>
                        </div>
                    </div>
                </div>

                {/* Primary Action: Send to WhatsApp with PDF Attachment */}
                <div className="pdf-modal-actions-container">
                    <button
                        type="button"
                        className="btn-send-pdf-whatsapp"
                        onClick={handleSendWhatsApp}
                        disabled={sending}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                        </svg>
                        <span>{sending ? "Opening WhatsApp..." : "Send PDF to WhatsApp"}</span>
                    </button>

                    <div className="pdf-secondary-actions-row">
                        <button
                            type="button"
                            className="btn-pdf-secondary download"
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>{downloading ? "Saving..." : "Download PDF"}</span>
                        </button>

                        <button
                            type="button"
                            className="btn-pdf-secondary preview"
                            onClick={handlePreview}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>Preview PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
