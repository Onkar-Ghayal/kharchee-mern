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

/* ================= 1. CORS (MUST BE FIRST) ================= */
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,https://kharchee.vercel.app")
    .split(",")
    .map(origin => origin.trim().replace(/\/$/, ""));

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, "");
        if (
            allowedOrigins.includes(normalized) ||
            normalized.endsWith(".vercel.app") ||
            normalized.includes("localhost") ||
            normalized.includes("127.0.0.1") ||
            normalized.endsWith(".onrender.com")
        ) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive fallback
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ================= 2. SECURITY HEADERS & COMPRESSION ================= */
app.use(
    helmet({
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
    })
);

app.use(compression());

/* ================= 3. RATE LIMITING ================= */
// General API Rate Limiter (500 requests per 15 minutes, skipping OPTIONS preflight)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { message: "Too many requests. Please try again in a few minutes." }
});
app.use("/api", generalLimiter);

// Strict Auth Rate Limiter (30 attempts per 15 minutes for brute-force defense)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { message: "Too many authentication attempts. Please try again in 15 minutes." }
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/resend-otp", authLimiter);

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
