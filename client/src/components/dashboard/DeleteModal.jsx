export default function DeleteModal({ open, onClose, onConfirm, loading }) {
    if (!open) return null;

    return (
        <div className="modal delete-modal" style={{ display: "flex" }}>
            <div className="modal-content">
                <h3 className="delete-title">Delete Friend</h3>
                <p className="delete-text">
                    Are you sure you want to delete this friend?<br />
                    This action cannot be undone.
                </p>

                <div className="modal-actions">
                    <button className="btn-cancel delete-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-delete-confirm" disabled={loading} onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>
    );
}
