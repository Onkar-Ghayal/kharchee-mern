import { useEffect, useMemo, useState, useRef } from "react";
import Header from "../components/Header";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

import FriendCard from "../components/dashboard/FriendCard";
import AddFriendModal from "../components/dashboard/AddFriendModal";
import AddAmountModal from "../components/dashboard/AddAmountModal";
import CalculatorModal from "../components/dashboard/CalculatorModal";
import HistoryModal from "../components/dashboard/HistoryModal";
import DeleteModal from "../components/dashboard/DeleteModal";
import SettleModal from "../components/dashboard/SettleModal";
import WhatsAppReminderModal from "../components/dashboard/WhatsAppReminderModal";
import OnboardingTourModal from "../components/dashboard/OnboardingTourModal";
import SplitBillModal from "../components/dashboard/SplitBillModal";
import ReceiptCardModal from "../components/dashboard/ReceiptCardModal";

import "../styles/dashboard.css";
import "../styles/auth.css";

function useAnimatedValue(target) {
    const [display, setDisplay] = useState(0);
    const prevRef = useRef(0);

    useEffect(() => {
        const start = prevRef.current;
        const end = target;
        const duration = 600;
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            setDisplay(current);
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
        prevRef.current = end;
    }, [target]);

    return display;
}

export default function Dashboard() {
    const { showToast } = useToast();
    const { user } = useAuth();

    const [allFriends, setAllFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("recent");
    const [filter, setFilter] = useState("all");

    // Modal state
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingFriend, setEditingFriend] = useState(null);

    const [addAmountModalOpen, setAddAmountModalOpen] = useState(false);
    const [pendingPayFriend, setPendingPayFriend] = useState(null);

    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [presetAmount, setPresetAmount] = useState("");
    const [presetType, setPresetType] = useState("gain");
    const [presetDescription, setPresetDescription] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [settleOpen, setSettleOpen] = useState(false);
    const [reminderOpen, setReminderOpen] = useState(false);
    const [tourOpen, setTourOpen] = useState(false);
    const [splitBillOpen, setSplitBillOpen] = useState(false);
    const [receiptCardOpen, setReceiptCardOpen] = useState(false);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const filterMenuRef = useRef(null);

    const [activeFriend, setActiveFriend] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const res = await api.get("/friends");
            if (Array.isArray(res.data)) {
                setAllFriends(res.data);
            } else if (res.data && Array.isArray(res.data.friends)) {
                setAllFriends(res.data.friends);
            } else {
                setAllFriends([]);
            }
        } catch {
            showToast("Failed to load dashboard", "error");
            setAllFriends([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // First-Time User Onboarding Tour Auto-Trigger (Strictly 1-time only)
    useEffect(() => {
        const userId = user?.id || user?._id || user?.email;
        if (userId) {
            const tourKey = `kharchee_tour_seen_${userId}`;
            const hasSeenTour = localStorage.getItem(tourKey);
            if (!hasSeenTour) {
                const timer = setTimeout(() => {
                    setTourOpen(true);
                }, 400);
                return () => clearTimeout(timer);
            }
        }
    }, [user]);

    const handleCloseTour = () => {
        const userId = user?.id || user?._id || user?.email;
        if (userId) {
            localStorage.setItem(`kharchee_tour_seen_${userId}`, "true");
        }
        setTourOpen(false);
    };

    // Close Filter Menu on Outside Click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
                setFilterMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isFilterActive = filter !== "all" || sort !== "recent";

    /* ================= SEARCH + SORT + FILTER ================= */
    const filteredFriends = useMemo(() => {
        if (!Array.isArray(allFriends)) return [];
        let list = allFriends.filter(Boolean);

        const query = search.toLowerCase().trim();
        if (query) {
            list = list.filter((f) => f.name.toLowerCase().includes(query));
        }

        if (filter === "gain") list = list.filter((f) => f.currentAmount > 0);
        else if (filter === "loss") list = list.filter((f) => f.currentAmount < 0);

        if (sort === "name") {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === "amount") {
            list.sort((a, b) => b.currentAmount - a.currentAmount);
        } else {
            list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        return list;
    }, [allFriends, search, sort, filter]);

    /* ================= BALANCE SUMMARY ================= */
    const { totalGiven, totalTaken, netBalance } = useMemo(() => {
        let given = 0;
        let taken = 0;
        if (Array.isArray(filteredFriends)) {
            filteredFriends.forEach((f) => {
                if (!f) return;
                const amount = Number(f.currentAmount) || 0;
                if (amount > 0) given += amount;
                else taken += Math.abs(amount);
            });
        }
        return { totalGiven: given, totalTaken: taken, netBalance: given - taken };
    }, [filteredFriends]);

    const animatedGiven = useAnimatedValue(totalGiven);
    const animatedTaken = useAnimatedValue(totalTaken);
    const animatedNet = useAnimatedValue(netBalance);

    /* ================= API HELPERS ================= */
    const updateAmount = async (id, amount, description = "", mode = "add") => {
        await api.put(`/friends/${id}/amount`, { amount, description, mode });
    };

    /* ================= ADD / EDIT FRIEND ================= */
    const openAddModal = () => {
        setEditingFriend(null);
        setAddModalOpen(true);
    };

    const openEditModal = (friend) => {
        setEditingFriend(friend);
        setAddModalOpen(true);
    };

    const handleAddFriendSubmit = async ({ name, mobile }) => {
        try {
            if (!editingFriend) {
                await api.post("/friends", {
                    name,
                    mobile
                });
                showToast("Friend added successfully with ₹0 balance", "success");
            } else {
                await api.put(`/friends/${editingFriend._id}`, {
                    name,
                    mobile
                });
                showToast("Friend details updated", "info");
            }
            setAddModalOpen(false);
            fetchFriends();
        } catch (err) {
            showToast(err.response?.data?.message || "Something went wrong", "error");
        }
    };

    /* ================= ADD AMOUNT (manual ledger entry) ================= */
    const openAddAmountModal = (friend) => {
        setActiveFriend(friend);
        setPresetAmount("");
        setPresetType("gain");
        setPresetDescription("");
        setAddAmountModalOpen(true);
    };

    const handleAddAmountSubmit = async ({ amount, description }) => {
        try {
            await updateAmount(activeFriend._id, amount, description, "add");
            showToast("Amount updated", "info");
            setAddAmountModalOpen(false);
            setPresetAmount("");
            setPresetDescription("");
            fetchFriends();
        } catch {
            showToast("Failed to add amount", "error");
        }
    };

    /* ================= CALCULATOR ================= */
    const openCalculator = (friend) => {
        setActiveFriend(friend);
        setCalculatorOpen(true);
    };

    const handleUseCalculated = (result) => {
        setCalculatorOpen(false);
        const absVal = Math.abs(result);
        setPresetAmount(absVal > 0 ? String(absVal) : "");
        setPresetType(result < 0 ? "loss" : "gain");
        setPresetDescription("");
        setAddAmountModalOpen(true);
    };

    /* ================= HISTORY ================= */
    const openHistory = (friend) => {
        setActiveFriend(friend);
        setHistoryOpen(true);
    };

    const handleClearHistory = async () => {
        if (!activeFriend) return;
        try {
            const res = await api.delete(`/friends/${activeFriend._id}/history`);
            showToast("History cleared", "info");
            setActiveFriend(res.data.friend || { ...activeFriend, history: [] });
            fetchFriends();
        } catch {
            showToast("Failed to clear history", "error");
        }
    };

    const handleDeleteSingleTransaction = async (transactionId, index) => {
        if (!activeFriend) return;
        try {
            const res = await api.delete(`/friends/${activeFriend._id}/history/${transactionId}`);
            showToast("Transaction removed & balance adjusted", "success");
            setActiveFriend(res.data.friend);
            fetchFriends();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to remove transaction", "error");
        }
    };

    /* ================= WHATSAPP REMINDER ================= */
    const openReminderModal = (friend) => {
        setActiveFriend(friend);
        setReminderOpen(true);
    };

    /* ================= VISUAL RECEIPT SLIP ================= */
    const openReceiptCardModal = (friend) => {
        setActiveFriend(friend);
        setReceiptCardOpen(true);
    };

    /* ================= DELETE ================= */
    const openDelete = (friend) => {
        setActiveFriend(friend);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!activeFriend) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/friends/${activeFriend._id}`);
            showToast("Friend deleted", "info");
            setDeleteOpen(false);
            fetchFriends();
        } catch {
            showToast("Failed to delete friend", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    /* ================= SETTLE ================= */
    const openSettle = (friend) => {
        setActiveFriend(friend);
        setSettleOpen(true);
    };

    const handleSettleConfirm = async () => {
        if (!activeFriend) return;
        try {
            await api.put(`/friends/${activeFriend._id}/settle`);
            showToast("Balance settled successfully", "success");
            setSettleOpen(false);
            fetchFriends();
        } catch {
            showToast("Failed to settle balance", "error");
        }
    };

    /* ================= SPLIT GROUP BILL ================= */
    const handleSplitBillSubmit = async ({ totalAmount, description, friendIds, includeSelf, payer }) => {
        try {
            const res = await api.post("/friends/split-bill", {
                totalAmount,
                description,
                friendIds,
                includeSelf,
                payer
            });
            showToast(res.data.message || "Bill split successfully!", "success");
            fetchFriends();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to split bill", "error");
            throw err;
        }
    };

    return (
        <>
            <Header
                variant="dashboard"
                friends={allFriends}
                onRemind={openReminderModal}
            />

            <section className="dashboard">
                {loading && (
                    <div className="dashboard-loading">
                        <div className="loader"></div>
                        <p>Loading your data...</p>
                    </div>
                )}

                <div className="dashboard-header">
                    <h2>Your Friends & Transactions</h2>

                    <div className="dashboard-actions">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search friends by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="button" aria-label="Search">🔍</button>
                        </div>

                        {/* Filter & Sort Popover Trigger */}
                        <div className="filter-dropdown-wrapper" ref={filterMenuRef}>
                            <button
                                type="button"
                                className={`btn-filter-icon-toggle ${isFilterActive ? "active" : ""}`}
                                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                                title="Filter & Sort Friends"
                            >
                                <svg
                                    className="filter-funnel-svg"
                                    viewBox="0 0 24 24"
                                    width="19"
                                    height="19"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>
                                <span className="filter-toggle-label">Filter</span>
                                {isFilterActive && <span className="filter-active-indicator" />}
                            </button>

                            {/* Floating Popover Menu */}
                            {filterMenuOpen && (
                                <div className="filter-popover-menu">
                                    <div className="filter-popover-header">
                                        <span className="popover-title">Filter & Sort</span>
                                        {isFilterActive && (
                                            <button
                                                type="button"
                                                className="btn-clear-filters"
                                                onClick={() => {
                                                    setSort("recent");
                                                    setFilter("all");
                                                }}
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    {/* 1. Status Filter */}
                                    <div className="filter-popover-section">
                                        <label className="section-label">Show Friends</label>
                                        <div className="filter-segmented-chips">
                                            <button
                                                type="button"
                                                className={`filter-seg-btn ${filter === "all" ? "active" : ""}`}
                                                onClick={() => setFilter("all")}
                                            >
                                                All
                                            </button>
                                            <button
                                                type="button"
                                                className={`filter-seg-btn gain ${filter === "gain" ? "active" : ""}`}
                                                onClick={() => setFilter("gain")}
                                            >
                                                🟢 You Will Get
                                            </button>
                                            <button
                                                type="button"
                                                className={`filter-seg-btn loss ${filter === "loss" ? "active" : ""}`}
                                                onClick={() => setFilter("loss")}
                                            >
                                                🔴 You Owe
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Sort Order */}
                                    <div className="filter-popover-section">
                                        <label className="section-label">Sort Order</label>
                                        <div className="filter-segmented-chips">
                                            <button
                                                type="button"
                                                className={`filter-seg-btn ${sort === "recent" ? "active" : ""}`}
                                                onClick={() => setSort("recent")}
                                            >
                                                ⏱️ Recent
                                            </button>
                                            <button
                                                type="button"
                                                className={`filter-seg-btn ${sort === "name" ? "active" : ""}`}
                                                onClick={() => setSort("name")}
                                            >
                                                🔤 Name (A–Z)
                                            </button>
                                            <button
                                                type="button"
                                                className={`filter-seg-btn ${sort === "amount" ? "active" : ""}`}
                                                onClick={() => setSort("amount")}
                                            >
                                                💰 Amount
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {allFriends.length > 0 && (
                            <button className="split-bill-btn" onClick={() => setSplitBillOpen(true)}>
                                ⚡ Split a Bill
                            </button>
                        )}

                        <button className="add-btn" onClick={openAddModal}>
                            + Add Friend
                        </button>
                    </div>
                </div>

                <div className="balance-summary">
                    <div className="summary-card given">
                        <p>You Will Get</p>
                        <h3>₹ {animatedGiven.toLocaleString()}</h3>
                    </div>

                    <div className="summary-card taken">
                        <p>You Owe</p>
                        <h3>₹ {animatedTaken.toLocaleString()}</h3>
                    </div>

                    <div className="summary-card net">
                        <p>Net Balance</p>
                        <h3>₹ {animatedNet.toLocaleString()}</h3>
                    </div>
                </div>

                {!loading && filteredFriends.length === 0 && (
                    <div className="empty-state">
                        <h3>No friends added yet</h3>
                        <p>Click <strong>"+ Add Friend"</strong> to start tracking money with 0 initial balance</p>
                    </div>
                )}

                <div className="friend-list">
                    {filteredFriends.map((friend) => (
                        <FriendCard
                            key={friend._id}
                            friend={friend}
                            onAddAmount={openAddAmountModal}
                            onRemind={openReminderModal}
                            onSettle={openSettle}
                            onCalculate={openCalculator}
                            onEdit={openEditModal}
                            onReceipt={openReceiptCardModal}
                            onHistory={openHistory}
                            onDelete={openDelete}
                        />
                    ))}
                </div>
            </section>

            {/* 1. Add / Edit Friend Modal (Name & Mobile, default 0 balance) */}
            <AddFriendModal
                open={addModalOpen}
                editingFriend={editingFriend}
                onClose={() => setAddModalOpen(false)}
                onSubmit={handleAddFriendSubmit}
            />

            {/* 5. Manual Add Amount Modal */}
            <AddAmountModal
                open={addAmountModalOpen}
                friend={activeFriend}
                initialAmount={presetAmount}
                initialType={presetType}
                initialDescription={presetDescription}
                onClose={() => {
                    setAddAmountModalOpen(false);
                    setPresetAmount("");
                    setPresetDescription("");
                }}
                onSubmit={handleAddAmountSubmit}
            />

            {/* 6. Built-in Calculator Modal */}
            <CalculatorModal
                open={calculatorOpen}
                initialValue={activeFriend?.currentAmount}
                onClose={() => setCalculatorOpen(false)}
                onUse={handleUseCalculated}
            />

            {/* 7. Transaction History Modal */}
            <HistoryModal
                open={historyOpen}
                friend={allFriends.find((f) => f._id === activeFriend?._id) || activeFriend}
                userName={user?.name || "User"}
                onClose={() => setHistoryOpen(false)}
                onClear={handleClearHistory}
                onDeleteTransaction={handleDeleteSingleTransaction}
                onAddExpense={(f) => {
                    setHistoryOpen(false);
                    openAddAmountModal(f);
                }}
            />

            {/* 8. WhatsApp Reminder Modal */}
            <WhatsAppReminderModal
                open={reminderOpen}
                friend={activeFriend}
                userName={user?.name || "Friend"}
                onClose={() => setReminderOpen(false)}
                onOpenReceiptCard={openReceiptCardModal}
            />

            {/* 9. First-Time Guided Onboarding Tour Modal */}
            <OnboardingTourModal
                open={tourOpen}
                onClose={handleCloseTour}
                userName={user?.name || "Friend"}
            />

            {/* 10. Delete Confirmation Modal */}
            <DeleteModal
                open={deleteOpen}
                loading={deleteLoading}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
            />

            {/* 11. Settle Confirmation Modal */}
            <SettleModal
                open={settleOpen}
                onClose={() => setSettleOpen(false)}
                onConfirm={handleSettleConfirm}
            />

            {/* 12. Split Group Bill Modal */}
            <SplitBillModal
                open={splitBillOpen}
                friends={allFriends}
                onClose={() => setSplitBillOpen(false)}
                onSubmit={handleSplitBillSubmit}
            />

            {/* 13. Visual Receipt Slip Modal */}
            <ReceiptCardModal
                open={receiptCardOpen}
                friend={allFriends.find((f) => f._id === activeFriend?._id) || activeFriend}
                userName={user?.name || "User"}
                onClose={() => setReceiptCardOpen(false)}
            />
        </>
    );
}
