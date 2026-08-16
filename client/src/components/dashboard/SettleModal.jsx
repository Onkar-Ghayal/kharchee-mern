export default function SettleModal({ open, onClose, onConfirm }) {
    if (!open) return null;

    return (
        <div className="modal settle-modal" style={{ display: "flex" }}>
            <div className="modal-content settle-content">
                <h3>Settle Balance</h3>

                <p className="settle-text">
                    Are you sure you want to settle this balance?<br />
                    This will reset the amount to <strong>₹0</strong>.
                </p>

                <div className="modal-actions">
                    <button className="btn-cancel settle-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-submit settle-confirm" onClick={onConfirm}>Confirm Settlement</button>
                </div>
            </div>
        </div>
    );
}
