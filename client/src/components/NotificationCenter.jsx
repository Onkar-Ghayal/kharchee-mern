import { useState, useEffect, useMemo } from "react";

// Notification Expiry Window: 48 Hours (2 Days)
const EXPIRY_WINDOW_MS = 48 * 60 * 60 * 1000;

export default function NotificationCenter({
    friends = []
}) {
    const [open, setOpen] = useState(false);

    // Persisted Read State
    const [readIds, setReadIds] = useState(() => {
        try {
            const saved = localStorage.getItem("kharchee_read_notifs");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Persisted Dismissed (Vanished) IDs
    const [dismissedIds, setDismissedIds] = useState(() => {
        try {
            const saved = localStorage.getItem("kharchee_dismissed_notifs");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("kharchee_read_notifs", JSON.stringify(readIds));
        } catch (e) {
            console.error("Error persisting read notifications:", e);
        }
    }, [readIds]);

    useEffect(() => {
        try {
            localStorage.setItem("kharchee_dismissed_notifs", JSON.stringify(dismissedIds));
        } catch (e) {
            console.error("Error persisting dismissed notifications:", e);
        }
    }, [dismissedIds]);

    // Generate notifications strictly for:
    // 1. New Friend Added (within 48h)
    // 2. Money Settle (within 48h)
    // 3. Payment Made / Pay (within 48h)
    // 4. Monthly Achievement
    // 5. Yearly Achievement
    const notifications = useMemo(() => {
        const list = [];
        if (!Array.isArray(friends)) return list;

        try {
            const now = Date.now();
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().toLocaleDateString("en-IN", { month: "long" });

            friends.forEach((friend) => {
                if (!friend || typeof friend !== "object") return;
                const friendId = friend._id || friend.id || "";
                const friendName = friend.name || "Friend";
                const friendCreatedTime = new Date(friend.createdAt || friend.updatedAt || Date.now()).getTime();

                // ----------------------------------------------------
                // 1. NEW FRIEND ADDED (Within 48h)
                // ----------------------------------------------------
                if (friendId && (now - friendCreatedTime) <= EXPIRY_WINDOW_MS) {
                    const id = `new_friend_${friendId}`;
                    if (!dismissedIds.includes(id)) {
                        list.push({
                            id,
                            type: "new_friend",
                            createdAt: friendCreatedTime,
                            title: "New Friend Added",
                            message: `Added ${friendName} to your ledger with starting balance ₹0.`,
                            time: formatRelativeTime(friendCreatedTime)
                        });
                    }
                }

                // Inspect history for Settle and Payment events
                if (Array.isArray(friend.history)) {
                    friend.history.forEach((item, index) => {
                        if (!item) return;
                        const itemTime = new Date(item.date || Date.now()).getTime();
                        const isRecent = (now - itemTime) <= EXPIRY_WINDOW_MS;
                        const itemAmount = Math.abs(Number(item.amount) || 0);

                        // ----------------------------------------------------
                        // 2. MONEY SETTLE (Within 48h)
                        // ----------------------------------------------------
                        if (
                            isRecent &&
                            (item.type === "settlement" ||
                                (typeof item.description === "string" && item.description.toLowerCase().includes("settle")))
                        ) {
                            const id = `settle_${friendId}_${item._id || index}_${itemTime}`;
                            if (!dismissedIds.includes(id)) {
                                list.push({
                                    id,
                                    type: "settle",
                                    createdAt: itemTime,
                                    title: "Balance Settled",
                                    message: `Balance with ${friendName} was successfully settled and cleared (₹0).`,
                                    time: formatRelativeTime(itemTime)
                                });
                            }
                        }

                        // ----------------------------------------------------
                        // 3. PAYMENT MADE / PAY (Within 48h)
                        // ----------------------------------------------------
                        if (isRecent && item.type === "payment") {
                            const id = `payment_${friendId}_${item._id || index}_${itemTime}`;
                            if (!dismissedIds.includes(id)) {
                                list.push({
                                    id,
                                    type: "payment",
                                    createdAt: itemTime,
                                    title: "Payment Recorded",
                                    message: `Recorded payment of ₹${itemAmount.toLocaleString("en-IN")} with ${friendName}.`,
                                    time: formatRelativeTime(itemTime)
                                });
                            }
                        }
                    });
                }
            });

            // Sort latest first
            list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (err) {
            console.error("Notification calculation error:", err);
        }

        return list;
    }, [friends, dismissedIds]);

    const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

    const markAllAsRead = () => {
        const allIds = notifications.map((n) => n.id);
        setReadIds(allIds);
    };

    const handleDismissSingle = (id, e) => {
        e.stopPropagation();
        setDismissedIds((prev) => [...prev, id]);
    };

    const handleItemClick = (id) => {
        if (!readIds.includes(id)) {
            setReadIds((prev) => [...prev, id]);
        }
    };

    return (
        <div className="notification-center-wrap">
            {/* Bell Icon Button with Red Badge */}
            <button
                type="button"
                className={`btn-notification-bell ${open ? "active" : ""}`}
                onClick={() => setOpen((prev) => !prev)}
                title="Notifications"
                aria-label="Notifications"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>

                {/* Bright Red Unread Badge */}
                {unreadCount > 0 && (
                    <span className="notification-badge-count red-badge">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Drawer / Dropdown Panel */}
            {open && (
                <>
                    <div className="notif-backdrop" onClick={() => setOpen(false)} />
                    <div className="notification-panel">
                        {/* Panel Header */}
                        <div className="notif-panel-header">
                            <div className="notif-header-title-row">
                                <div className="notif-title-group">
                                    <h4>Notifications</h4>
                                    {unreadCount > 0 && (
                                        <span className="notif-unread-pill red-pill">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </div>
                                <div className="notif-header-actions-group">
                                    <button
                                        type="button"
                                        className="btn-mark-all-read"
                                        onClick={markAllAsRead}
                                        disabled={unreadCount === 0}
                                    >
                                        Mark all read
                                    </button>
                                    <button
                                        type="button"
                                        className="notif-btn-close"
                                        onClick={() => setOpen(false)}
                                        aria-label="Close"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications Single List */}
                        <div className="notif-items-list">
                            {notifications.length === 0 ? (
                                <div className="notif-empty-state">
                                    <div className="empty-bell-icon">🔔</div>
                                    <p className="empty-title">All caught up!</p>
                                    <p className="empty-sub">No recent notifications right now.</p>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    const isRead = readIds.includes(n.id);
                                    return (
                                        <div
                                            key={n.id}
                                            className={`notif-card-item ${isRead ? "read" : "unread"} ${n.type}`}
                                            onClick={() => handleItemClick(n.id)}
                                        >
                                            <div className="notif-icon-col">
                                                {n.type === "new_friend" && (
                                                    <div className="notif-type-icon blue">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="8.5" cy="7.5" r="4"></circle>
                                                            <line x1="20" y1="8" x2="20" y2="14"></line>
                                                            <line x1="23" y1="11" x2="17" y2="11"></line>
                                                        </svg>
                                                    </div>
                                                )}
                                                {n.type === "settle" && (
                                                    <div className="notif-type-icon green">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </div>
                                                )}
                                                {n.type === "payment" && (
                                                    <div className="notif-type-icon purple">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                                            <line x1="1" y1="10" x2="23" y2="10"></line>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="notif-content-col">
                                                <div className="notif-meta-header">
                                                    <span className="notif-card-title">{n.title}</span>
                                                    <div className="notif-top-right-group">
                                                        <span className="notif-card-time">{n.time}</span>
                                                        <button
                                                            type="button"
                                                            className="btn-dismiss-notif"
                                                            title="Dismiss notification"
                                                            onClick={(e) => handleDismissSingle(n.id, e)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="notif-card-msg">{n.message}</p>
                                            </div>

                                            {!isRead && <span className="notif-unread-dot red-dot" />}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function formatRelativeTime(timestamp) {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return "1d ago";
}
