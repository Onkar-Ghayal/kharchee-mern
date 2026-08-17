const mongoose = require("mongoose");
const dns = require("dns");

// Use public DNS (Google & Cloudflare) to resolve MongoDB Atlas SRV records reliably on all ISPs (Jio, Airtel, WiFi)
try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (dnsErr) {
    // Keep default if system prevents custom DNS
}

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error("❌ MONGO_URI is missing in server/.env. Please add your MongoDB Atlas connection string.");
        return;
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        });
        console.log("✅ MongoDB Atlas connected successfully!");
    } catch (error) {
        console.error("❌ MongoDB Atlas connection failed:", error.message);
        console.error(`Using Mongo URI: ${mongoUri.replace(/:([^:@]+)@/, ":****@")}`);
        console.error("\n💡 To fix MongoDB Atlas connection:");
        console.error("1. Go to MongoDB Atlas (https://cloud.mongodb.com) -> Network Access");
        console.error("2. Ensure '0.0.0.0/0' (Allow access from anywhere) is added and Active.");
        console.error("3. Ensure Database User password in server/.env has no unencoded special characters.\n");
    }
};

module.exports = connectDB;
