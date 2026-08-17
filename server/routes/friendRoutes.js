const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    addFriend,
    getFriends,
    updateFriend,
    updateAmount,
    recordPayment,
    deleteFriend,
    clearHistory,
    deleteTransaction,
    settleFriend,
    splitBill,
    getPublicFriendQr,
    uploadPublicFriendQr,
    updateQrStatus
} = require("../controllers/friendController");

// Public QR endpoints (No JWT required - Friend opens WhatsApp link)
router.get("/public-qr/:id", getPublicFriendQr);
router.post("/public-qr/:id", uploadPublicFriendQr);

// Protected routes (Logged-in user)
router.post("/split-bill", protect, splitBill);
router.post("/", protect, addFriend);
router.get("/", protect, getFriends);
router.put("/:id/qr-status", protect, updateQrStatus);
router.put("/:id", protect, updateFriend);
router.put("/:id/amount", protect, updateAmount);
router.post("/:id/payment", protect, recordPayment);
router.put("/:id/settle", protect, settleFriend);
router.delete("/:id/history/:transactionId", protect, deleteTransaction);
router.delete("/:id/history", protect, clearHistory);
router.delete("/:id", protect, deleteFriend);

module.exports = router;
