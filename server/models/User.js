const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        mobile: {
            type: String,
            trim: true,
            default: ""
        },
        password: {
            type: String,
            required: function () {
                return this.authProvider === "local";
            }
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true
        },
        avatar: {
            type: String,
            default: ""
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        otp: {
            type: String,
            default: null
        },
        otpExpires: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
