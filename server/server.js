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

/* ================= SECURITY ================= */
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests. Please try again later." }
});
app.use(limiter);

app.use(compression());

/* ================= CORS ================= */
// Comma-separated list of allowed origins in CLIENT_URL, e.g.
// CLIENT_URL=http://localhost:5173,https://kharchee.netlify.app
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim());

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
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
