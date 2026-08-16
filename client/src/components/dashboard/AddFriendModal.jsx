import { useEffect, useState } from "react";

const UPI_APPS = [
    { id: "Google Pay", label: "Google Pay" },
    { id: "PhonePe", label: "PhonePe" },
    { id: "Paytm", label: "Paytm" },
    { id: "BHIM / Other", label: "BHIM / Other" }
];

export default function AddFriendModal({ open, editingFriend, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [upiId, setUpiId] = useState("");
    const [upiApp, setUpiApp] = useState("Google Pay");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        if (editingFriend) {
            setName(editingFriend.name || "");
            setMobile(editingFriend.mobile || "");
            setUpiId(editingFriend.upiId || "");
            setUpiApp(editingFriend.upiApp || "Google Pay");
        } else {
            setName("");
            setMobile("");
            setUpiId("");
            setUpiApp("Google Pay");
        }
        setError("");
    }, [open, editingFriend]);

    if (!open) return null;

    const handleSave = (e) => {
        e.preventDefault();
        setError("");

        const trimmedName = name.trim();
        const trimmedMobile = mobile.trim();
        const trimmedUpi = upiId.trim();

        if (!trimmedName) {
            setError("Please enter your friend's name");
            return;
        }

        if (!trimmedMobile) {
            setError("WhatsApp / Mobile number is compulsory");
            return;
        }

        if (!/^[0-9]{10}$/.test(trimmedMobile)) {
            setError("Please enter a valid 10-digit mobile number (e.g. 9876543210)");
            return;
        }

        if (trimmedUpi && !trimmedUpi.includes("@")) {
            setError("Please enter a valid UPI ID (e.g. rahul@okhdfcbank or 9876543210@ybl)");
            return;
        }

        onSubmit({
            name: trimmedName,
            mobile: trimmedMobile,
            upiId: trimmedUpi,
            upiApp
        });
    };

    return (
        <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content add-friend-modal-content">
                <div className="modal-header-row">
                    <h3>{editingFriend ? "Edit Friend Details" : "Add New Friend"}</h3>
                    <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    {/* 1. Friend Name (Compulsory) */}
                    <div className="form-group">
                        <label>Friend Name <span className="required-star">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter friend name (e.g. Rahul Sharma)"
                            value={name}
                            required
                            autoFocus
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* 2. WhatsApp / Mobile Number (Compulsory) */}
                    <div className="form-group">
                        <label>WhatsApp / Mobile Number <span className="required-star">*</span></label>
                        <div className="phone-input-wrap">
                            <span className="country-code-prefix">+91</span>
                            <input
                                type="tel"
                                placeholder="10-digit mobile number (e.g. 9876543210)"
                                value={mobile}
                                maxLength={10}
                                required
                                onChange={(e) => setMobile(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 3. UPI ID (Optional) */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label>UPI ID <span className="optional-tag">(Optional)</span></label>
                        </div>
                        <input
                            type="text"
                            placeholder="e.g. rahul@okhdfcbank or 9876543210@ybl"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                        />
                    </div>

                    {/* 4. Select App Platform */}
                    <div className="form-group">
                        <label>UPI Platform / App <span className="optional-tag">(Optional)</span></label>
                        <div className="upi-app-selector-grid">
                            {UPI_APPS.map((app) => (
                                <button
                                    key={app.id}
                                    type="button"
                                    className={`upi-app-choice-btn ${upiApp === app.id ? "active" : ""}`}
                                    onClick={() => setUpiApp(app.id)}
                                >
                                    <span>{app.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Direct Note */}
                        <div className="upi-direct-note-banner">
                            <p>
                                <strong>Note:</strong> Enter your friend's UPI ID if you want to pay them directly from Kharchee via Google Pay / PhonePe.
                            </p>
                        </div>
                    </div>

                    <p className="modal-info-note">
                        Starting balance will automatically be set to <strong>₹0</strong>.
                    </p>

                    {error && <p className="form-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="submit" className="btn-submit">
                            {editingFriend ? "Save Changes" : "+ Add Friend"}
                        </button>
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
