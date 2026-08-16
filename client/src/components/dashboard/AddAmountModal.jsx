import { useEffect, useState } from "react";

export default function AddAmountModal({
    open,
    friend,
    initialAmount = "",
    initialType = "gain",
    initialDescription = "",
    onClose,
    onSubmit
}) {
    const [value, setValue] = useState("");
    const [type, setType] = useState("gain");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setValue(initialAmount !== "" && initialAmount !== undefined ? String(initialAmount) : "");
            setType(initialType || "gain");
            setDescription(initialDescription || "");
            setError("");
        }
    }, [open, initialAmount, initialType, initialDescription]);

    if (!open) return null;

    const handleConfirm = () => {
        setError("");

        if (!value) {
            setError("Please enter an amount");
            return;
        }

        const numAmount = Number(value);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid amount greater than 0");
            return;
        }

        if (!type) {
            setError("Please select transaction type");
            return;
        }

        const signedAmount = type === "loss" ? -Math.abs(numAmount) : Math.abs(numAmount);
        onSubmit({ amount: signedAmount, description: description.trim() });
    };

    return (
        <div className="modal add-amount-modal" style={{ display: "flex" }}>
            <div className="modal-content add-amount-content">
                <div className="modal-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>Add Amount {friend?.name ? `• ${friend.name}` : ""}</h3>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-tertiary)" }}>
                        ✕
                    </button>
                </div>

                <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input
                        type="number"
                        placeholder="Enter amount"
                        value={value}
                        autoFocus
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Transaction Type *</label>
                    <div className="txn-type-toggle-group">
                        <button
                            type="button"
                            className={`btn-txn-type-choice gain ${type === "gain" ? "active" : ""}`}
                            onClick={() => setType("gain")}
                        >
                            <span className="txn-type-icon">➕</span>
                            <div className="txn-type-text">
                                <strong>You Will Get</strong>
                                <small>You Paid / Lent Money</small>
                            </div>
                        </button>
                        <button
                            type="button"
                            className={`btn-txn-type-choice loss ${type === "loss" ? "active" : ""}`}
                            onClick={() => setType("loss")}
                        >
                            <span className="txn-type-icon">➖</span>
                            <div className="txn-type-text">
                                <strong>You Owe</strong>
                                <small>Friend Paid / Borrowed</small>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Note / Description (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. Dinner share, Chai, Movie, Cab"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="modal-actions">
                    <button className="btn-submit" onClick={handleConfirm}>
                        Add Amount
                    </button>
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
