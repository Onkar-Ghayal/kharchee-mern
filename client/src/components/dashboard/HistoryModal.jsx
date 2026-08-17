import { useState, useMemo, useEffect } from "react";
import { exportToPDF, exportToCSV } from "../../utils/statementExport";

export default function HistoryModal({
    open,
    friend,
    userName = "User",
    onClose,
    onClear,
    onDeleteTransaction,
    onAddExpense
}) {
    // 1. All hooks unconditionally declared at the top level
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // "all" | "thisMonth" | "7days" | "gain" | "loss"
    const [deletingId, setDeletingId] = useState(null);
    const [confirmTxn, setConfirmTxn] = useState(null);

    // Reset local filters when modal closes/re-opens
    useEffect(() => {
        if (open) {
            setSearchQuery("");
            setActiveFilter("all");
            setDeletingId(null);
            setConfirmTxn(null);
        }
    }, [open]);

    const history = Array.isArray(friend?.history) ? friend.history : [];
    const isEmpty = history.length === 0;
    const friendName = friend?.name || "Friend";
    const initial = friendName.charAt(0).toUpperCase();
    const currentAmount = Number(friend?.currentAmount) || 0;
    const isLoss = currentAmount < 0;
    const isZero = currentAmount === 0;

    // Calculate totals
    const totalGiven = history.reduce((acc, h) => (Number(h?.amount) > 0 ? acc + Number(h.amount) : acc), 0);
    const totalTaken = history.reduce((acc, h) => (Number(h?.amount) < 0 ? acc + Math.abs(Number(h.amount)) : acc), 0);

    // Format safe date helper
    const formatDate = (dateVal) => {
        try {
            const d = dateVal ? new Date(dateVal) : new Date();
            if (isNaN(d.getTime())) return "Recent";
            return d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "Recent";
        }
    };

    // Filtered transaction list (Hook called unconditionally)
    const filteredHistory = useMemo(() => {
        if (!open || isEmpty) return [];

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return history.filter((h) => {
            if (!h) return false;
            const amount = Number(h.amount) || 0;
            const d = h.date ? new Date(h.date) : new Date();
            const validDate = !isNaN(d.getTime()) ? d : now;

            // 1. Date & Type Filter
            if (activeFilter === "7days" && validDate < sevenDaysAgo) {
                return false;
            }
            if (activeFilter === "thisMonth" && validDate < startOfMonth) {
                return false;
            }
            if (activeFilter === "gain" && amount < 0) {
                return false;
            }
            if (activeFilter === "loss" && amount >= 0) {
                return false;
            }

            // 2. Search Query Filter (Notes, Amount, Date string)
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                const note = (h.description || "").toLowerCase();
                const amountStr = Math.abs(amount).toString();
                const dateStr = formatDate(h.date).toLowerCase();

                const matchesNote = note.includes(q);
                const matchesAmount = amountStr.includes(q);
                const matchesDate = dateStr.includes(q);

                if (!matchesNote && !matchesAmount && !matchesDate) {
                    return false;
                }
            }

            return true;
        });
    }, [open, history, activeFilter, searchQuery, isEmpty]);

    // 2. Conditional return placed strictly AFTER all hooks
    if (!open) return null;

    const isFilterActive = searchQuery.trim() !== "" || activeFilter !== "all";

    const handleClearFilters = () => {
        setSearchQuery("");
        setActiveFilter("all");
    };

    const handleDeleteSingle = async (h, originalIndex) => {
        const idToPass = h?._id ? String(h._id) : `idx_${originalIndex}`;
        setDeletingId(idToPass);
        try {
            if (typeof onDeleteTransaction === "function") {
                await onDeleteTransaction(idToPass, originalIndex);
            }
            setConfirmTxn(null);
        } catch (err) {
            console.error("Error deleting transaction:", err);
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
                        <p className="history-friend-subtitle">Ledger with {friendName}</p>
                    </div>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Friend Ledger Summary Header Card */}
                <div className="history-ledger-hero-card">
                    <div className="ledger-hero-top">
                        <div className="ledger-hero-avatar">{initial}</div>
                        <div className="ledger-hero-meta">
                            <h4 className="ledger-hero-name">{friendName}</h4>
                            {friend?.mobile ? (
                                <span className="ledger-hero-phone">📱 {friend.mobile}</span>
                            ) : (
                                <span className="ledger-hero-phone-empty">No mobile attached</span>
                            )}
                        </div>
                        <div className="ledger-hero-balance-badge">
                            <span className="ledger-bal-label">
                                {isLoss ? "You Owe" : isZero ? "Settled" : "You Will Get"}
                            </span>
                            <span className={`ledger-bal-val ${isLoss ? "loss" : isZero ? "settled" : "gain"}`}>
                                {isLoss ? "-" : isZero ? "" : "+"}₹{Math.abs(currentAmount).toLocaleString("en-IN")}
                            </span>
                        </div>
                    </div>

                    <div className="ledger-hero-stats-row">
                        <div className="ledger-stat-item">
                            <span className="stat-caption">Total Received</span>
                            <span className="stat-value gain">+₹{totalGiven.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="ledger-stat-divider" />
                        <div className="ledger-stat-item">
                            <span className="stat-caption">Total Paid</span>
                            <span className="stat-value loss">-₹{totalTaken.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="ledger-stat-divider" />
                        <div className="ledger-stat-item">
                            <span className="stat-caption">Total Entries</span>
                            <span className="stat-value neutral">{history.length}</span>
                        </div>
                    </div>
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

                {/* Search & Date Filter Section */}
                {!isEmpty && (
                    <div className="history-search-filter-section">
                        {/* Search Input */}
                        <div className="history-search-wrap">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="history-search-icon">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                className="history-search-input"
                                placeholder="Search note, amount, date..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="history-search-clear-btn"
                                    onClick={() => setSearchQuery("")}
                                    aria-label="Clear search"
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Filter Pills */}
                        <div className="history-filter-pills-row">
                            <button
                                type="button"
                                className={`history-pill-btn ${activeFilter === "all" ? "active" : ""}`}
                                onClick={() => setActiveFilter("all")}
                            >
                                All Time
                            </button>
                            <button
                                type="button"
                                className={`history-pill-btn ${activeFilter === "thisMonth" ? "active" : ""}`}
                                onClick={() => setActiveFilter("thisMonth")}
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                className={`history-pill-btn ${activeFilter === "7days" ? "active" : ""}`}
                                onClick={() => setActiveFilter("7days")}
                            >
                                Last 7 Days
                            </button>
                            <button
                                type="button"
                                className={`history-pill-btn gain-pill ${activeFilter === "gain" ? "active" : ""}`}
                                onClick={() => setActiveFilter("gain")}
                            >
                                + You Got
                            </button>
                            <button
                                type="button"
                                className={`history-pill-btn loss-pill ${activeFilter === "loss" ? "active" : ""}`}
                                onClick={() => setActiveFilter("loss")}
                            >
                                - You Gave
                            </button>
                        </div>

                        {/* Status bar */}
                        {isFilterActive && (
                            <div className="history-filter-status-bar">
                                <span>
                                    Found <strong>{filteredHistory.length}</strong> of {history.length} transactions
                                </span>
                                <button
                                    type="button"
                                    className="btn-reset-filters"
                                    onClick={handleClearFilters}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
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
                                {(Number(confirmTxn.txn?.amount) || 0) < 0 ? "-" : "+"}₹
                                {Math.abs(Number(confirmTxn.txn?.amount) || 0).toLocaleString("en-IN")}
                            </strong>
                            {confirmTxn.txn?.description ? ` (${confirmTxn.txn.description})` : ""}?
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

                {/* Main Content Area */}
                {isEmpty ? (
                    <div className="empty-history-enhanced-box">
                        <div className="empty-history-icon-bubble">📜</div>
                        <h4>No Transactions Yet</h4>
                        <p>
                            You haven't recorded any payments or expenses with <strong>{friendName}</strong> yet.
                            Add an expense or settle a balance to build your transaction ledger.
                        </p>
                        {onAddExpense && (
                            <button
                                type="button"
                                className="btn-add-first-expense"
                                onClick={() => onAddExpense(friend)}
                            >
                                + Add First Expense
                            </button>
                        )}
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="empty-history-search-box">
                        <div className="empty-search-icon">🔍</div>
                        <p className="empty-search-title">No matching transactions</p>
                        <p className="empty-search-desc">
                            No records found for "{searchQuery || activeFilter}". Try adjusting your search query or filters.
                        </p>
                        <button
                            type="button"
                            className="btn-clear-search-empty"
                            onClick={handleClearFilters}
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <ul className="history-list">
                        {filteredHistory.map((h, i) => {
                            if (!h) return null;
                            const amount = Number(h.amount) || 0;
                            const isLossItem = amount < 0;
                            const formattedDate = formatDate(h.date);
                            const currentId = h._id ? String(h._id) : `idx_${i}`;
                            const isDeleting = deletingId === currentId;
                            const originalIndex = history.findIndex((item) => (
                                item?._id && h?._id ? String(item._id) === String(h._id) : item === h
                            ));

                            return (
                                <li key={currentId || i} className="history-item-row">
                                    <div className="history-item-left">
                                        <div className="history-item-date-row">
                                            <span className="history-item-date">{formattedDate}</span>
                                            {h.type && h.type !== "transaction" && (
                                                <span className={`history-type-badge ${h.type}`}>
                                                    {h.type}
                                                </span>
                                            )}
                                        </div>
                                        <div className="history-item-note">
                                            {h.description || "General transaction"}
                                        </div>
                                    </div>

                                    <div className="history-item-right">
                                        <span className={`history-amount-pill ${isLossItem ? "loss" : "gain"}`}>
                                            {isLossItem ? "-" : "+"}₹{Math.abs(amount).toLocaleString("en-IN")}
                                        </span>

                                        {/* Click to open Warning confirmation */}
                                        <button
                                            type="button"
                                            className="btn-delete-single-txn"
                                            title="Delete this transaction"
                                            disabled={isDeleting}
                                            onClick={() => setConfirmTxn({ txn: h, index: originalIndex >= 0 ? originalIndex : i })}
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
