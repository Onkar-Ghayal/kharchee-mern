import { useState } from "react";
import { exportToPDF, exportToCSV } from "../../utils/statementExport";

export default function HistoryModal({
    open,
    friend,
    userName = "User",
    onClose,
    onClear,
    onDeleteTransaction
}) {
    const [deletingId, setDeletingId] = useState(null);
    const [confirmTxn, setConfirmTxn] = useState(null);

    if (!open) return null;

    const history = friend?.history || [];
    const isEmpty = history.length === 0;

    const handleDeleteSingle = async (h, index) => {
        const idToPass = h._id ? h._id.toString() : `idx_${index}`;
        setDeletingId(idToPass);
        try {
            await onDeleteTransaction(idToPass, index);
            setConfirmTxn(null);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="modal history-modal" style={{ display: "flex" }}>
            <div className="modal-content history-modal-content">
                {/* Header Row */}
                <div className="modal-header-row">
                    <div>
                        <h3>Transaction History</h3>
                        {friend?.name && <p className="history-friend-subtitle">With {friend.name}</p>}
                    </div>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Statement Download Bar */}
                {!isEmpty && (
                    <div className="history-export-toolbar">
                        <button
                            type="button"
                            className="btn-export-statement pdf"
                            onClick={() => exportToPDF(friend, userName)}
                            title="Print or Save PDF Statement"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                            <span>Download PDF</span>
                        </button>

                        <button
                            type="button"
                            className="btn-export-statement csv"
                            onClick={() => exportToCSV(friend)}
                            title="Export spreadsheet CSV"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="8 17 12 21 16 17"></polyline>
                                <line x1="12" y1="12" x2="12" y2="21"></line>
                                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
                            </svg>
                            <span>Export CSV</span>
                        </button>
                    </div>
                )}

                {/* Warning Confirmation Dialog Overlay */}
                {confirmTxn && (
                    <div className="txn-delete-warning-box">
                        <div className="warning-box-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h4>Delete Transaction?</h4>
                        </div>
                        <p className="warning-box-desc">
                            Are you sure you want to delete this transaction of{" "}
                            <strong>
                                {confirmTxn.txn.amount < 0 ? "-" : "+"}₹
                                {Math.abs(confirmTxn.txn.amount).toLocaleString("en-IN")}
                            </strong>
                            {confirmTxn.txn.description ? ` (${confirmTxn.txn.description})` : ""}?
                            This will automatically reverse the amount from your balance.
                        </p>
                        <div className="warning-box-actions">
                            <button
                                type="button"
                                className="btn-confirm-delete-txn"
                                disabled={deletingId !== null}
                                onClick={() => handleDeleteSingle(confirmTxn.txn, confirmTxn.index)}
                            >
                                {deletingId !== null ? "Deleting..." : "Yes, Delete"}
                            </button>
                            <button
                                type="button"
                                className="btn-cancel-delete-txn"
                                onClick={() => setConfirmTxn(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {isEmpty ? (
                    <div className="empty-history-box">
                        <p>No transactions recorded yet.</p>
                    </div>
                ) : (
                    <ul className="history-list">
                        {history.map((h, i) => {
                            const isLoss = h.amount < 0;
                            const formattedDate = new Date(h.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            });
                            const currentId = h._id ? h._id.toString() : `idx_${i}`;
                            const isDeleting = deletingId === currentId;

                            return (
                                <li key={currentId || i} className="history-item-row">
                                    <div className="history-item-left">
                                        <div className="history-item-date">{formattedDate}</div>
                                        {h.description && (
                                            <div className="history-item-note">
                                                {h.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="history-item-right">
                                        <span className={`history-amount-pill ${isLoss ? "loss" : "gain"}`}>
                                            {isLoss ? "-" : "+"}₹{Math.abs(h.amount).toLocaleString("en-IN")}
                                        </span>

                                        {/* Click to open Warning confirmation */}
                                        <button
                                            type="button"
                                            className="btn-delete-single-txn"
                                            title="Delete this transaction"
                                            disabled={isDeleting}
                                            onClick={() => setConfirmTxn({ txn: h, index: i })}
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <div className="modal-actions history-actions">
                    <button
                        className="btn-delete-confirm history-clear"
                        disabled={isEmpty}
                        style={{ opacity: isEmpty ? 0.5 : 1, cursor: isEmpty ? "not-allowed" : "pointer" }}
                        onClick={onClear}
                    >
                        Clear All History
                    </button>

                    <button className="btn-cancel history-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
