import { useEffect, useState } from "react";

export default function AddFriendModal({ open, editingFriend, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        if (editingFriend) {
            setName(editingFriend.name || "");
            setMobile(editingFriend.mobile || "");
        } else {
            setName("");
            setMobile("");
        }
        setError("");
    }, [open, editingFriend]);

    if (!open) return null;

    const handleSave = (e) => {
        e.preventDefault();
        setError("");

        const trimmedName = name.trim();
        const trimmedMobile = mobile.trim();

        if (!trimmedName) {
            setError("Please enter your friend's name");
            return;
        }

        if (!trimmedMobile) {
            setError("WhatsApp Mobile Number is compulsory for reminders");
            return;
        }

        if (!/^[0-9]{10}$/.test(trimmedMobile)) {
            setError("Please enter a valid 10-digit mobile number (e.g. 9876543210)");
            return;
        }

        onSubmit({
            name: trimmedName,
            mobile: trimmedMobile
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

                    {/* 2. WhatsApp Mobile Number (Compulsory) */}
                    <div className="form-group">
                        <label>WhatsApp Mobile Number <span className="required-star">*</span></label>
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
                        <p className="field-subnote">Please enter the correct WhatsApp number of your friend.</p>
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
