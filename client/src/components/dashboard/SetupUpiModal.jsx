import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const UPI_APPS = [
    { id: "googlepay", name: "Google Pay", icon: "🌐" },
    { id: "phonepe", name: "PhonePe", icon: "🟣" },
    { id: "paytm", name: "Paytm", icon: "🔷" },
    { id: "bhim", name: "BHIM UPI", icon: "🇮🇳" },
    { id: "other", name: "Other UPI", icon: "💳" }
];

export default function SetupUpiModal({
    open,
    friend,
    onClose,
    onSuccess
}) {
    const { showToast } = useToast();
    const [upiId, setUpiId] = useState("");
    const [upiApp, setUpiApp] = useState("googlepay");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && friend) {
            setUpiId(friend.upiId || "");
            setUpiApp(friend.upiApp || "googlepay");
            setError("");
            setLoading(false);
        }
    }, [open, friend]);

    if (!open || !friend) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const cleanUpi = upiId.trim();
        if (!cleanUpi) {
            setError("Please enter your friend's UPI ID");
            return;
        }

        if (!cleanUpi.includes("@") && !/^\d{10}$/.test(cleanUpi)) {
            setError("Please enter a valid UPI ID (e.g., name@okhdfcbank or 10-digit mobile)");
            return;
        }

        const finalUpi = cleanUpi.includes("@") ? cleanUpi : `${cleanUpi}@upi`;

        setLoading(true);
        try {
            const res = await api.put(`/friends/${friend._id}`, {
                name: friend.name,
                mobile: friend.mobile,
                upiId: finalUpi,
                upiApp: upiApp
            });

            showToast(`UPI ID updated for ${friend.name}!`, "success");
            const updated = res.data.friend || { ...friend, upiId: finalUpi, upiApp };
            onSuccess(updated);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update UPI ID. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content setup-upi-modal-content">
                <div className="setup-upi-header">
                    <div className="setup-upi-icon-badge">💳</div>
                    <div>
                        <h3 className="setup-upi-title">Add UPI ID & Platform</h3>
                        <p className="setup-upi-sub">
                            Add payment details for <strong>{friend.name}</strong> to enable instant 1-tap Google Pay / PhonePe payments.
                        </p>
                    </div>
                </div>

                {error && <div className="auth-error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="setup-upi-form">
                    <div className="form-group">
                        <label className="form-label">
                            Friend's UPI ID
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. rahul@okaxis, 9876543210@paytm, amit@ybl"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="form-input"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Preferred Payment Platform</label>
                        <div className="upi-app-grid">
                            {UPI_APPS.map((app) => (
                                <button
                                    key={app.id}
                                    type="button"
                                    className={`upi-app-select-btn ${upiApp === app.id ? "active" : ""}`}
                                    onClick={() => setUpiApp(app.id)}
                                >
                                    <span className="upi-app-icon">{app.icon}</span>
                                    <span className="upi-app-name">{app.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions-toolbar">
                        <button
                            type="button"
                            className="btn-modal-cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-modal-primary-pay"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save & Continue to Pay ➡️"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
