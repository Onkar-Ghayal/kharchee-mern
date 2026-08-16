const Friend = require("../models/Friend");

/* ==========================================================================
   1. ADD FRIEND (Name & Mobile/UPI ID - default balance 0)
   ========================================================================== */
exports.addFriend = async (req, res) => {
    try {
        const { name, mobile, upiId, upiApp } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Friend name is required" });
        }

        if (!mobile || !mobile.trim()) {
            return res.status(400).json({ message: "WhatsApp/Mobile number is required" });
        }

        const friend = await Friend.create({
            user: req.user._id,
            name: name.trim(),
            mobile: mobile.trim(),
            upiId: upiId ? upiId.trim() : "",
            upiApp: upiApp ? upiApp.trim() : "Google Pay",
            currentAmount: 0,
            history: []
        });

        res.status(201).json(friend);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A friend with this name already exists" });
        }
        console.error("Add friend error:", error);
        res.status(500).json({ message: "Server error creating friend" });
    }
};

/* ==========================================================================
   2. GET ALL FRIENDS (User Scoped)
   ========================================================================== */
exports.getFriends = async (req, res) => {
    try {
        const friends = await Friend.find({ user: req.user._id }).sort({ updatedAt: -1 });
        res.json(friends);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching friends" });
    }
};

/* ==========================================================================
   3. EDIT FRIEND DETAILS (Name, Mobile, UPI ID, UPI App)
   ========================================================================== */
exports.updateFriend = async (req, res) => {
    try {
        const { name, mobile, upiId, upiApp } = req.body;
        const friend = await Friend.findOne({ _id: req.params.id, user: req.user._id });

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        if (name && name.trim()) friend.name = name.trim();
        if (typeof mobile !== "undefined") friend.mobile = mobile.trim();
        if (typeof upiId !== "undefined") friend.upiId = upiId.trim();
        if (typeof upiApp !== "undefined") friend.upiApp = upiApp.trim();

        await friend.save();
        res.json(friend);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "A friend with this name already exists" });
        }
        res.status(500).json({ message: "Server error updating friend details" });
    }
};

/* ==========================================================================
   4. UPDATE AMOUNT (Add or Replace)
   ========================================================================== */
exports.updateAmount = async (req, res) => {
    try {
        const { amount, description, mode } = req.body;

        if (typeof amount !== "number") {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const friend = await Friend.findOne({ _id: req.params.id, user: req.user._id });

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        let historyAmount;

        if (mode === "replace") {
            historyAmount = amount - friend.currentAmount;
            friend.currentAmount = amount;
        } else {
            historyAmount = amount;
            friend.currentAmount += amount;
        }

        friend.history.unshift({
            amount: historyAmount,
            type: "transaction",
            description: description?.trim() || ""
        });

        await friend.save();
        res.json(friend);
    } catch (error) {
        res.status(500).json({ message: "Server error updating amount" });
    }
};

/* ==========================================================================
   5. RECORD UPI PAYMENT
   ========================================================================== */
exports.recordPayment = async (req, res) => {
    try {
        const { amount, description, upiApp } = req.body;
        const numAmount = Number(amount);

        if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ message: "Please enter a valid payment amount greater than 0" });
        }

        const friend = await Friend.findOne({ _id: req.params.id, user: req.user._id });

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        // When you pay a friend ₹X, it increases your given balance / offsets debt
        friend.currentAmount += numAmount;

        const note = description?.trim()
            ? `${description.trim()} (Paid via ${upiApp || "UPI"})`
            : `Paid via ${upiApp || "UPI (GPay/PhonePe)"}`;

        friend.history.unshift({
            amount: numAmount,
            type: "payment",
            description: note,
            date: new Date()
        });

        await friend.save();
        res.json({ message: "Payment recorded successfully", friend });
    } catch (error) {
        console.error("Record payment error:", error);
        res.status(500).json({ message: "Server error recording payment" });
    }
};

/* ==========================================================================
   6. CLEAR FRIEND HISTORY
   ========================================================================== */
exports.clearHistory = async (req, res) => {
    try {
        const friend = await Friend.findOne({ _id: req.params.id, user: req.user._id });

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        friend.history = [];
        await friend.save();

        res.json({ message: "History cleared successfully", friend });
    } catch (error) {
        res.status(500).json({ message: "Server error clearing history" });
    }
};

/* ==========================================================================
   7. DELETE SINGLE TRANSACTION & REVERSE BALANCE
   ========================================================================== */
