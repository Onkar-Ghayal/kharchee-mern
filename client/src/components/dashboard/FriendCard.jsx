export default function FriendCard({
    friend,
    onAddAmount,
    onRemind,
    onSettle,
    onEdit,
    onPDFStatement,
    onHistory,
    onDelete
}) {
    const isLoss = friend.currentAmount < 0;
    const isZero = friend.currentAmount === 0;

    const initial = friend.name ? friend.name.charAt(0).toUpperCase() : "F";
    const currentAmount = Math.abs(friend.currentAmount || 0);

    return (
        <div className={`friend-card ${isLoss ? "loss" : isZero ? "settled" : "gain"}`}>
            <div className="friend-card-header">
                <div className="friend-info-left">
                    <div className="friend-avatar-badge">{initial}</div>
                    <div className="friend-details-group">
                        <h3 className="friend-name-title">{friend.name}</h3>
                    </div>
                </div>

                <div className="friend-balance-badge">
                    <span className="balance-label">
                        {isLoss ? "You Owe" : isZero ? "Settled" : "You Will Get"}
                    </span>
                    <span className="balance-amount-text">
                        {isLoss ? "-" : isZero ? "" : "+"}₹{currentAmount.toLocaleString("en-IN")}
                    </span>
                </div>
            </div>

            <div className="card-actions-toolbar">
                <div className="card-primary-actions-row">
                    <button
                        className="action-btn primary-add"
                        onClick={() => onAddAmount(friend)}
                        title="Add or update amount"
                    >
                        + Add
                    </button>
                    {!isLoss && !isZero && (
                        <button
                            className="action-btn remind-btn"
                            onClick={() => onRemind(friend)}
                            title="Send WhatsApp payment reminder"
                        >
                            Remind
                        </button>
                    )}
                    {!isZero && (
                        <button
                            className="action-btn settle-up"
                            onClick={() => onSettle(friend)}
                            title="Mark balance as settled"
                        >
                            Settle
                        </button>
                    )}
                </div>

                <div className="action-icons-group">
                    {/* Edit Pencil SVG */}
                    <button
                        className="action-btn-icon"
                        onClick={() => onEdit(friend)}
                        title="Edit Details"
                        aria-label="Edit"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>

                    {/* Official PDF Statement SVG */}
                    <button
                        className="action-btn-icon"
                        onClick={() => onPDFStatement && onPDFStatement(friend)}
                        title="PDF Statement & WhatsApp"
                        aria-label="PDF Statement"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </button>

                    {/* History / Clock SVG */}
                    <button
                        className="action-btn-icon"
                        onClick={() => onHistory(friend)}
                        title="History"
                        aria-label="History"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </button>

                    {/* Delete / Trash SVG */}
                    <button
                        className="action-btn-icon btn-danger"
                        onClick={() => onDelete(friend)}
                        title="Delete Friend"
                        aria-label="Delete"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
