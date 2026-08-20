const mongoose = require("mongoose");

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
