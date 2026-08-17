const mongoose = require("mongoose");

/* ===============================
   TRANSACTION HISTORY SCHEMA
================================ */
const historySchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true
        },
        // transaction | settlement | payment
        type: {
            type: String,
            enum: ["transaction", "settlement", "payment"],
            default: "transaction"
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
);

/* ===============================
   FRIEND SCHEMA
================================ */
const friendSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        mobile: {
            type: String,
            trim: true,
            default: ""
        },
        upiId: {
            type: String,
            trim: true,
            default: ""
        },
        upiApp: {
            type: String,
            trim: true,
            default: "Google Pay"
        },
        qrCode: {
            type: String,
            default: ""
        },
        qrRequestStatus: {
            type: String,
            enum: ["not_requested", "pending", "uploaded"],
            default: "not_requested"
        },
        qrRequestedAt: {
            type: Date,
            default: null
        },
        currentAmount: {
            type: Number,
            default: 0
        },
        history: {
            type: [historySchema],
            default: []
        }
    },
    { timestamps: true }
);

// Fast lookup of friends per user
friendSchema.index({ user: 1 });

// Prevent duplicate friend names PER USER
friendSchema.index(
    { user: 1, name: 1 },
    { unique: true }
);

module.exports = mongoose.model("Friend", friendSchema);
