const dns = require("dns");
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const app = express();

/* ================= DATABASE ================= */
connectDB();

/* ================= ENV CONFIG ================= */
const PORT = process.env.PORT || 5000;

/* ================= SECURITY & HEADERS ================= */
app.use(
    helmet({
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
    })
);

// General API Rate Limiter (500 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again in a few minutes." }
});
app.use("/api", generalLimiter);

// Strict Auth Rate Limiter (25 attempts per 15 minutes for brute-force defense)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Please try again in 15 minutes." }
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/resend-otp", authLimiter);

app.use(compression());

/* ================= CORS ================= */
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,https://kharchee.vercel.app")
    .split(",")
    .map(origin => origin.trim().replace(/\/$/, ""));

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true
}));

/* ================= MIDDLEWARE ================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
    res.send("Kharchee API is running");
});

app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Server running" });
});

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/friends", require("./routes/friendRoutes"));

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
