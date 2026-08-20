import { useState, useEffect, useMemo } from "react";

export default function SplitBillModal({
    open,
    friends = [],
    onClose,
    onSubmit
}) {
    const [totalAmount, setTotalAmount] = useState("");
    const [description, setDescription] = useState("");
    const [selectedFriendIds, setSelectedFriendIds] = useState([]);
    const [includeSelf, setIncludeSelf] = useState(true);
    const [payer, setPayer] = useState("self"); // "self" | "friend_paid"
    const [splitMode, setSplitMode] = useState("equal"); // "equal" | "custom"
    const [customShares, setCustomShares] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Confirmation Popup State
    const [showConfirm, setShowConfirm] = useState(false);

    // Initialize/reset form when opened (default friends selection: clear/empty)
    useEffect(() => {
        if (open) {
            setTotalAmount("");
            setDescription("");
            setSelectedFriendIds([]);
            setIncludeSelf(true);
            setPayer("self");
            setSplitMode("equal");
            setCustomShares({});
            setSearchQuery("");
            setError("");
            setLoading(false);
            setShowConfirm(false);
        }
    }, [open, friends]);

    const filteredFriends = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return friends;
        return friends.filter(
            (f) =>
                f.name.toLowerCase().includes(query) ||
                (f.mobile && f.mobile.includes(query))
        );
    }, [friends, searchQuery]);

    // Live Calculations
    const numTotal = Number(totalAmount) || 0;
    const selectedCount = selectedFriendIds.length;
    const totalPeople = includeSelf ? selectedCount + 1 : selectedCount;

    // Equal mode share
    const equalPerPersonShare = totalPeople > 0 && numTotal > 0 ? (numTotal / totalPeople).toFixed(2) : "0.00";

    // Custom mode calculations
    const totalCustomAllocated = useMemo(() => {
        return selectedFriendIds.reduce((sum, id) => {
            const val = Number(customShares[id]) || 0;
            return sum + val;
        }, 0);
    }, [selectedFriendIds, customShares]);

    const remainingForSelf = Math.max(0, numTotal - totalCustomAllocated);
    const customDifference = numTotal - totalCustomAllocated;

    // Selected friends list helper for preview
    const selectedFriendsList = useMemo(() => {
        return friends.filter((f) => selectedFriendIds.includes(f._id));
    }, [friends, selectedFriendIds]);

    if (!open) return null;

    const toggleFriend = (id) => {
        setSelectedFriendIds((prev) => {
            const exists = prev.includes(id);
            const next = exists ? prev.filter((item) => item !== id) : [...prev, id];

            if (!exists && splitMode === "custom" && !customShares[id]) {
                setCustomShares((curr) => ({ ...curr, [id]: "" }));
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        setSelectedFriendIds(friends.map((f) => f._id));
    };

    const handleDeselectAll = () => {
        setSelectedFriendIds([]);
    };

    const handleCustomShareChange = (friendId, val) => {
        setCustomShares((prev) => ({
            ...prev,
            [friendId]: val
        }));
    };

    const handleModeSwitch = (mode) => {
        setSplitMode(mode);
        if (mode === "custom") {
            const initial = {};
            const baseShare = totalPeople > 0 && numTotal > 0 ? Math.round(numTotal / totalPeople) : "";
            selectedFriendIds.forEach((id) => {
                initial[id] = customShares[id] !== undefined && customShares[id] !== "" ? customShares[id] : baseShare;
            });
            setCustomShares(initial);
        }
    };

    // Step 1: Validate & Trigger Confirmation Popup
    const handleTriggerConfirm = (e) => {
        e.preventDefault();
        setError("");

        if (!numTotal || numTotal <= 0) {
            setError("Please enter a valid total bill amount");
            return;
        }

        if (selectedCount === 0) {
            setError("Please select at least one friend to split the bill with");
            return;
        }

        if (splitMode === "custom") {
            if (totalCustomAllocated <= 0) {
                setError("Please assign custom amounts to your friends");
                return;
            }

            if (includeSelf) {
                if (totalCustomAllocated > numTotal) {
                    setError(`Total friend amounts (₹${totalCustomAllocated.toLocaleString("en-IN")}) exceed the total bill (₹${numTotal.toLocaleString("en-IN")})`);
                    return;
                }
            } else {
                if (Math.abs(customDifference) > 0.01) {
                    setError(`Total assigned amounts (₹${totalCustomAllocated.toLocaleString("en-IN")}) must equal the full bill (₹${numTotal.toLocaleString("en-IN")})`);
                    return;
                }
            }
        }

        // Open Confirmation Dialog
        setShowConfirm(true);
    };

    // Step 2: Final Confirmed Execution
    const handleFinalExecute = async () => {
        setLoading(true);
        setError("");
        try {
            await onSubmit({
                totalAmount: numTotal,
                description: description.trim() || "Group Bill Split",
                friendIds: selectedFriendIds,
                includeSelf,
                payer,
                splitMode,
                customShares
            });
            setShowConfirm(false);
            onClose();
        } catch (err) {
            setShowConfirm(false);
            setError(err.response?.data?.message || "Failed to split bill. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal" style={{ display: "flex" }}>
            <div className="modal-content split-bill-modal-content">
                {/* Header */}
                <div className="split-bill-header">
                    <div className="split-badge-icon">⚡</div>
                    <div>
                        <h3 className="split-title">Split a Group Bill</h3>
                        <p className="split-subtitle">
                            Split hotels, trips, food or travel expenses among friends in 1 tap.
                        </p>
                    </div>
                    <button type="button" className="btn-close-split" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {error && <div className="auth-error-banner">{error}</div>}

                <form onSubmit={handleTriggerConfirm} className="split-bill-form">
                    {/* 1. Total Amount */}
                    <div className="form-group">
                        <label className="form-label">
                            Total Bill Amount (₹) <span className="text-danger">*</span>
                        </label>
                        <div className="split-amount-input-box">
                            <span className="split-curr-sign">₹</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={totalAmount}
                                min="1"
                                required
                                autoFocus
                                className="split-amount-input"
                                onChange={(e) => setTotalAmount(e.target.value)}
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="split-quick-presets">
                            <button type="button" onClick={() => setTotalAmount("500")}>+₹500</button>
                            <button type="button" onClick={() => setTotalAmount("1000")}>+₹1,000</button>
                            <button type="button" onClick={() => setTotalAmount("2000")}>+₹2,000</button>
                            <button type="button" onClick={() => setTotalAmount("5000")}>+₹5,000</button>
                        </div>
                    </div>

                    {/* 2. Bill Description / Title */}
                    <div className="form-group">
                        <label className="form-label">Expense Reason / Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Goa Hotel Stay, Taj Dinner, Weekend Trip, Fuel & Toll"
                            value={description}
                            maxLength={80}
                            className="form-input"
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* 3. Split Mode Tabs (Equal vs Custom / Unequal Amounts) */}
                    <div className="split-mode-nav-tabs">
                        <button
                            type="button"
                            className={`split-mode-tab-btn ${splitMode === "equal" ? "active" : ""}`}
                            onClick={() => handleModeSwitch("equal")}
                        >
                            ⚖️ Split Equally
                        </button>
                        <button
                            type="button"
                            className={`split-mode-tab-btn ${splitMode === "custom" ? "active" : ""}`}
                            onClick={() => handleModeSwitch("custom")}
                        >
                            ✏️ Custom / Unequal Amounts
                        </button>
                    </div>

                    {/* 4. Include Myself Toggle */}
                    <div className="split-toggle-card">
                        <div className="toggle-label-wrap">
                            <span className="toggle-title">Include Myself in Bill</span>
                            <span className="toggle-caption">
                                {splitMode === "equal"
                                    ? includeSelf
                                        ? `Bill divided by ${totalPeople} people (You + ${selectedCount} friends)`
                                        : `Bill divided only among ${selectedCount} friends`
                                    : includeSelf
                                        ? `Remaining balance (₹${remainingForSelf.toLocaleString("en-IN")}) is your personal share`
                                        : `Friends must cover the exact total of ₹${numTotal.toLocaleString("en-IN")}`}
                            </span>
                        </div>
                        <label className="switch-toggle">
                            <input
                                type="checkbox"
                                checked={includeSelf}
                                onChange={(e) => setIncludeSelf(e.target.checked)}
                            />
                            <span className="slider-toggle"></span>
                        </label>
                    </div>

                    {/* 5. Select Friends & Custom Amounts */}
                    <div className="form-group split-friends-section">
                        <div className="friends-select-header">
                            <label className="form-label">
                                {splitMode === "equal"
                                    ? `Split with (${selectedCount} of ${friends.length} selected)`
                                    : `Enter each friend's share (${selectedCount} selected)`}
                            </label>
                            <div className="select-all-btn-group">
                                <button type="button" className="btn-text-action" onClick={handleSelectAll}>
                                    Select All
                                </button>
                                <span>•</span>
                                <button type="button" className="btn-text-action" onClick={handleDeselectAll}>
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Search friends if > 4 */}
                        {friends.length > 4 && (
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input search-friends-input"
                            />
                        )}

                        {splitMode === "equal" ? (
                            /* Equal Mode Chips with Executive Avatars & Custom Checkmarks */
                            <div className="friends-checkbox-list">
                                {filteredFriends.length === 0 ? (
                                    <p className="no-friends-text">No friends found.</p>
                                ) : (
                                    filteredFriends.map((f) => {
                                        const isSelected = selectedFriendIds.includes(f._id);
                                        const initial = f.name ? f.name.charAt(0).toUpperCase() : "F";
                                        return (
                                            <div
                                                key={f._id}
                                                className={`friend-select-chip ${isSelected ? "selected" : ""}`}
                                                onClick={() => toggleFriend(f._id)}
                                            >
                                                <div className={`friend-chip-check ${isSelected ? "checked" : ""}`}>
                                                    {isSelected && <span>✓</span>}
                                                </div>
                                                <div className="friend-chip-avatar">{initial}</div>
                                                <div className="friend-chip-meta">
                                                    <span className="friend-chip-name">{f.name}</span>
                                                    {f.mobile ? (
                                                        <span className="friend-chip-phone">{f.mobile}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            /* Custom Amounts Itemized Rows with Executive Avatars & Checkmarks */
                            <div className="custom-split-rows-list">
                                {filteredFriends.length === 0 ? (
                                    <p className="no-friends-text">No friends found.</p>
                                ) : (
                                    filteredFriends.map((f) => {
                                        const isSelected = selectedFriendIds.includes(f._id);
                                        const initial = f.name ? f.name.charAt(0).toUpperCase() : "F";
                                        return (
                                            <div
                                                key={f._id}
                                                className={`custom-friend-row ${isSelected ? "active" : "inactive"}`}
                                            >
                                                <div
                                                    className="custom-friend-info"
                                                    onClick={() => toggleFriend(f._id)}
                                                >
                                                    <div className={`friend-chip-check ${isSelected ? "checked" : ""}`}>
                                                        {isSelected && <span>✓</span>}
                                                    </div>
                                                    <div className="friend-chip-avatar">{initial}</div>
                                                    <div className="friend-chip-meta">
                                                        <span className="friend-row-name">{f.name}</span>
                                                        {f.mobile && <span className="friend-row-phone">{f.mobile}</span>}
                                                    </div>
                                                </div>

                                                {isSelected ? (
                                                    <div className="custom-share-input-wrap">
                                                        <span className="custom-curr">₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={customShares[f._id] !== undefined ? customShares[f._id] : ""}
                                                            min="0"
                                                            className="custom-share-input"
                                                            onChange={(e) => handleCustomShareChange(f._id, e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="excluded-tag">Excluded</span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* 6. Live Breakdown Card */}
                    {numTotal > 0 && selectedCount > 0 && (
                        splitMode === "equal" ? (
                            <div className="live-split-breakdown-card">
                                <div className="breakdown-metric">
                                    <span className="metric-label">Total Bill</span>
                                    <span className="metric-val">₹{numTotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="breakdown-divider-line"></div>
                                <div className="breakdown-metric">
                                    <span className="metric-label">Divided By</span>
                                    <span className="metric-val">{totalPeople} {totalPeople === 1 ? "Person" : "People"}</span>
                                </div>
                                <div className="breakdown-divider-line"></div>
                                <div className="breakdown-metric highlight">
                                    <span className="metric-label">Each Friend Owes</span>
                                    <span className="metric-val green-text">₹{Number(equalPerPersonShare).toLocaleString("en-IN")}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="live-split-breakdown-card custom-breakdown">
                                <div className="breakdown-metric">
                                    <span className="metric-label">Total Bill</span>
                                    <span className="metric-val">₹{numTotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="breakdown-divider-line"></div>
                                <div className="breakdown-metric">
                                    <span className="metric-label">Friends Total</span>
                                    <span className="metric-val">₹{totalCustomAllocated.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="breakdown-divider-line"></div>
                                <div className="breakdown-metric highlight">
                                    <span className="metric-label">
                                        {includeSelf ? "Your Share (Left)" : "Unassigned"}
                                    </span>
                                    <span className={`metric-val ${customDifference === 0 || (includeSelf && remainingForSelf >= 0) ? "green-text" : "text-danger"}`}>
                                        ₹{remainingForSelf.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        )
                    )}

                    {/* 7. Action Buttons */}
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
                            className="btn-modal-primary-split"
                            disabled={loading || numTotal <= 0 || selectedCount === 0}
                        >
                            {numTotal > 0 && selectedCount > 0
                                ? `⚡ Split ₹${numTotal.toLocaleString("en-IN")} (${splitMode === "custom" ? "Custom" : `₹${equalPerPersonShare}/each`})`
                                : "⚡ Split Bill"}
                        </button>
                    </div>
                </form>

                {/* ================= CONFIRMATION POPUP OVERLAY ================= */}
                {showConfirm && (
                    <div className="split-confirm-overlay">
                        <div className="split-confirm-card">
                            <div className="split-confirm-icon-wrap">⚡</div>
                            <h3 className="split-confirm-title">Confirm Group Bill Split</h3>
                            <p className="split-confirm-sub">
                                Are you sure you want to split this bill and update ledger balances for <strong>{selectedCount} friends</strong>?
                            </p>

                            <div className="split-confirm-details-box">
                                <div className="confirm-detail-row">
                                    <span className="detail-name">Total Bill Amount</span>
                                    <span className="detail-value">₹{numTotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="confirm-detail-row">
                                    <span className="detail-name">Expense Reason</span>
                                    <span className="detail-value">{description.trim() || "Group Bill Split"}</span>
                                </div>
                                <div className="confirm-detail-row">
                                    <span className="detail-name">Split Mode</span>
                                    <span className="detail-value">{splitMode === "equal" ? "⚖️ Equal Split" : "✏️ Custom / Unequal"}</span>
                                </div>
                                <div className="confirm-detail-row">
                                    <span className="detail-name">Participants</span>
                                    <span className="detail-value">{totalPeople} people {includeSelf ? "(You + Friends)" : "(Friends only)"}</span>
                                </div>

                                <div className="confirm-divider"></div>

                                {splitMode === "equal" ? (
                                    <div className="confirm-detail-row highlight">
                                        <span className="detail-name">Added to Each Friend's Balance</span>
                                        <span className="detail-value green-text">+₹{Number(equalPerPersonShare).toLocaleString("en-IN")}</span>
                                    </div>
                                ) : (
                                    <div className="confirm-itemized-list">
                                        <span className="itemized-title">Individual Breakdown:</span>
                                        {selectedFriendsList.map((f) => (
                                            <div key={f._id} className="itemized-row">
                                                <span>{f.name}</span>
                                                <strong className="green-text">+₹{Number(customShares[f._id] || 0).toLocaleString("en-IN")}</strong>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="split-confirm-actions">
                                <button
                                    type="button"
                                    className="btn-confirm-execute"
                                    onClick={handleFinalExecute}
                                    disabled={loading}
                                >
                                    {loading ? "Splitting..." : "✓ Yes, Confirm & Add to Ledger"}
                                </button>
                                <button
                                    type="button"
                                    className="btn-confirm-back"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={loading}
                                >
                                    Go Back & Edit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