exports.deleteTransaction = async (req, res) => {
    try {
        const { id, transactionId } = req.params;
        const friend = await Friend.findOne({ _id: id, user: req.user._id });

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        let txnIndex = -1;
        if (transactionId.startsWith("idx_")) {
            txnIndex = parseInt(transactionId.replace("idx_", ""), 10);
        } else {
            txnIndex = friend.history.findIndex(
                (h) => h._id && h._id.toString() === transactionId
            );
        }

        if (txnIndex === -1 && !isNaN(Number(transactionId))) {
            txnIndex = Number(transactionId);
        }

        if (txnIndex < 0 || txnIndex >= friend.history.length) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const txnToDelete = friend.history[txnIndex];

        // Reverse the transaction's effect on currentAmount
        friend.currentAmount -= txnToDelete.amount;

        // Remove from history
        friend.history.splice(txnIndex, 1);

        await friend.save();
        res.json({ message: "Transaction deleted & balance corrected", friend });
    } catch (error) {
        console.error("Delete transaction error:", error);
        res.status(500).json({ message: "Server error deleting transaction" });
    }
};

/* ==========================================================================
   7. SETTLE FRIEND
   ========================================================================== */
exports.settleFriend = async (req, res) => {
    try {
        const friend = await Friend.findOne({ _id: req.params.id, user: req.user._id });

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        if (friend.currentAmount === 0) {
            return res.status(400).json({ message: "Already settled" });
        }

        const settlementAmount = -friend.currentAmount;

        friend.history.unshift({
            amount: settlementAmount,
            type: "settlement",
            description: "Settlement completed"
        });

        friend.currentAmount = 0;
        await friend.save();

        res.json({ message: "Settlement successful", friend });
    } catch (error) {
        res.status(500).json({ message: "Server error settling balance" });
    }
};

/* ==========================================================================
   8. DELETE FRIEND
   ========================================================================== */
exports.deleteFriend = async (req, res) => {
    try {
        const friend = await Friend.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        res.json({ message: "Friend deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error deleting friend" });
    }
};

/* ==========================================================================
   9. SPLIT GROUP BILL (Equal or Custom / Unequal Amounts)
   ========================================================================== */
exports.splitBill = async (req, res) => {
    try {
        const {
            totalAmount,
            description,
            friendIds,
            includeSelf = true,
            payer = "self",
            splitMode = "equal",
            customShares = {}
        } = req.body;

        const numTotal = Number(totalAmount);

        if (!numTotal || isNaN(numTotal) || numTotal <= 0) {
            return res.status(400).json({ message: "Please enter a valid total bill amount" });
        }

        if (!Array.isArray(friendIds) || friendIds.length === 0) {
            return res.status(400).json({ message: "Please select at least one friend to split with" });
        }

        const friends = await Friend.find({ _id: { $in: friendIds }, user: req.user._id });
        if (!friends.length) {
            return res.status(404).json({ message: "Selected friends not found" });
        }

        const billTitle = description?.trim() || "Group Bill Split";
        const totalParticipants = includeSelf ? friends.length + 1 : friends.length;
        const equalPerPersonShare = Math.round((numTotal / totalParticipants) * 100) / 100;

        const updatedFriends = [];

        for (const friend of friends) {
            let friendShare = 0;

            if (splitMode === "custom") {
                friendShare = Number(customShares[friend._id]) || 0;
            } else {
                friendShare = equalPerPersonShare;
            }

            if (friendShare <= 0) continue; // Skip friends with 0 share

            const historyNote = splitMode === "custom"
                ? `${billTitle} (Custom share: ₹${friendShare.toLocaleString("en-IN")})`
                : `${billTitle} (₹${numTotal.toLocaleString("en-IN")} split among ${totalParticipants} people)`;

            if (payer === "friend_paid") {
                friend.currentAmount -= friendShare;
            } else {
                friend.currentAmount += friendShare;
            }

            friend.history.unshift({
                amount: payer === "friend_paid" ? -friendShare : friendShare,
                type: "transaction",
                description: historyNote,
                date: new Date()
            });

            await friend.save();
            updatedFriends.push(friend);
        }

        res.json({
            message: `Bill of ₹${numTotal.toLocaleString("en-IN")} split successfully across ${updatedFriends.length} friends!`,
            updatedCount: updatedFriends.length
        });
    } catch (error) {
        console.error("Split bill error:", error);
        res.status(500).json({ message: "Server error splitting group bill" });
    }
};
